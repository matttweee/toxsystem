const SUPABASE_URL='https://yfshvjxucvmyvahcwczx.supabase.co';
const SUPABASE_KEY='sb_publishable_5cfq5V51rRtbd031ELhFzw_9T2pAK1y';
function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
async function rpc(name,body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
 if(req.method!=='GET') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 try{
   const id=String(req.query?.client_id||'').trim();
   if(!id) return json(res,400,{error:'CLIENT_ID_REQUIRED'});
   const rows=await rpc('tox_demo_status',{p_client_id:id});
   const c=Array.isArray(rows)?rows[0]:rows;
   if(!c) return json(res,404,{error:'CLIENT_NOT_FOUND'});
   return json(res,200,{...c,documents_accepted:c.status==='DEMO_ACTIVE'||c.status==='DEMO_EXPIRED'||String(c.status||'').startsWith('REAL_'),download_url:`/api/public/demo/download?client_id=${encodeURIComponent(c.client_id)}`});
 }catch(e){return json(res,500,{error:'STATUS_FAILED',detail:String(e.message||e).slice(0,220)})}
}
