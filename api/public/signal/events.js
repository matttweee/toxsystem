const SUPABASE_URL='https://yfshvjxucvmyvahcwczx.supabase.co';
const SUPABASE_KEY='sb_publishable_5cfq5V51rRtbd031ELhFzw_9T2pAK1y';
function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.setHeader('Cache-Control','private, no-store');res.end(JSON.stringify(data))}
async function rpc(body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/tox_signal_fetch`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 try{
   const id=String(req.query?.client_id||'').trim();
   const since=Math.max(0,Number(req.query?.since||0)||0);
   if(!id)return json(res,400,{error:'CLIENT_ID_REQUIRED'});
   const rows=await rpc({p_client_id:id,p_since:since});
   return json(res,200,{events:Array.isArray(rows)?rows:[],server_time:new Date().toISOString()});
 }catch(e){const d=String(e.message||e);let status=400,err='SIGNAL_FETCH_FAILED';if(d.includes('CLIENT_NOT_FOUND')){status=404;err='CLIENT_NOT_FOUND'}else if(d.includes('DEMO_NOT_ACTIVE')){status=403;err='DEMO_NOT_ACTIVE'}else if(d.includes('DEMO_EXPIRED')){status=403;err='DEMO_EXPIRED'}return json(res,status,{error:err,detail:d.slice(0,220)})}
}
