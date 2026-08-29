const MASTER_URL='https://drive.google.com/uc?export=download&id=1xgTlHdFeGU1Iy6gkQEbr_epYSG8NwZ9o';
const MASTER_NAME='TOX_PUBLIC_EVIDENCE_MASTER_V001.zip';

module.exports=async(req,res)=>{
  try{
    const r=await fetch(MASTER_URL,{redirect:'follow'});
    if(!r.ok) throw new Error(`Master download failed: ${r.status}`);
    const ab=await r.arrayBuffer();
    const out=Buffer.from(ab);
    res.setHeader('Content-Type','application/zip');
    res.setHeader('Content-Disposition',`attachment; filename="${MASTER_NAME}"`);
    res.setHeader('Cache-Control','public, max-age=300');
    res.status(200).send(out);
  }catch(e){
    res.status(500).json({error:'master_download_failed',message:String(e.message||e)});
  }
};
