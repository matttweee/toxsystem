import {db,ready,json} from '../../_lib/tox-db.js';
const V={contract:'TOX-DEMO-CONTRACT-v1.1-PENDING-COMPANY-REG',regulation:'TOX-DEMO-RULES-v1.1',privacy:'TOX-PRIVACY-v1.1'};
export default async function handler(req,res){
 if(req.method!=='POST') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
 if(!ready()) return json(res,503,{error:'BACKEND_NOT_CONFIGURED'});
 if(process.env.TOX_LEGAL_FINAL!=='true') return json(res,423,{error:'LEGAL_NOT_FINAL',message:'Contratto bloccato finché i dati societari definitivi non sono registrati.'});
 try{const id=String(req.body?.client_id||'');const c=await db.getClientByPublicId(id);if(!c)return json(res,404,{error:'CLIENT_NOT_FOUND'});
 await db.addAcceptance({client_id:c.id,contract_version:V.contract,regulation_version:V.regulation,privacy_version:V.privacy,user_agent:String(req.headers['user-agent']||'').slice(0,500)});
 const now=new Date(), exp=new Date(now.getTime()+42*864e5), conv=new Date(exp.getTime()+45*864e5);
 const next=c.demo_started_at?c:await db.patchClient(c.id,{status:'DEMO_ACTIVE',demo_started_at:now.toISOString(),demo_expires_at:exp.toISOString(),conversion_deadline:conv.toISOString()});
 await db.addAudit({client_id:c.id,event_type:'DOCUMENTS_ACCEPTED',payload:{versions:V}});
 return json(res,200,{client_id:next.client_id,status:next.status,demo_expires_at:next.demo_expires_at,conversion_deadline:next.conversion_deadline});
 }catch(e){return json(res,500,{error:'ACCEPT_FAILED',detail:String(e.message||e).slice(0,180)})}}
