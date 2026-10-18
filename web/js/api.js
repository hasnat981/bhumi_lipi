import { state } from './i18n.js';

export class ApiFail extends Error {
  constructor(status, error) { super(error?.en || 'Request failed'); this.status = status; this.error = error || {}; }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method, headers: { 'Content-Type': 'application/json', 'X-Demo-Role': state.role },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiFail(0, { code: 'OFFLINE', bn: 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট দেখুন।', en: 'Cannot reach the server. Check your internet.' });
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new ApiFail(res.status, data.error);
  return data;
}
export const docUrl = (hash) => `/api/deeds/${hash}/document`;
export const sealUrl = (hash) => `${location.origin}/#/v/${hash}`;
