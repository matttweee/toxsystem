import {db,ready,json} from '../../_lib/tox-db.js';
export default async function handler(req,res){
 if(req.method!=='GET') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 if(!ready()) return json(res,503,{error:'BACKEND_NOT_CONFIGURED'});
 try{const id=String(req.query?.client_id||'');const c=await db.getClientByPublicId(id);if(!c)return json(res,404,{error:'CLIENT_NOT_FOUND'});
 let status=c.status;const now=Date.now();if(c.demo_expires_at&&now>Date.parse(c.demo_expires_at)&&status==='DEMO_ACTIVE'){status='DEMO_EXPIRED';await db.patchClient(c.id,{status});}
 const a=await db.latestAcceptance(c.id);return json(res,200,{client_id:c.client_id,status,demo_started_at:c.demo_started_at,demo_expires_at:c.demo_expires_at,conversion_deadline:c.conversion_deadline,documents_accepted:Boolean(a),referral_code:c.referral_code});
 }catch(e){return json(res,500,{error:'STATUS_FAILED',detail:String(e.message||e).slice(0,180)})}}
