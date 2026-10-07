export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({ error: 'A API não respondeu. Confira se o backend está em execução.' }));
  if (!response.ok) throw new Error(body.details?.length ? `${body.error} ${body.details[0].message}` : body.error ?? 'Não foi possível concluir a operação.');
  return body;
}
