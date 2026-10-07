'use client';
import { useState } from 'react';

export const kindLabels = { ability: 'Habilidade', item: 'Item', npc: 'NPC', location: 'Local', mechanic: 'Mecânica', note: 'Anotação', companion: 'Companheiro' };
export default function EntryEditor({ entry, kind, characterId, gameDay, onSave, busy }) {
  const [error, setError] = useState('');
  const p = entry?.payload ?? {};
  async function submit(event) {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    const payload = { ...p };
    if (kind === 'ability') Object.assign(payload, { requiredLevel: Number(data.get('requiredLevel')), learned: data.has('learned'), category: data.get('category'), activation: data.get('activation'), cost: data.get('cost') });
    if (kind === 'item') Object.assign(payload, { quantity: Number(data.get('quantity')), weight: Number(data.get('weight')), equipped: data.has('equipped'), reusable: data.has('reusable'), container: data.get('container') });
    if (kind === 'npc') Object.assign(payload, { role: data.get('role'), unlocked: data.has('unlocked'), aliases: data.get('aliases').split(',').map((s) => s.trim()).filter(Boolean) });
    if (kind === 'location') Object.assign(payload, { x: Number(data.get('x')), y: Number(data.get('y')), status: data.get('status') });
    if (kind === 'mechanic') Object.assign(payload, { trigger: data.get('trigger'), reset: data.get('reset'), cost: data.get('cost') });
    if (kind === 'companion') Object.assign(payload, { role: data.get('role') });
    if (kind === 'note') { payload.gameDay = Number(data.get('gameDay')); payload.section = data.get('section'); if (data.get('sessionDate')) payload.sessionDate = data.get('sessionDate'); }
    const values = { kind, title: data.get('title'), body: data.get('body'), source: data.get('source'), knowledge: data.get('knowledge'), characterId: ['ability', 'item', 'companion'].includes(kind) ? characterId : null, payload };
    try { await onSave(values); } catch (e) { setError(e.message); }
  }
  return <form className="form-stack" onSubmit={submit}>
    <label>Nome ou título<input autoFocus name="title" required maxLength="200" defaultValue={entry?.title ?? ''} /></label>
    <label>Descrição completa<textarea name="body" rows="6" defaultValue={entry?.body ?? ''} /></label>
    {kind === 'ability' && <><div className="form-grid"><label>Nível necessário<input name="requiredLevel" type="number" min="1" max="20" defaultValue={p.requiredLevel ?? 1} required /></label><label>Categoria<input name="category" defaultValue={p.category ?? 'Habilidade'} placeholder="Passiva, técnica, magia…" /></label></div><div className="form-grid"><label>Ativação<input name="activation" defaultValue={p.activation ?? ''} placeholder="Ação, bônus, reação, passiva…" /></label><label>Custo e recuperação<input name="cost" defaultValue={p.cost ?? ''} /></label></div><label className="check"><input name="learned" type="checkbox" defaultChecked={p.learned ?? true} /> Aprendida pelo personagem</label></>}
    {kind === 'item' && <><div className="form-grid"><label>Quantidade<input name="quantity" type="number" min="0" max="1000000" defaultValue={p.quantity ?? 1} required /></label><label>Peso unitário (kg)<input name="weight" type="number" min="0" max="100000" step="0.01" defaultValue={p.weight ?? 0} /></label></div><label>Onde está guardado<input name="container" defaultValue={p.container ?? ''} /></label><div className="checks"><label><input name="equipped" type="checkbox" defaultChecked={p.equipped} /> Equipado</label><label><input name="reusable" type="checkbox" defaultChecked={p.reusable} /> Reutilizável</label></div></>}
    {['npc', 'companion'].includes(kind) && <label>Função<input name="role" defaultValue={p.role ?? ''} /></label>}
    {kind === 'npc' && <><label>Outros nomes conhecidos, separados por vírgulas<input name="aliases" defaultValue={(p.aliases ?? []).join(', ')} /></label><label className="check"><input name="unlocked" type="checkbox" defaultChecked={p.unlocked} /> Confiança / acompanhamento desbloqueado</label></>}
    {kind === 'location' && <><label>Situação conhecida<input name="status" defaultValue={p.status ?? ''} /></label><div className="form-grid"><label>Posição horizontal (%)<input name="x" type="number" min="0" max="100" defaultValue={p.x ?? 50} /></label><label>Posição vertical (%)<input name="y" type="number" min="0" max="100" defaultValue={p.y ?? 50} /></label></div><p className="muted">Posições no mapa esquemático. Ajuste para representar os locais que você conhece.</p></>}
    {kind === 'mechanic' && <><label>Quando se aplica<input name="trigger" defaultValue={p.trigger ?? ''} /></label><div className="form-grid"><label>Quando recupera ou reinicia<input name="reset" defaultValue={p.reset ?? ''} placeholder="Amanhecer, turno, descanso…" /></label><label>Custo<input name="cost" defaultValue={p.cost ?? ''} /></label></div></>}
    {kind === 'note' && <><div className="form-grid"><label>Dia da campanha<input name="gameDay" type="number" min="0" defaultValue={p.gameDay ?? gameDay} /></label><label>Data da sessão<input name="sessionDate" type="date" defaultValue={p.sessionDate ?? ''} /></label></div><label>Seção<input name="section" defaultValue={p.section ?? 'Sessão'} placeholder="Sessão, ficha, objetivo, rumor…" /></label></>}
    <div className="form-grid"><label>Origem da informação<input name="source" maxLength="1000" defaultValue={entry?.source ?? 'Anotação do jogador'} /></label><label>Confiança na informação<select name="knowledge" defaultValue={entry?.knowledge ?? 'confirmed'}><option value="confirmed">Confirmada</option><option value="rumor">Rumor</option><option value="needs-review">Precisa de confirmação</option></select></label></div>
    {error && <p role="alert" className="error-text">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar registro'}</button>
  </form>;
}
