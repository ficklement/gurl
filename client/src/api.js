export async function api(path, opts = {}) {
  const headers = { ...opts.headers };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`/api${path}`, { ...opts, credentials: 'include', headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  if (response.status === 204) return null;
  let data;
  try { data = await response.json(); } catch { throw new Error('The server returned an unexpected response.'); }
  if (!response.ok) throw new Error(data?.error || 'Request failed.');
  return data;
}
