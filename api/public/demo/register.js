import {db,ready,json} from '../../_lib/tox-db.js';
export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
  if(!ready()) return json(res,503,{error:'BACKEND_NOT_CONFIGURED'});
  try{
    const {email,display_name,referral_code}=req.body||{};
    const e=String(email||'').trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return json(res,400,{error:'INVALID_EMAIL'});
    let client=await db.getClientByEmail(e);
    if(!client){
      let referrer=null;
      if(referral_code) referrer=await db.getClientByReferral(String(referral_code));
      client=await db.createClient({email:e,display_name:String(display_name||'').trim().slice(0,120)||null,referred_by_client_id:referrer?.id||null});
      if(referrer && referrer.id!==client.id){try{await db.addReferral({referrer_client_id:referrer.id,referred_client_id:client.id})}catch{}}
      await db.addAudit({client_id:client.id,event_type:'DEMO_REGISTERED',payload:{referral:Boolean(referrer)}});
    }
    return json(res,200,{client_id:client.client_id,status:client.status,referral_code:client.referral_code});
  }catch(e){return json(res,500,{error:'REGISTER_FAILED',detail:String(e.message||e).slice(0,180)})}
}
