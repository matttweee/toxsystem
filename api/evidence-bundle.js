const JSZip=require('jszip');

const SOURCES=[
  // Original V003.4 publication chain — keep intact
  ['01_ORIGINAL_V0034/TOX_PUBLIC_HISTORICAL_EVIDENCE_V0034_20260822T224044Z.zip','https://drive.google.com/uc?export=download&id=1T9KDfa4WrSV7bouusleiZuqOT8K6nCOD'],
  ['01_ORIGINAL_V0034/TOX_PUBLIC_FORWARD_EVIDENCE_V0034_20260822T224044Z.zip','https://drive.google.com/uc?export=download&id=1-N0x4M8zlDsi24OEmS9EmlVAiivpnTKE'],
  ['01_ORIGINAL_V0034/TOX_PUBLIC_CURRENT_SNAPSHOT_V0034_20260822T224044Z.zip','https://drive.google.com/uc?export=download&id=1_7WVTVvICsCrBIzORj1YxBJhdPxzq7E6'],
  ['01_ORIGINAL_V0034/TOX_PUBLIC_AI_REVIEW_BUNDLE_V0034_20260822T224044Z.zip','https://drive.google.com/uc?export=download&id=1W_6z8QF3OLBpZb7NEkpugwCC-Z65vzs0'],
  ['01_ORIGINAL_V0034/PUBLICATION_MANIFEST_V0034.json','https://drive.google.com/uc?export=download&id=1TESHX-IT34khc2TmJQPp-9bc6Wy1w2OL'],
  ['01_ORIGINAL_V0034/PUBLICATION_TRIBUNAL_VERDICT_V0034.json','https://drive.google.com/uc?export=download&id=1NhCcAxGxbGQwj5S-Ab1XYExCM1zPTSWD'],

  // Evidence added after V003.4 — deliberately separate
  ['02_POST_FREEZE/TOX_POST_FREEZE_PROSPECTIVE_EVIDENCE_PUBLIC.zip','https://drive.google.com/uc?export=download&id=17YRWDQtpmReL7Qd54AfXd7YNCC1GT0RU'],
  ['03_CAPITAL_EXECUTABILITY/TOX_CAPITAL_EXECUTABILITY_EVIDENCE_PUBLIC_V003.zip','https://drive.google.com/uc?export=download&id=1LlFyi6dumLAFopyIaHqjy4hR-0lgWCgt'],
  ['04_RESEARCH_CANDIDATE/TOX_LARGE_SCALE_MANAGEMENT_RESEARCH_PUBLIC_V002.zip','https://drive.google.com/uc?export=download&id=1L8llXG27UsHA-1WDF-MsY0VXS6cbFZmA']
];

const PROMPT=`Agisci come revisore quantitativo avversariale indipendente. Analizza TOX_ALL_EVIDENCE_PUBLIC.zip e prova a confutare le conclusioni, non a confermarle. Parti dalla prova originale V003.4 e controlla manifest, hash, verifier, cross-asset robustness, LOAO, clustered confidence bounds, cost stress, outlier robustness, HST1 e catena temporale. Poi valuta SEPARATAMENTE: A) evidenza successiva al freeze; B) eseguibilità con capitale finito; C) ricerca candidata successiva. Non usare C per giustificare retroattivamente A o la strategia originale. Controlla se i numeri dichiarati sono supportati dai file e segnala incoerenze, limiti, dati non riproducibili o claim troppo forti. Rispondi con: 1) COSA È PROVATO; 2) COSA È SUPPORTATO MA NON CONCLUSIVO; 3) COSA NON È PROVATO; 4) eventuali RED FLAGS; 5) VERDETTO finale: FORTE / INTERESSANTE MA NON CONCLUSIVO / DEBOLE. Non fare marketing e non tentare di ricostruire le regole proprietarie della strategia.`;

const README=`TOX SYSTEM — PUBLIC EVIDENCE BUNDLE\n\nQuesto ZIP conserva la catena probatoria originale V003.4 e aggiunge, senza sostituirla, le evidenze successive.\n\nORDINE DI LETTURA:\n1) 01_ORIGINAL_V0034 — prova originale, manifest, verifier e catena temporale\n2) 02_POST_FREEZE — evidenza successiva al freeze\n3) 03_CAPITAL_EXECUTABILITY — test di eseguibilità con capitale finito\n4) 04_RESEARCH_CANDIDATE — ricerca successiva separata dalla strategia originale\n5) PROMPT_AI.txt — prompt avversariale consigliato\n\nIMPORTANTE:\n- La ricerca candidata non deve essere usata per riscrivere retroattivamente la prova originale.\n- I risultati storici, simulati o post-freeze non garantiscono risultati futuri.\n- Il pacchetto pubblico evita di esporre le regole proprietarie della strategia.\n`;

module.exports=async(req,res)=>{
  try{
    const zip=new JSZip();
    for(const [name,url] of SOURCES){
      const r=await fetch(url,{redirect:'follow'});
      if(!r.ok) throw new Error(`Download failed ${name}: ${r.status}`);
      const ab=await r.arrayBuffer();
      zip.file(name,Buffer.from(ab));
    }
    zip.file('00_READ_ME_FIRST.txt',README);
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
