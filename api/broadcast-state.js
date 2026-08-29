export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  const base=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key) return res.status(503).json({ok:false,error:'STORAGE_NOT_CONFIGURED'});
  try{
    const r=await fetch(`${base}/rest/v1/tox_public_broadcast_state?id=eq.1&select=state,updated_at`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store'});
    if(!r.ok) return res.status(503).json({ok:false,error:'STATE_UNAVAILABLE'});
    const rows=await r.json();
    if(!rows?.[0]) return res.status(503).json({ok:false,error:'STATE_EMPTY'});
    return res.status(200).json({...rows[0].state,updated_at:rows[0].updated_at});
  }catch{return res.status(503).json({ok:false,error:'BRIDGE_OFFLINE'});}
}