const JSZip=require('jszip');
const SOURCES=[
['TOX_POST_FREEZE_PROSPECTIVE_EVIDENCE_PUBLIC.zip','https://drive.google.com/uc?export=download&id=17YRWDQtpmReL7Qd54AfXd7YNCC1GT0RU'],
['TOX_CAPITAL_EXECUTABILITY_EVIDENCE_PUBLIC_V003.zip','https://drive.google.com/uc?export=download&id=1LlFyi6dumLAFopyIaHqjy4hR-0lgWCgt'],
['TOX_LARGE_SCALE_MANAGEMENT_RESEARCH_PUBLIC_V002.zip','https://drive.google.com/uc?export=download&id=1L8llXG27UsHA-1WDF-MsY0VXS6cbFZmA']
];
const PROMPT=`Analizza il pacchetto TOX allegato come revisore indipendente. Non fidarti delle conclusioni scritte nei file: controlla dati e integrità disponibile. Rispondimi in massimo 12 righe: 1) la strategia originale mostra davvero un risultato positivo su asset e periodi diversi? 2) il test post-freeze supporta che il risultato sia rimasto positivo dopo il congelamento? 3) il flusso operativo testato è gestibile con il capitale dichiarato? 4) la ricerca successiva migliora davvero i risultati senza confonderla con la strategia originale? 5) cosa è dimostrato e cosa non è dimostrato? Concludi: FORTE, INTERESSANTE MA NON CONCLUSIVO oppure DEBOLE. Niente marketing.`;
module.exports=async(req,res)=>{
 try{
  const zip=new JSZip();
  for(const [name,url] of SOURCES){
   const r=await fetch(url,{redirect:'follow'});
   if(!r.ok) throw new Error(`Download failed ${name}: ${r.status}`);
   const ab=await r.arrayBuffer();
   zip.file(name,Buffer.from(ab));
  }
  zip.file('PROMPT_AI.txt',PROMPT);
  const out=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}});
  res.setHeader('Content-Type','application/zip');
  res.setHeader('Content-Disposition','attachment; filename="TOX_ALL_EVIDENCE_PUBLIC.zip"');
  res.setHeader('Cache-Control','public, max-age=300');
  res.status(200).send(out);
 }catch(e){
  res.status(500).json({error:'bundle_generation_failed',message:String(e.message||e)});
 }
};
