from __future__ import annotations
import threading,time,webbrowser,requests
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from .store import load_settings,save_settings,load_state,save_state,set_secret,get_secret,ensure_device_token,get_device_token
from .bybit import BybitDemo
ROOT=Path(__file__).resolve().parent
AUTO_GATE='https://mohncnsplqtarmobmcie.supabase.co/functions/v1/tox-demo-autobind'
app=FastAPI(title='TOX CLIENT DEMO V006')
app.add_middleware(CORSMiddleware,allow_origins=['https://www.toxsystem.it','https://toxsystem.it'],allow_credentials=False,allow_methods=['GET','POST','OPTIONS'],allow_headers=['Content-Type'])
app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
settings=load_settings(); state=load_state(); stop=False; last_error=''; server_status='LOCKED'; bybit_status='DISCONNECTED'
class Config(BaseModel): leverage:int=5;capital_pct:int=10;max_positions:int=10;c_auto_exit:bool=False
class AutoBind(BaseModel): api_key:str;api_secret:str
def client():
    k,s=get_secret()
    if not k or not s: raise RuntimeError('Inserisci API Bybit DEMO')
    return BybitDemo(k,s)
def snapshot():
    global bybit_status
    eq=av=0; pos=[]
    if settings.get('bound'):
        try:
            b=client(); eq,av=b.equity(); pos=b.positions(); bybit_status='CONNECTED'
        except Exception: bybit_status='DISCONNECTED'
    return {'settings':settings,'installation_id':state['installation_id'],'server_status':server_status,'bybit_status':bybit_status,'equity':eq,'available':av,'positions':pos,'history':state['history'][-100:],'last_error':last_error,'real_orders_possible':False}
@app.get('/')
def home(): return FileResponse(ROOT/'static'/'index.html')
@app.get('/api/status')
def status(): return snapshot()
@app.post('/api/bind-auto')
def bind_auto(b:AutoBind):
    global settings,last_error
    try:
        key=b.api_key.strip(); sec=b.api_secret.strip()
        if not key or not sec: raise RuntimeError('API_BYBIT_OBBLIGATORIE')
        temp=BybitDemo(key,sec)
        uid_local,kyc_local=temp.account_identity()
        proof=temp.query_api_proof(); device=ensure_device_token()
        payload={'installation_id':state['installation_id'],'device_token':device,**proof}
        r=requests.post(AUTO_GATE,json=payload,timeout=20); d=r.json()
        if not r.ok: raise RuntimeError(d.get('detail') or d.get('error') or 'BIND_FAILED')
        if str(d.get('bybit_uid') or '')!=str(uid_local): raise RuntimeError('BYBIT_UID_PROOF_MISMATCH')
        set_secret(key,sec)
        settings.update({'client_id':str(d.get('client_id') or ''),'bound':True,'bybit_uid':str(d.get('bybit_uid') or uid_local),'trading':False})
        save_settings(settings); last_error=''
        return {'ok':True,'status':d.get('status'),'bybit_uid':settings['bybit_uid'],'kyc_level':d.get('kyc_level') or kyc_local,'demo_expires_at':d.get('demo_expires_at')}
    except Exception as e:
        last_error=str(e); raise HTTPException(status_code=400,detail=last_error)
@app.post('/api/config')
def config(c:Config):
    global settings
    if not settings.get('bound'): raise HTTPException(status_code=403,detail='BYBIT_BIND_REQUIRED')
    if c.leverage not in (1,3,5,10): raise HTTPException(status_code=400,detail='LEVERAGE_INVALID')
    if c.capital_pct not in (10,25): raise HTTPException(status_code=400,detail='CAPITAL_INVALID')
    if c.max_positions not in (1,3,5,10): raise HTTPException(status_code=400,detail='MAX_POSITIONS_INVALID')
    settings.update(c.model_dump()); save_settings(settings); return {'ok':True}
