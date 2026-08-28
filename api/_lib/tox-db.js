const BASE=()=>process.env.SUPABASE_URL;
const KEY=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
export function ready(){return Boolean(BASE()&&KEY())}
async function req(path,{method='GET',body,headers={}}={}){
  if(!ready()) throw new Error('SUPABASE_NOT_CONFIGURED');
  const r=await fetch(`${BASE()}/rest/v1/${path}`,{method,headers:{apikey:KEY(),Authorization:`Bearer ${KEY()}`,'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined});
  const text=await r.text();
  if(!r.ok) throw new Error(`SUPABASE_${r.status}:${text.slice(0,300)}`);
  return text?JSON.parse(text):null;
}
export const db={
  getClientByEmail: async email => (await req(`tox_clients?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*&limit=1`))?.[0]||null,
  getClientByPublicId: async id => (await req(`tox_clients?client_id=eq.${encodeURIComponent(id)}&select=*&limit=1`))?.[0]||null,
  getClientByReferral: async code => (await req(`tox_clients?referral_code=eq.${encodeURIComponent(code.toUpperCase())}&select=id,client_id,referral_code&limit=1`))?.[0]||null,
  createClient: async row => (await req('tox_clients',{method:'POST',body:row,headers:{Prefer:'return=representation'}}))?.[0],
  patchClient: async (uuid,patch) => (await req(`tox_clients?id=eq.${uuid}`,{method:'PATCH',body:{...patch,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}}))?.[0],
  addAcceptance: async row => (await req('tox_document_acceptances',{method:'POST',body:row,headers:{Prefer:'return=representation,resolution=merge-duplicates'}}))?.[0],
  latestAcceptance: async uuid => (await req(`tox_document_acceptances?client_id=eq.${uuid}&select=*&order=accepted_at.desc&limit=1`))?.[0]||null,
  addReferral: async row => (await req('tox_referral_relationships',{method:'POST',body:row,headers:{Prefer:'return=representation'}}))?.[0],
  addAudit: async row => req('tox_audit_events',{method:'POST',body:row,headers:{Prefer:'return=minimal'}})
};
export function json(res,status,data){res.status(status).setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
export function clientIpHash(req){return null}
