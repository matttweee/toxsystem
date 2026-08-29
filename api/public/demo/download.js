import fs from 'fs';
import path from 'path';
const SUPABASE_URL='https://yfshvjxucvmyvahcwczx.supabase.co';
const SUPABASE_KEY='sb_publishable_5cfq5V51rRtbd031ELhFzw_9T2pAK1y';
async function rpc(name,body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
 if(req.method!=='GET'){res.status(405).json({error:'METHOD_NOT_ALLOWED'});return}
 try{
   const id=String(req.query?.client_id||'').trim();
   if(!id){res.status(400).json({error:'CLIENT_ID_REQUIRED'});return}
   const rows=await rpc('tox_demo_status',{p_client_id:id});
   const c=Array.isArray(rows)?rows[0]:rows;
   if(!c){res.status(404).json({error:'CLIENT_NOT_FOUND'});return}
   if(!['DEMO_ACTIVE','REAL_PENDING_PAYMENT','REAL_PAYING','REAL_SETTLED'].includes(c.status)){res.status(403).json({error:'DEMO_NOT_ACTIVE',status:c.status});return}
   if(c.demo_expires_at && Date.now()>Date.parse(c.demo_expires_at) && c.status==='DEMO_ACTIVE'){res.status(403).json({error:'DEMO_EXPIRED'});return}
   const b64=fs.readFileSync(path.join(process.cwd(),'downloads','TOX_CLIENT_DEMO_V001.zip.b64'),'utf8').trim();
   const buf=Buffer.from(b64,'base64');
   res.setHeader('Content-Type','application/zip');
   res.setHeader('Content-Disposition','attachment; filename="TOX_CLIENT_DEMO_V001.zip"');
   res.setHeader('Content-Length',String(buf.length));
   res.setHeader('Cache-Control','private, no-store');
   res.status(200).end(buf);
 }catch(e){res.status(500).json({error:'DOWNLOAD_FAILED',detail:String(e.message||e).slice(0,220)})}
}
