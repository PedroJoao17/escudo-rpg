import { parseArgs } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import AdmZip from 'adm-zip';

export async function readNotes(zipPath) {
  const bytes = await fs.readFile(zipPath);
  if (bytes.length > 20 * 1024 * 1024) throw new Error('O ZIP deve ter até 20 MB.');
  const archive = new AdmZip(bytes);
  const files = archive.getEntries().filter((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.md'));
  if (!files.length || files.length > 300) throw new Error('O ZIP deve conter entre 1 e 300 notas Markdown.');
  let total = 0;
  const notes = files.map((entry) => {
    const sourcePath = entry.entryName.replaceAll('\\', '/');
    if (sourcePath.startsWith('/') || /^[a-z]:/i.test(sourcePath) || sourcePath.split('/').includes('..') || sourcePath.length > 500) throw new Error('Caminho de nota inválido no ZIP.');
    if (entry.header.size > 300000) throw new Error(`Nota muito grande: ${sourcePath}`);
    const content = entry.getData(); total += content.length;
    if (total > 5 * 1024 * 1024) throw new Error('As notas descompactadas excedem 5 MB.');
    const body = content.toString('utf8');
    if (body.length > 100000) throw new Error(`Nota excede 100.000 caracteres: ${sourcePath}`);
    return { title: path.posix.basename(sourcePath, '.md'), sourcePath, body, section: path.posix.basename(path.posix.dirname(sourcePath)), missingLinks: [] };
  });
  if (new Set(notes.map((n) => n.sourcePath)).size !== notes.length) throw new Error('O ZIP possui caminhos de notas duplicados.');
  for (const note of notes) {
    const links = [...note.body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((match) => match[1].split('#')[0].replace(/\.md$/i, '')).filter(Boolean);
    note.missingLinks = [...new Set(links.filter((target) => !notes.some((n) => n.sourcePath.replace(/\.md$/i, '').endsWith(`/${target}`) || n.title === target || n.sourcePath.replace(/\.md$/i, '') === target)))];
  }
  return notes;
}

async function main() {
  const { values } = parseArgs({ options: { zip: { type: 'string' }, campaign: { type: 'string' }, api: { type: 'string', default: 'http://127.0.0.1:4000' }, 'dry-run': { type: 'boolean', default: false } } });
  if (!values.zip) throw new Error('Use --zip "caminho/arquivo.zip" e --campaign UUID, ou --dry-run para conferir sem gravar.');
  const notes = await readNotes(values.zip);
  console.log(JSON.stringify({ notes: notes.length, empty: notes.filter((n) => !n.body.trim()).length, missingTargets: [...new Set(notes.flatMap((n) => n.missingLinks))] }, null, 2));
  if (values['dry-run']) return;
  if (!values.campaign || !/^[0-9a-f-]{36}$/i.test(values.campaign)) throw new Error('Informe --campaign com o UUID exibido pela API /api/v1/campaigns.');
  const url = new URL(values.api);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== 'http:') throw new Error('A importação desta versão é local; use uma API HTTP no loopback.');
  const result = { created: 0, skipped: 0, changed: 0, pending: 0 };
  // Lotes pequenos respeitam o limite do corpo HTTP. Cada lote é uma transação no MySQL.
  for (let index = 0; index < notes.length; index += 2) {
    const response = await fetch(new URL(`/api/v1/campaigns/${values.campaign}/import-notes`, url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: notes.slice(index, index + 2) }) });
    const body = await response.json();
    if (!response.ok) throw new Error(`${body.error} ${JSON.stringify(body.details ?? [])}`);
    for (const key of Object.keys(result)) result[key] += body[key];
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.changed) console.log('Notas já importadas com conteúdo diferente foram preservadas. Revise manualmente antes de substituir.');
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
