const SUPABASE_URL='https://mohncnsplqtarmobmcie.supabase.co';
const SUPABASE_KEY='sb_publishable_1ZbPyCuvEXUNkic1Z7nnpw_ztPMyj1J';
function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.setHeader('Cache-Control','private, no-store');res.end(JSON.stringify(data))}
async function rpc(body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/tox_signal_fetch`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 try{
  const client_id=String(req.query?.client_id||'').trim(),installation_id=String(req.query?.installation_id||'').trim(),device_token=String(req.query?.device_token||'').trim();const since=Math.max(0,Number(req.query?.since||0)||0);
  if(!client_id||!installation_id||!device_token)return json(res,400,{error:'BINDING_REQUIRED'});
  const rows=await rpc({p_client_id:client_id,p_installation_id:installation_id,p_device_token:device_token,p_since:since});return json(res,200,{events:Array.isArray(rows)?rows:[],server_time:new Date().toISOString()});
 }catch(e){const d=String(e.message||e);let status=403,err='SIGNAL_FETCH_FAILED';if(d.includes('CLIENT_NOT_FOUND')){status=404;err='CLIENT_NOT_FOUND'}else if(d.includes('DEMO_EXPIRED'))err='DEMO_EXPIRED';else if(d.includes('INSTALLATION_NOT_BOUND'))err='INSTALLATION_NOT_BOUND';else if(d.includes('DEVICE_TOKEN_INVALID'))err='DEVICE_TOKEN_INVALID';else if(d.includes('DEMO_NOT_ACTIVE'))err='DEMO_NOT_ACTIVE';return json(res,status,{error:err,detail:d.slice(0,220)})}
}
