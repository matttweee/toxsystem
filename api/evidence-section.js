const JSZip=require('jszip');

const MASTER_URL='https://drive.google.com/uc?export=download&id=1xgTlHdFeGU1Iy6gkQEbr_epYSG8NwZ9o';
const ROOT='TOX_PUBLIC_EVIDENCE_MASTER_V001/';

const COMMON=['evidence/scope_map.json','evidence/identity_map.json','methodology/definitions.md','methodology/limitations.md'];
const SECTIONS={
  foundation:{
    name:'TOX_VERIFICA_EDGE_STORICO.zip',
    files:['evidence/historical_summary.json','data/performance_summary.csv','data/robustness_summary.csv','data/cost_sensitivity.csv','data/distribution_summary.csv','data/period_summary.csv',...COMMON],
    readme:'TOX SYSTEM — VERIFICA EDGE STORICO\n\nEstratto pertinente del MASTER V001 per controllare storico, robustezza, costi, distribuzione e periodi. Per la verifica integrale del pacchetto pubblico usare TOX_PUBLIC_EVIDENCE_MASTER_V001.zip.\n'
  },
  postfreeze:{
    name:'TOX_VERIFICA_POST_FREEZE.zip',
    files:['evidence/post_freeze_summary.json','data/performance_summary.csv','data/period_summary.csv',...COMMON],
    readme:'TOX SYSTEM — VERIFICA POST-FREEZE\n\nEstratto pertinente del MASTER V001 per l\'evidenza successiva al freeze. I dati sono presentati secondo gli scope e le limitazioni dichiarate nel MASTER.\n'
  },
  capital:{
    name:'TOX_VERIFICA_ESEGUIBILITA_CAPITALE.zip',
    files:['evidence/capital_executability.json','data/capital_summary.csv','data/operability_summary.csv','evidence/wallet_summary.json',...COMMON],
    readme:'TOX SYSTEM — VERIFICA ESEGUIBILITA CAPITALE\n\nEstratto pertinente del MASTER V001 per operativita, concorrenza posizioni, utilizzo margine e modeled wallet.\n'
  },
  candidate:{
    name:'TOX_VERIFICA_EXIT_MANAGEMENT.zip',
    files:['data/layer_comparison.csv','data/robustness_summary.csv','data/cost_sensitivity.csv','data/distribution_summary.csv','data/period_summary.csv',...COMMON],
    readme:'TOX SYSTEM — VERIFICA EXIT MANAGEMENT\n\nEstratto pertinente del MASTER V001 per la ricerca exit-managed / Profit Protection pubblicata. Il pacchetto non attribuisce un effetto factorial separato a Candidate C dove l\'evidenza pubblica non lo consente.\n'
  },
  wallet:{
    name:'TOX_VERIFICA_MODELED_WALLET.zip',
    files:['evidence/wallet_summary.json','evidence/capital_executability.json','integrity/ledger_commitment.json','data/capital_summary.csv','data/operability_summary.csv',...COMMON],
    readme:'TOX SYSTEM — VERIFICA MODELED WALLET\n\nEstratto pertinente del MASTER V001 per il replay/modelled wallet e i relativi vincoli di capitale. Non rappresenta un conto reale.\n'
  }
};

module.exports=async(req,res)=>{
  try{
    const key=String(req.query.type||'').toLowerCase();
    const section=SECTIONS[key];
    if(!section) return res.status(400).json({error:'invalid_section',allowed:Object.keys(SECTIONS)});
    const r=await fetch(MASTER_URL,{redirect:'follow'});
    if(!r.ok) throw new Error(`Master download failed: ${r.status}`);
    const master=await JSZip.loadAsync(Buffer.from(await r.arrayBuffer()));
    const out=new JSZip();
    out.file('README.txt',section.readme);
    for(const rel of section.files){
      const source=master.file(ROOT+rel);
      if(!source) throw new Error(`Missing master file: ${rel}`);
      out.file(rel,await source.async('nodebuffer'));
    }
    const buf=await out.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}});
    res.setHeader('Content-Type','application/zip');
    res.setHeader('Content-Disposition',`attachment; filename="${section.name}"`);
    res.setHeader('Cache-Control','public, max-age=300');
    res.status(200).send(buf);
  }catch(e){
    res.status(500).json({error:'section_download_failed',message:String(e.message||e)});
  }
};
