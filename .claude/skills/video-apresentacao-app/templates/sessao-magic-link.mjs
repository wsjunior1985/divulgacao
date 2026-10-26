// Gera uma sessão de teste por magic link (só para ENTRAR; só leituras depois). Não imprime nem salva o segredo.
// Variáveis: APP_DIR (pasta do app, para ler VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY do .env.local),
//            AUTH_CONTAINER (ex.: <app>-auth), CAPTURA_EMAIL (conta de teste). Saída: session.json (APAGAR ao terminar).
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const { APP_DIR, AUTH_CONTAINER, CAPTURA_EMAIL } = process.env;
if (!APP_DIR || !AUTH_CONTAINER || !CAPTURA_EMAIL) throw new Error('defina APP_DIR, AUTH_CONTAINER e CAPTURA_EMAIL');
const env = Object.fromEntries(readFileSync(`${APP_DIR}/.env.local`, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const base = env.VITE_SUPABASE_URL.replace(/\/$/, ''); const anon = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sec = execFileSync('ssh', ['hostinger-vps', `docker exec ${AUTH_CONTAINER} printenv GOTRUE_JWT_SECRET`], { encoding: 'utf8' }).trim();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const h = b64({ alg: 'HS256', typ: 'JWT' }), pl = b64({ role: 'service_role', iss: 'supabase', iat: now, exp: now + 600 });
const jwt = `${h}.${pl}.${createHmac('sha256', sec).update(`${h}.${pl}`).digest('base64url')}`;
const r = await fetch(`${base}/auth/v1/admin/generate_link`, { method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${jwt}`, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', email: CAPTURA_EMAIL }) });
const j = await r.json();
const v = await fetch(`${base}/auth/v1/verify`, { method: 'POST', headers: { apikey: anon, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: j.hashed_token }) });
const s = await v.json();
writeFileSync('session.json', JSON.stringify({ base, ref: new URL(base).hostname.split('.')[0], session: s }));
console.log('sessão gravada em session.json (apague ao terminar)');
