const SUPABASE_URL='https://yfshvjxucvmyvahcwczx.supabase.co';
const SUPABASE_KEY='sb_publishable_5cfq5V51rRtbd031ELhFzw_9T2pAK1y';
function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
async function rpc(name,body){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();if(!r.ok)throw new Error(`${r.status}:${text}`);return text?JSON.parse(text):null}
export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
  try{
    const {email,display_name,referral_code}=req.body||{};
    const e=String(email||'').trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return json(res,400,{error:'INVALID_EMAIL'});
    const rows=await rpc('tox_demo_register',{p_email:e,p_display_name:String(display_name||'').trim().slice(0,120)||null,p_referral_code:String(referral_code||'').trim()||null});
    const client=Array.isArray(rows)?rows[0]:rows;
    if(!client) return json(res,500,{error:'REGISTER_EMPTY'});
    return json(res,200,client);
  }catch(e){return json(res,500,{error:'REGISTER_FAILED',detail:String(e.message||e).slice(0,220)})}
}
