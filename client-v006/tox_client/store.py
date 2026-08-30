from pathlib import Path
import json,uuid,secrets
ROOT=Path.home()/'.toxsystem'; ROOT.mkdir(exist_ok=True)
SETTINGS=ROOT/'settings.json'; STATE=ROOT/'state.json'
def load_settings():
    d={'client_id':'','server_url':'https://www.toxsystem.it/api/public/signal-v2','leverage':5,'capital_pct':10,'max_positions':10,'c_auto_exit':False,'trading':False,'bound':False,'bybit_uid':''}
    if SETTINGS.exists():
        try:d.update(json.loads(SETTINGS.read_text(encoding='utf-8')))
        except:pass
    return d
def save_settings(d): SETTINGS.write_text(json.dumps(d,indent=2),encoding='utf-8')
def load_state():
    d={'installation_id':str(uuid.uuid4()),'last_sequence':0,'processed':[],'history':[]}
    if STATE.exists():
        try:d.update(json.loads(STATE.read_text(encoding='utf-8')))
        except:pass
    save_state(d);return d
def save_state(d): STATE.write_text(json.dumps(d,indent=2),encoding='utf-8')
def set_secret(key,secret):
    import keyring
    keyring.set_password('TOX_SYSTEM','BYBIT_DEMO_KEY',key);keyring.set_password('TOX_SYSTEM','BYBIT_DEMO_SECRET',secret)
def get_secret():
    try:
        import keyring
        return keyring.get_password('TOX_SYSTEM','BYBIT_DEMO_KEY') or '',keyring.get_password('TOX_SYSTEM','BYBIT_DEMO_SECRET') or ''
    except:return '',''
def set_device_token(v):
    import keyring; keyring.set_password('TOX_SYSTEM','DEVICE_TOKEN',v)
def get_device_token():
    try:
        import keyring; return keyring.get_password('TOX_SYSTEM','DEVICE_TOKEN') or ''
    except:return ''
def ensure_device_token():
    v=get_device_token()
    if not v:
        v=secrets.token_hex(32); set_device_token(v)
    return v
