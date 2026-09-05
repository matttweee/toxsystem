import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://mohncnsplqtarmobmcie.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1ZbPyCuvEXUNkic1Z7nnpw_ztPMyj1J';
const ARTIFACT_NAME = 'TOX_SYSTEM_V007.exe';
const DOWNLOAD_NAME = 'TOX_SYSTEM_V007.exe';

async function rpc(body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/tox_demo_download_authorize`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status}:${text}`);
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  try {
    const client_id = String(req.query?.client_id || '').trim();
    const activation_code = String(req.query?.activation_code || '').trim();
    if (!client_id || !activation_code) {
      res.status(400).json({ error: 'CLIENT_ID_AND_ACTIVATION_REQUIRED' });
      return;
    }
    await rpc({ p_client_id: client_id, p_activation_token: activation_code });

    const artifactPath = path.join(process.cwd(), 'downloads', ARTIFACT_NAME);
    if (!fs.existsSync(artifactPath)) {
      res.status(503).json({ error: 'ARTIFACT_MISSING', detail: ARTIFACT_NAME });
      return;
    }
    const buf = fs.readFileSync(artifactPath);
    res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
    res.setHeader('Content-Disposition', `attachment; filename="${DOWNLOAD_NAME}"`);
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-TOX-Build', 'V007');
    res.status(200).end(buf);
  } catch (e) {
    const d = String(e.message || e);
    let s = 403,
      err = 'DOWNLOAD_NOT_AUTHORIZED';
    if (d.includes('CLIENT_NOT_FOUND')) {
      s = 404;
      err = 'CLIENT_NOT_FOUND';
    }
    res.status(s).json({ error: err, detail: d.slice(0, 220) });
  }
}
