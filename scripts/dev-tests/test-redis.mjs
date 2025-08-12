import 'dotenv/config';
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) { console.error('Missing UPSTASH envs'); process.exit(1); }
const res = await fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` } });
console.log('Upstash status:', res.status, await res.text());
