'use client';
import { useState } from 'react';

export const kindLabels = { ability: 'Habilidade', item: 'Item', npc: 'NPC', location: 'Local', mechanic: 'Mecânica', note: 'Anotação', companion: 'Companheiro' };

const itemTypeOptions = [
  ['general', 'Objeto / suprimento'],
  ['currency', 'Moeda / valor'],
  ['consumable', 'Consumível'],
  ['tool', 'Ferramenta'],
  ['weapon', 'Arma'],
  ['armor', 'Armadura / proteção'],
  ['ammo', 'Munição'],
  ['narrative', 'Objeto narrativo / chave'],
];

export default function EntryEditor({ entry, kind, characterId, gameDay, onSave, busy, initialPayload = {} }) {
  const [error, setError] = useState('');
  const p = entry?.payload ?? initialPayload ?? {};

  async function submit(event) {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    const payload = { ...p };

    if (kind === 'ability') Object.assign(payload, {
      requiredLevel: Number(data.get('requiredLevel')),
      learned: data.has('learned'),
      category: data.get('category'),
      activation: data.get('activation'),
      cost: data.get('cost'),
      combatStyle: data.get('combatStyle'),
      effect: data.get('effect'),
      duration: data.get('duration'),
    });

    if (kind === 'item') {
      Object.assign(payload, {
        itemType: data.get('itemType'),
        quantity: Number(data.get('quantity')),
        equipped: data.has('equipped'),
        reusable: data.has('reusable'),
        container: data.get('container'),
        damage: data.get('damage'),
        range: data.get('range'),
        properties: data.get('properties'),
        effect: data.get('effect'),
        armorClassBonus: data.get('armorClassBonus'),
      });
      const weight = data.get('weight')?.trim();
      if (weight === '') delete payload.weight;
      else payload.weight = Number(weight);
    }

    if (kind === 'npc') Object.assign(payload, {
      role: data.get('role'),
      unlocked: data.has('unlocked'),
      trust: data.get('trust'),
      aliases: data.get('aliases').split(',').map((s) => s.trim()).filter(Boolean),
      availability: data.get('availability'),
    });

    if (kind === 'location') Object.assign(payload, { x: Number(data.get('x')), y: Number(data.get('y')), status: data.get('status') });
    if (kind === 'mechanic') Object.assign(payload, { trigger: data.get('trigger'), reset: data.get('reset'), cost: data.get('cost') });
    if (kind === 'companion') Object.assign(payload, {
      role: data.get('role'),
      hp: data.get('companionHp') ? Number(data.get('companionHp')) : null,
      hpMax: data.get('companionHpMax') ? Number(data.get('companionHpMax')) : null,
      command: data.get('command'),
      availability: data.get('availability'),
    });
    if (kind === 'note') {
      payload.gameDay = Number(data.get('gameDay'));
      payload.section = data.get('section');
      payload.objectiveStatus = data.get('objectiveStatus');
      if (data.get('sessionDate')) payload.sessionDate = data.get('sessionDate');
      else delete payload.sessionDate;
    }

    const values = {
      kind,
      title: data.get('title'),
      body: data.get('body'),
      source: data.get('source'),
      knowledge: data.get('knowledge'),
      characterId: ['ability', 'item', 'companion'].includes(kind) ? characterId : null,
      payload,
    };
    try { await onSave(values); } catch (e) { setError(e.message); }
  }

  return <form className="form-stack" onSubmit={submit}>
    <label>Nome ou título<input autoFocus name="title" required maxLength="200" defaultValue={entry?.title ?? ''} /></label>
    <label>Descrição completa<textarea name="body" rows="6" defaultValue={entry?.body ?? ''} /></label>

    {kind === 'ability' && <>
      <div className="form-grid"><label>Nível necessário<input name="requiredLevel" type="number" min="1" max="20" defaultValue={p.requiredLevel ?? 1} required /></label><label>Categoria<input name="category" defaultValue={p.category ?? 'Habilidade'} placeholder="Passiva, técnica, magia…" /></label></div>
      <div className="form-grid"><label>Ativação<input name="activation" defaultValue={p.activation ?? ''} placeholder="Ação, bônus, reação, passiva…" /></label><label>Custo e recuperação<input name="cost" defaultValue={p.cost ?? ''} /></label></div>
      <div className="form-grid"><label>Duração<input name="duration" maxLength="100" defaultValue={p.duration ?? ''} placeholder="Instantânea, 1 turno, 1 minuto…" /></label><label>Forma / estilo de combate<input name="combatStyle" maxLength="100" defaultValue={p.combatStyle ?? ''} placeholder="Ex.: duas espadas, arco" /></label></div>
      <label>Efeito resumido<input name="effect" maxLength="500" defaultValue={p.effect ?? ''} placeholder="Resumo mecânico para consulta rápida; preserve dúvidas de regra." /></label>
      <label className="check"><input name="learned" type="checkbox" defaultChecked={p.learned ?? true} /> Aprendida pelo personagem</label>
    </>}

    {kind === 'item' && <>
      <div className="form-grid"><label>Tipo de item<select name="itemType" defaultValue={p.itemType ?? 'general'}>{itemTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Quantidade<input name="quantity" type="number" min="0" max="1000000" defaultValue={p.quantity ?? 1} required /></label></div>
      <div className="form-grid"><label>Peso unitário (kg)<input name="weight" type="number" min="0" max="100000" step="0.01" defaultValue={p.weight ?? ''} placeholder="Não informado" /></label><label>Onde está guardado<input name="container" defaultValue={p.container ?? ''} /></label></div>
      <fieldset className="nested-fields"><legend>Características de combate, quando aplicável</legend><div className="form-grid"><label>Dano / fórmula<input name="damage" defaultValue={p.damage ?? ''} placeholder="Ex.: 1d6 perfurante" /></label><label>Alcance<input name="range" defaultValue={p.range ?? ''} placeholder="Ex.: 1,5 m ou 24/96 m" /></label></div><div className="form-grid"><label>Propriedades<input name="properties" defaultValue={p.properties ?? ''} placeholder="Leve, acuidade, duas mãos…" /></label><label>CA / proteção<input name="armorClassBonus" defaultValue={p.armorClassBonus ?? ''} placeholder="Valor ou observação" /></label></div><label>Efeito / observação<input name="effect" defaultValue={p.effect ?? ''} /></label></fieldset>
      <div className="checks"><label><input name="equipped" type="checkbox" defaultChecked={p.equipped} /> Equipado</label><label><input name="reusable" type="checkbox" defaultChecked={p.reusable} /> Reutilizável</label></div>
    </>}

    {['npc', 'companion'].includes(kind) && <label>Função<input name="role" defaultValue={p.role ?? ''} /></label>}
    {kind === 'npc' && <><div className="form-grid"><label>Grau de confiança<select name="trust" defaultValue={p.trust ?? (p.unlocked ? 'conquistada' : '')}><option value="">Não informado</option><option value="inicial">Inicial</option><option value="conquistada">Conquistada</option><option value="elevada">Elevada</option></select></label><label>Situação<select name="availability" defaultValue={p.availability ?? 'known'}><option value="known">Conhecido</option><option value="available">Disponível</option><option value="selected">Selecionado para missão</option><option value="borrowed">Emprestado</option><option value="unavailable">Indisponível</option></select></label></div><label className="check"><input name="unlocked" type="checkbox" defaultChecked={p.unlocked} /> Acompanhamento / benefício desbloqueado</label><label>Outros nomes conhecidos, separados por vírgulas<input name="aliases" defaultValue={(p.aliases ?? []).join(', ')} /></label></>}
    {kind === 'companion' && <><div className="form-grid"><label>PV conhecido<input name="companionHp" type="number" min="0" defaultValue={p.hp ?? ''} /></label><label>PV máximo conhecido<input name="companionHpMax" type="number" min="0" defaultValue={p.hpMax ?? ''} /></label></div><label>Comando / comportamento conhecido<input name="command" defaultValue={p.command ?? ''} placeholder="Ex.: acompanha, guarda, aguarda ordem…" /></label><label>Disponibilidade<select name="availability" defaultValue={p.availability ?? 'available'}><option value="available">Disponível</option><option value="selected">Selecionado</option><option value="unavailable">Indisponível</option></select></label></>}

    {kind === 'location' && <><label>Situação conhecida<input name="status" defaultValue={p.status ?? ''} /></label><div className="form-grid"><label>Posição horizontal (%)<input name="x" type="number" min="0" max="100" defaultValue={p.x ?? 50} /></label><label>Posição vertical (%)<input name="y" type="number" min="0" max="100" defaultValue={p.y ?? 50} /></label></div><p className="muted">Posições no mapa esquemático. Ajuste para representar os locais que você conhece.</p></>}
    {kind === 'mechanic' && <><label>Quando se aplica<input name="trigger" defaultValue={p.trigger ?? ''} /></label><div className="form-grid"><label>Quando recupera ou reinicia<input name="reset" defaultValue={p.reset ?? ''} placeholder="Amanhecer, turno, descanso…" /></label><label>Custo<input name="cost" defaultValue={p.cost ?? ''} /></label></div></>}

    {kind === 'note' && <><div className="form-grid"><label>Dia da campanha<input name="gameDay" type="number" min="0" defaultValue={p.gameDay ?? gameDay} /></label><label>Data da sessão<input name="sessionDate" type="date" defaultValue={p.sessionDate ?? ''} /></label></div><div className="form-grid"><label>Seção<input name="section" defaultValue={p.section ?? 'Sessão'} placeholder="Sessão, objetivo, rumor…" /></label><label>Status de objetivo<select name="objectiveStatus" defaultValue={p.objectiveStatus ?? 'open'}><option value="open">Aberto / não se aplica</option><option value="completed">Concluído</option><option value="paused">Pausado</option></select></label></div></>}

    <div className="form-grid"><label>Origem da informação<input name="source" maxLength="1000" defaultValue={entry?.source ?? 'Anotação do jogador'} /></label><label>Confiança na informação<select name="knowledge" defaultValue={entry?.knowledge ?? 'confirmed'}><option value="confirmed">Confirmada</option><option value="rumor">Rumor</option><option value="needs-review">Precisa de confirmação</option></select></label></div>
    {error && <p role="alert" className="error-text">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar registro'}</button>
  </form>;
}
