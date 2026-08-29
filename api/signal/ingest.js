const SUPABASE_URL='https://yfshvjxucvmyvahcwczx.supabase.co';
const SUPABASE_KEY='sb_publishable_5cfq5V51rRtbd031ELhFzw_9T2pAK1y';
function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}
async function rpc(body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/tox_signal_ingest`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 try{
   const b=req.body||{};
   const token=String(req.headers['x-tox-bridge-token']||b.token||'');
   if(!token)return json(res,401,{error:'BRIDGE_TOKEN_REQUIRED'});
   const rows=await rpc({p_token:token,p_event_id:String(b.event_id||''),p_event_type:String(b.event_type||''),p_symbol:b.symbol||null,p_side:b.side||null,p_position_reference:b.position_reference||null,p_source_ts:b.source_ts||null,p_expires_at:b.expires_at||null});
   const row=Array.isArray(rows)?rows[0]:rows;
   return json(res,200,{ok:true,...row});
 }catch(e){const d=String(e.message||e);return json(res,d.includes('BRIDGE_UNAUTHORIZED')?403:400,{error:d.includes('BRIDGE_UNAUTHORIZED')?'BRIDGE_UNAUTHORIZED':'INGEST_FAILED',detail:d.slice(0,220)})}
}
