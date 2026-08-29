const SUPABASE_URL='https://yfshvjxucvmyvahcwczx.supabase.co';
const SUPABASE_KEY='sb_publishable_5cfq5V51rRtbd031ELhFzw_9T2pAK1y';
function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
async function rpc(name,body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
 if(req.method!=='POST') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 try{
   const id=String(req.body?.client_id||'').trim();
   if(!id) return json(res,400,{error:'CLIENT_ID_REQUIRED'});
   const rows=await rpc('tox_demo_accept',{p_client_id:id});
   const client=Array.isArray(rows)?rows[0]:rows;
   if(!client) return json(res,404,{error:'CLIENT_NOT_FOUND'});
   return json(res,200,{...client,documents:{contract:'TOX-DEMO-CONTRACT-v1.0',regulation:'TOX-DEMO-RULES-v1.2',privacy:'TOX-PRIVACY-v1.2'},download_url:`/api/public/demo/download?client_id=${encodeURIComponent(client.client_id)}`});
 }catch(e){const d=String(e.message||e);return json(res,d.includes('CLIENT_NOT_FOUND')?404:500,{error:d.includes('CLIENT_NOT_FOUND')?'CLIENT_NOT_FOUND':'ACCEPT_FAILED',detail:d.slice(0,220)})}
}
