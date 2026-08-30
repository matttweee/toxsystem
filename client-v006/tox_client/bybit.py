from __future__ import annotations
import time,hmac,hashlib,json,requests
from urllib.parse import urlencode
BASE='https://api-demo.bybit.com'
class BybitDemo:
    def __init__(self,key,secret): self.key=key.strip(); self.secret=secret.strip(); self.recv='5000'
    def _headers(self,payload):
        ts=str(int(time.time()*1000)); raw=ts+self.key+self.recv+payload
        sig=hmac.new(self.secret.encode(),raw.encode(),hashlib.sha256).hexdigest()
        return {'X-BAPI-API-KEY':self.key,'X-BAPI-TIMESTAMP':ts,'X-BAPI-RECV-WINDOW':self.recv,'X-BAPI-SIGN':sig,'Content-Type':'application/json'}
    def get(self,path,params=None):
        q=urlencode(params or {}); r=requests.get(BASE+path+('?' + q if q else ''),headers=self._headers(q),timeout=15); d=r.json()
        if r.status_code!=200 or d.get('retCode') not in (0,None): raise RuntimeError(f"BYBIT {d.get('retCode')}: {d.get('retMsg')}")
        return d
    def post(self,path,data):
        payload=json.dumps(data,separators=(',',':')); r=requests.post(BASE+path,data=payload,headers=self._headers(payload),timeout=15); d=r.json()
        if r.status_code!=200 or d.get('retCode') not in (0,None): raise RuntimeError(f"BYBIT {d.get('retCode')}: {d.get('retMsg')}")
        return d
    def query_api_proof(self):
        ts=str(int(time.time()*1000)); payload=''; raw=ts+self.key+self.recv+payload
        sig=hmac.new(self.secret.encode(),raw.encode(),hashlib.sha256).hexdigest()
        return {'api_key':self.key,'timestamp':ts,'recv_window':self.recv,'signature':sig}
    def account_identity(self):
        d=self.get('/v5/user/query-api'); r=d.get('result') or {}
        uid=str(r.get('userID') or r.get('userId') or r.get('uid') or '')
        kyc=str(r.get('kycLevel') or r.get('kyc_level') or 'UNKNOWN')
        return uid,kyc
    def equity(self):
        d=self.get('/v5/account/wallet-balance',{'accountType':'UNIFIED'}); a=(d.get('result',{}).get('list') or [{}])[0]
        return float(a.get('totalEquity') or 0), float(a.get('totalAvailableBalance') or 0)
    def positions(self):
        d=self.get('/v5/position/list',{'category':'linear','settleCoin':'USDT'}); out=[]
        for p in d.get('result',{}).get('list',[]):
            if float(p.get('size') or 0)>0: out.append(p)
        return out
    def ticker(self,symbol):
        r=requests.get(BASE+'/v5/market/tickers',params={'category':'linear','symbol':symbol},timeout=15).json(); x=(r.get('result',{}).get('list') or [{}])[0]
        return float(x.get('lastPrice') or 0)
    def instrument(self,symbol):
        r=requests.get(BASE+'/v5/market/instruments-info',params={'category':'linear','symbol':symbol},timeout=15).json(); return (r.get('result',{}).get('list') or [{}])[0]
    def set_leverage(self,symbol,lev):
        return self.post('/v5/position/set-leverage',{'category':'linear','symbol':symbol,'buyLeverage':str(lev),'sellLeverage':str(lev)})
    def qty_for(self,symbol,capital_pct,lev):
        eq,_=self.equity(); px=self.ticker(symbol); info=self.instrument(symbol); lf=info.get('lotSizeFilter',{}); step=float(lf.get('qtyStep') or 0.001); minq=float(lf.get('minOrderQty') or step)
        raw=(eq*capital_pct/100.0*lev)/px if px else 0
        q=(int(raw/step))*step
        if q<minq: q=minq
        dec=max(0,len(str(step).split('.')[-1].rstrip('0'))) if '.' in str(step) else 0
        return round(q,dec)
    def market_entry(self,symbol,direction,qty):
        side='Buy' if str(direction).upper() in ('CALL','BUY') else 'Sell'
        return self.post('/v5/order/create',{'category':'linear','symbol':symbol,'side':side,'orderType':'Market','qty':str(qty),'positionIdx':0})
    def close_position(self,symbol,side,size):
        close_side='Sell' if side=='Buy' else 'Buy'
        return self.post('/v5/order/create',{'category':'linear','symbol':symbol,'side':close_side,'orderType':'Market','qty':str(size),'reduceOnly':True,'positionIdx':0})