@app.post('/api/test-bybit')
def test_bybit():
    if not settings.get('bound'): raise HTTPException(status_code=403,detail='BYBIT_BIND_REQUIRED')
    b=client(); uid,kyc=b.account_identity(); eq,av=b.equity(); return {'ok':True,'equity':eq,'available':av,'host':'api-demo.bybit.com','bybit_uid':uid,'kyc_level':kyc}
@app.post('/api/trading/{mode}')
def trading(mode:str):
    if not settings.get('bound'): raise HTTPException(status_code=403,detail='BYBIT_BIND_REQUIRED')
    settings['trading']=mode.lower()=='on';save_settings(settings);return {'ok':True,'trading':settings['trading']}
def handle_event(ev):
    global last_error
    eid=str(ev.get('event_id') or ''); seq=int(ev.get('server_sequence') or 0)
    if not eid or eid in state['processed'] or seq<=state['last_sequence']: return
    typ=ev.get('event_type'); symbol=str(ev.get('symbol') or '').upper(); ref=ev.get('position_reference')
    try:
        if typ=='SYSTEM_STATUS':
            state['processed']=(state['processed']+[eid])[-5000:]; state['last_sequence']=max(state['last_sequence'],seq);save_state(state); return
        b=client()
        if typ=='ENTRY':
            if not settings.get('trading'): return
            pos=b.positions()
            if len(pos)>=settings['max_positions']: raise RuntimeError('MAX_POSITIONS_REACHED')
            if any(p.get('symbol')==symbol and float(p.get('size') or 0)>0 for p in pos): raise RuntimeError('SYMBOL_ALREADY_OPEN')
            lev=settings['leverage']; b.set_leverage(symbol,lev); qty=b.qty_for(symbol,settings['capital_pct'],lev); r=b.market_entry(symbol,ev.get('side'),qty)
            state['history'].append({'time':time.time(),'type':'ENTRY','symbol':symbol,'side':ev.get('side'),'qty':qty,'leverage':lev,'order':r.get('result',{}).get('orderId'),'event_id':eid})
        elif typ in ('FROZEN_EXIT','C_EXIT_SUGGESTED'):
            if typ=='C_EXIT_SUGGESTED' and not settings.get('c_auto_exit'):
                state['history'].append({'time':time.time(),'type':'C_ADVISORY','symbol':symbol,'event_id':eid}); return
            pos=b.positions(); target=next((p for p in pos if (symbol and p.get('symbol')==symbol) or (ref and p.get('symbol')==ref)),None)
            if target:
                r=b.close_position(target['symbol'],target['side'],target['size'])
                state['history'].append({'time':time.time(),'type':typ,'symbol':target['symbol'],'qty':target['size'],'order':r.get('result',{}).get('orderId'),'event_id':eid})
        state['processed']=(state['processed']+[eid])[-5000:]; state['last_sequence']=max(state['last_sequence'],seq);save_state(state)
    except Exception as e:
        last_error=str(e); state['history'].append({'time':time.time(),'type':'ERROR','event_id':eid,'error':last_error});save_state(state)
def poll_loop():
    global server_status,last_error
    while not stop:
        if not settings.get('bound'):
            server_status='LOCKED'; time.sleep(2); continue
        try:
            url=settings.get('server_url','').rstrip('/'); device=get_device_token()
            if not url or not device: raise RuntimeError('CLIENT_BINDING_MISSING')
            r=requests.get(url+'/events',params={'client_id':settings.get('client_id',''),'installation_id':state['installation_id'],'device_token':device,'since':state['last_sequence']},timeout=10)
            r.raise_for_status(); d=r.json(); server_status='CONNECTED'
            for ev in d.get('events',[]): handle_event(ev)
        except Exception as e: server_status='DISCONNECTED'; last_error=str(e)
        time.sleep(3)
def run():
    threading.Thread(target=poll_loop,daemon=True).start()
    import uvicorn
    threading.Timer(1.4,lambda:webbrowser.open('http://127.0.0.1:8791/')).start();uvicorn.run(app,host='127.0.0.1',port=8791,log_level='warning')
