'use client';

import { useEffect, useMemo, useState } from 'react';
import { abilityModifier, proficiencyBonus } from '@escudo/rules';
import Calculator from './calculator';
import VisualSlot, { healthVisualState } from './visual-slot';

const attributeNames = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const signed = (value) => value >= 0 ? `+${value}` : String(value);
const storageKey = (id) => `escudo-rpg:combat:${id}`;

function isCombatItem(entry) {
  const type = entry.payload?.itemType;
  if (['weapon', 'armor', 'ammo'].includes(type)) return true;
  const text = `${entry.title} ${entry.body} ${entry.payload?.container ?? ''}`.toLocaleLowerCase('pt-BR');
  return entry.payload?.equipped || /arma|arco|espada|flecha|muni|escudo|armadura|adaga|machado|lança|besta/.test(text);
}

function isPassive(entry) {
  const text = `${entry.payload?.category ?? ''} ${entry.payload?.activation ?? ''}`.toLocaleLowerCase('pt-BR');
  return text.includes('passiv');
}

function namesFromIds(ids = [], options) {
  const names = ids.map((id) => options.find((entry) => entry.id === id)?.title).filter(Boolean);
  return names.length ? names.join(' · ') : 'Nenhum selecionado';
}

function baseRuntime(character) {
  return {
    xp: 0,
    round: 1,
    conditions: [],
    resources: (character?.resources ?? []).map((resource) => ({ name: resource.name, current: resource.current, max: resource.max })),
    selectedAllies: [],
    loot: [],
    history: [],
  };
}

function runtimeId(prefix = 'evt') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function CombatPlanForm({ plan, weapons, techniques, passives, busy, onCancel, onSave }) {
  const p = plan?.payload ?? {};
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title') ?? '').trim();
    const sequence = String(data.get('sequence') ?? '').trim();
    const strategy = String(data.get('strategy') ?? '').trim();
    const trigger = String(data.get('trigger') ?? '').trim();
    const notes = String(data.get('notes') ?? '').trim();
    try {
      await onSave(plan ?? null, {
        title,
        body: [trigger, sequence, strategy, notes].filter(Boolean).join('\n\n'),
        payload: {
          ...p,
          combatPlan: true,
          section: 'Batalha',
          weaponIds: data.getAll('weaponIds'),
          techniqueIds: data.getAll('techniqueIds'),
          passiveIds: data.getAll('passiveIds'),
          trigger,
          sequence,
          strategy,
          notes,
        },
      });
    } catch { /* aviso principal permanece visível */ }
  }

  return <form className="combat-plan-form" onSubmit={submit}>
    <div className="combat-plan-form-head">
      <div><p className="eyebrow">{plan ? 'EDITAR PLANO' : 'NOVO PLANO'}</p><h3>{plan ? plan.title : 'Monte um combo ou ataque'}</h3></div>
      <button type="button" className="text-button" onClick={onCancel}>Cancelar</button>
    </div>
    <div className="combat-plan-grid">
      <label className="field-span-2">Nome do combo / ataque<input name="title" required maxLength="200" defaultValue={plan?.title ?? ''} placeholder="Ex.: Abertura com duas espadas" /></label>
      <label className="field-span-2">Quando usar<input name="trigger" maxLength="500" defaultValue={p.trigger ?? ''} placeholder="Ex.: inimigo isolado, alvo a média distância..." /></label>
    </div>
    <div className="combat-resource-picker">
      <fieldset><legend>Armas / equipamentos</legend>{weapons.length ? <div className="choice-grid">{weapons.map((entry) => <label className="choice-chip" key={entry.id}><input type="checkbox" name="weaponIds" value={entry.id} defaultChecked={(p.weaponIds ?? []).includes(entry.id)} /><span>{entry.title}</span></label>)}</div> : <p className="muted">Cadastre uma arma no Arsenal para selecioná-la aqui.</p>}</fieldset>
      <fieldset><legend>Técnicas / habilidades ativas</legend>{techniques.length ? <div className="choice-grid">{techniques.map((entry) => <label className="choice-chip" key={entry.id}><input type="checkbox" name="techniqueIds" value={entry.id} defaultChecked={(p.techniqueIds ?? []).includes(entry.id)} /><span>{entry.title}<small>{entry.payload?.activation || entry.payload?.category || 'Ativa'}</small></span></label>)}</div> : <p className="muted">Nenhuma técnica disponível no nível atual.</p>}</fieldset>
      <fieldset><legend>Passivas que participam</legend>{passives.length ? <div className="choice-grid">{passives.map((entry) => <label className="choice-chip" key={entry.id}><input type="checkbox" name="passiveIds" value={entry.id} defaultChecked={(p.passiveIds ?? []).includes(entry.id)} /><span>{entry.title}</span></label>)}</div> : <p className="muted">Nenhuma passiva disponível foi registrada.</p>}</fieldset>
    </div>
    <div className="combat-plan-grid text-plan-fields">
      <label className="field-span-2">Sequência do turno<textarea name="sequence" rows="4" defaultValue={p.sequence ?? ''} placeholder="Aproximar → ataque principal → segundo ataque → técnica..." /></label>
      <label className="field-span-2">Estratégia / objetivo<textarea name="strategy" rows="4" defaultValue={p.strategy ?? ''} placeholder="O que este combo tenta alcançar? Quando gastar recurso?" /></label>
      <label className="field-span-2">Lembretes<textarea name="notes" rows="3" defaultValue={p.notes ?? ''} placeholder="Passivas, condições, alcance ou perguntas para o mestre." /></label>
    </div>
    <div className="combat-plan-actions"><button className="primary" disabled={busy}>{busy ? 'Salvando…' : plan ? 'Salvar alterações' : 'Salvar plano de combate'}</button></div>
  </form>;
}

export default function BattleHub({
  character,
  entries,
  onOpenEntry,
  onSavePlan,
  onDeletePlan,
  onAdjustHp,
  onAdjustItem,
  onTransferLoot,
  busy = false,
}) {
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [runtime, setRuntime] = useState(() => baseRuntime(character));
  const [damageValue, setDamageValue] = useState(1);
  const [conditionInput, setConditionInput] = useState('');
  const [lootDraft, setLootDraft] = useState({ title: '', quantity: 1, itemType: 'general' });

  useEffect(() => {
    const fallback = baseRuntime(character);
    try {
      const saved = window.localStorage.getItem(storageKey(character.id));
      const parsed = saved ? JSON.parse(saved) : null;
      setRuntime(parsed && typeof parsed === 'object' ? { ...fallback, ...parsed, resources: parsed.resources?.length ? parsed.resources : fallback.resources } : fallback);
    } catch { setRuntime(fallback); }
  }, [character.id]);

  useEffect(() => {
    try { window.localStorage.setItem(storageKey(character.id), JSON.stringify(runtime)); } catch { /* armazenamento local indisponível */ }
  }, [character.id, runtime]);

  const abilities = useMemo(() => entries
    .filter((entry) => entry.kind === 'ability' && (!entry.characterId || entry.characterId === character.id))
    .filter((entry) => (entry.payload?.requiredLevel ?? 1) <= character.level && entry.payload?.learned !== false)
    .sort((a, b) => (b.payload?.requiredLevel ?? 1) - (a.payload?.requiredLevel ?? 1)), [entries, character.id, character.level]);
  const passives = abilities.filter(isPassive);
  const techniques = abilities.filter((entry) => !isPassive(entry));
  const combatItems = entries.filter((entry) => entry.kind === 'item' && (!entry.characterId || entry.characterId === character.id)).filter(isCombatItem);
  const ammo = combatItems.filter((entry) => entry.payload?.itemType === 'ammo' || /flecha|muni|virote|bala/.test(`${entry.title} ${entry.body}`.toLocaleLowerCase('pt-BR')));
  const companions = entries.filter((entry) => entry.kind === 'companion' && (!entry.characterId || entry.characterId === character.id));
  const plans = entries.filter((entry) => entry.kind === 'note' && entry.payload?.combatPlan === true && (!entry.characterId || entry.characterId === character.id));
  const editingPlan = plans.find((entry) => entry.id === editingPlanId);

  function updateRuntime(recipe, description) {
    setRuntime((current) => {
      const next = typeof recipe === 'function' ? recipe(current) : { ...current, ...recipe };
      if (!description) return next;
      const event = { id: runtimeId(), at: new Date().toISOString(), description };
      return { ...next, history: [event, ...(next.history ?? [])].slice(0, 60) };
    });
  }

  async function savePlan(plan, values) {
    await onSavePlan(plan, values);
    setEditingPlanId(null);
    setCreatingPlan(false);
  }

  async function applyHp(sign) {
    if (!onAdjustHp) return;
    const amount = Math.max(1, Number(damageValue) || 1);
    await onAdjustHp(sign * amount);
    updateRuntime((state) => ({ ...state }), sign < 0 ? `Dano aplicado: ${amount} PV` : `Cura aplicada: ${amount} PV`);
  }

  function addCondition(event) {
    event.preventDefault();
    const value = conditionInput.trim();
    if (!value) return;
    updateRuntime((state) => state.conditions.includes(value) ? state : { ...state, conditions: [...state.conditions, value] }, `Condição adicionada: ${value}`);
    setConditionInput('');
  }

  function adjustResource(index, delta) {
    updateRuntime((state) => {
      const resources = [...state.resources];
      const current = resources[index];
      if (!current) return state;
      resources[index] = { ...current, current: Math.max(0, Math.min(current.max, current.current + delta)) };
      return { ...state, resources };
    }, `${runtime.resources[index]?.name ?? 'Recurso'} ${delta > 0 ? 'recuperado' : 'consumido'}`);
  }

  function toggleAlly(id) {
    updateRuntime((state) => ({ ...state, selectedAllies: state.selectedAllies.includes(id) ? state.selectedAllies.filter((value) => value !== id) : [...state.selectedAllies, id] }), 'Seleção de aliado atualizada');
  }

  function addLoot(event) {
    event.preventDefault();
    const title = lootDraft.title.trim();
    if (!title) return;
    const item = { id: runtimeId('loot'), title, quantity: Math.max(1, Number(lootDraft.quantity) || 1), itemType: lootDraft.itemType, selected: true };
    updateRuntime((state) => ({ ...state, loot: [...state.loot, item] }), `Saque registrado: ${title}`);
    setLootDraft({ title: '', quantity: 1, itemType: 'general' });
  }

  async function transferSelectedLoot() {
    const selected = runtime.loot.filter((item) => item.selected);
    if (!selected.length || !onTransferLoot) return;
    await onTransferLoot(selected);
    updateRuntime((state) => ({ ...state, loot: state.loot.filter((item) => !item.selected) }), `${selected.length} ${selected.length === 1 ? 'item transferido' : 'itens transferidos'} do saque`);
  }

  const healthState = healthVisualState(character);

  return <div className="battle-hub hub-enter">
    <section className="panel battle-summary battle-command-card">
      <div className="battle-summary-main">
        <div className="panel-title"><div><p className="eyebrow">PRONTO PARA O TURNO</p><h2>Combate</h2></div><span className="battle-level">Rodada {runtime.round}</span></div>
        <div className="battle-primary-stats">
          <div><span>PV</span><strong>{character.hp}<small> / {character.hpMax}</small></strong></div>
          <div><span>PV temp.</span><strong>{character.tempHp ?? 0}</strong></div>
          <div><span>CA</span><strong>{character.armorClass}</strong></div>
          <div><span>Proficiência</span><strong>+{proficiencyBonus(character.level)}</strong></div>
          <div><span>Deslocamento</span><strong>{character.speed.toLocaleString('pt-BR')} m</strong></div>
          <div><span>XP manual</span><strong>{runtime.xp}</strong></div>
        </div>
        <div className="battle-attributes">{Object.entries(attributeNames).map(([key, label]) => <div key={key}><span>{label}</span><strong>{signed(abilityModifier(character.attributes[key]))}</strong><small>{character.attributes[key]}</small></div>)}</div>
      </div>
      <VisualSlot slot="combat-character-state" label="Personagem em combate" state={healthState} portrait />
    </section>

    <section className="combat-runtime-grid">
      <article className="panel combat-control-panel">
        <div className="panel-title"><div><p className="eyebrow">ESTADO DA RODADA</p><h2>PV, rodada e XP</h2></div></div>
        <div className="combat-inline-control"><label>Quantidade<input aria-label="Quantidade de PV" type="number" min="1" max="10000" value={damageValue} onChange={(e) => setDamageValue(e.target.value)} /></label><button className="secondary danger-button" disabled={busy || !onAdjustHp} onClick={() => applyHp(-1)}>Aplicar dano</button><button className="secondary" disabled={busy || !onAdjustHp} onClick={() => applyHp(1)}>Curar</button></div>
        <div className="combat-inline-control"><button className="secondary" onClick={() => updateRuntime((state) => ({ ...state, round: Math.max(1, state.round - 1) }), 'Rodada anterior')}>− rodada</button><strong>Rodada {runtime.round}</strong><button className="secondary" onClick={() => updateRuntime((state) => ({ ...state, round: state.round + 1 }), 'Nova rodada')}>+ rodada</button></div>
        <label className="runtime-number-field">XP anotado<input aria-label="XP manual" type="number" min="0" value={runtime.xp} onChange={(e) => updateRuntime({ ...runtime, xp: Math.max(0, Number(e.target.value) || 0) })} /><small>Não altera o nível automaticamente.</small></label>
      </article>

      <article className="panel combat-control-panel">
        <div className="panel-title"><div><p className="eyebrow">LEMBRETES ATIVOS</p><h2>Condições</h2></div></div>
        <form className="combat-condition-form" onSubmit={addCondition}><input aria-label="Nova condição" value={conditionInput} onChange={(e) => setConditionInput(e.target.value)} placeholder="Ex.: envenenado, escondido…" /><button className="secondary">Adicionar</button></form>
        <div className="condition-list">{runtime.conditions.length ? runtime.conditions.map((condition) => <button key={condition} className="condition-chip" onClick={() => updateRuntime((state) => ({ ...state, conditions: state.conditions.filter((value) => value !== condition) }), `Condição removida: ${condition}`)} title="Clique para remover">{condition} ×</button>) : <p className="muted">Nenhuma condição anotada.</p>}</div>
      </article>

      <article className="panel combat-control-panel">
        <div className="panel-title"><div><p className="eyebrow">RECURSOS</p><h2>Uso durante o combate</h2></div></div>
        <div className="runtime-resource-list">{runtime.resources.length ? runtime.resources.map((resource, index) => <div key={`${resource.name}-${index}`}><span>{resource.name}</span><div><button aria-label={`Consumir ${resource.name}`} onClick={() => adjustResource(index, -1)} disabled={resource.current <= 0}>−</button><strong>{resource.current} / {resource.max}</strong><button aria-label={`Recuperar ${resource.name}`} onClick={() => adjustResource(index, 1)} disabled={resource.current >= resource.max}>+</button></div></div>) : <p className="muted">Nenhum recurso estruturado na ficha.</p>}</div>
        <p className="muted small">Este controle é local ao navegador até a futura API transacional.</p>
      </article>
    </section>

    <section className="panel battle-strategy">
      <div className="panel-title"><div><p className="eyebrow">MEMÓRIA DE COMBATE</p><h2>Combos, ataques e estratégias</h2></div>{!creatingPlan && !editingPlan && <button className="primary" onClick={() => setCreatingPlan(true)}>+ Criar plano</button>}</div>
      <p className="battle-strategy-intro">Monte sequências com armas, técnicas e passivas que o personagem possui. O plano organiza sua decisão; não executa dano, não consome ações e não resolve dúvidas da mesa automaticamente.</p>
      {(creatingPlan || editingPlan) && <CombatPlanForm plan={editingPlan} weapons={combatItems} techniques={techniques} passives={passives} busy={busy} onCancel={() => { setCreatingPlan(false); setEditingPlanId(null); }} onSave={savePlan} />}
      {!creatingPlan && !editingPlan && <div className="combat-plan-list">{plans.length ? plans.map((plan) => <article className="combat-plan-card" key={plan.id}>
        <div className="combat-plan-card-head"><div><p className="eyebrow">PLANO SALVO</p><h3>{plan.title}</h3></div><div className="combat-plan-card-actions"><button className="text-button" onClick={() => setEditingPlanId(plan.id)}>Editar</button><button className="text-button danger" disabled={busy} onClick={() => onDeletePlan(plan)}>Excluir</button></div></div>
        {plan.payload?.trigger && <p className="combat-plan-trigger"><strong>Quando:</strong> {plan.payload.trigger}</p>}
        <div className="combat-plan-resources"><div><span>Armas</span><strong>{namesFromIds(plan.payload?.weaponIds, combatItems)}</strong></div><div><span>Técnicas</span><strong>{namesFromIds(plan.payload?.techniqueIds, techniques)}</strong></div><div><span>Passivas</span><strong>{namesFromIds(plan.payload?.passiveIds, passives)}</strong></div></div>
        {plan.payload?.sequence && <div className="combat-plan-copy"><span>Sequência</span><p className="preserve-text">{plan.payload.sequence}</p></div>}
        {plan.payload?.strategy && <div className="combat-plan-copy"><span>Estratégia</span><p className="preserve-text">{plan.payload.strategy}</p></div>}
        {plan.payload?.notes && <div className="combat-plan-copy"><span>Lembretes</span><p className="preserve-text">{plan.payload.notes}</p></div>}
      </article>) : <div className="battle-plan-empty"><span aria-hidden="true">⚔</span><h3>Nenhum plano preparado</h3><p>Crie um combo para deixar sua decisão de turno pronta antes da batalha.</p><button className="secondary" onClick={() => setCreatingPlan(true)}>Criar primeiro plano</button></div>}</div>}
    </section>

    <section className="combat-runtime-grid combat-reference-grid">
      <article className="panel combat-control-panel">
        <div className="panel-title"><div><p className="eyebrow">MUNIÇÃO</p><h2>Consumo rápido</h2></div></div>
        <div className="battle-list">{ammo.length ? ammo.map((entry) => <div className="battle-card battle-card-static" key={entry.id}><button className="battle-card-main" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">Qtd. {entry.payload?.quantity ?? 0}</span></button><button className="mini-action" disabled={busy || !onAdjustItem || (entry.payload?.quantity ?? 0) <= 0} onClick={() => onAdjustItem(entry, -1)}>−1</button></div>) : <p className="muted">Nenhuma munição identificada no Arsenal.</p>}</div>
      </article>

      <article className="panel combat-control-panel">
        <div className="panel-title"><div><p className="eyebrow">ALIADOS</p><h2>Disponibilidade</h2></div></div>
        <div className="ally-runtime-list">{companions.length ? companions.map((entry) => <label key={entry.id} className={`ally-runtime-card ${runtime.selectedAllies.includes(entry.id) ? 'selected' : ''}`}><input type="checkbox" checked={runtime.selectedAllies.includes(entry.id)} onChange={() => toggleAlly(entry.id)} /><span><strong>{entry.title}</strong><small>{entry.payload?.role || 'Companheiro'} · {entry.payload?.availability || 'disponível'}</small></span><button type="button" className="text-button" onClick={() => onOpenEntry(entry)}>Ficha</button></label>) : <p className="muted">Nenhum companheiro cadastrado.</p>}</div>
      </article>

      <article className="panel combat-control-panel combat-loot-panel">
        <div className="panel-title"><div><p className="eyebrow">SAQUE TEMPORÁRIO</p><h2>Encontrado nesta incursão</h2></div></div>
        <form className="loot-form" onSubmit={addLoot}><input aria-label="Item de saque" value={lootDraft.title} onChange={(e) => setLootDraft((draft) => ({ ...draft, title: e.target.value }))} placeholder="Nome do item" /><input aria-label="Quantidade do saque" type="number" min="1" value={lootDraft.quantity} onChange={(e) => setLootDraft((draft) => ({ ...draft, quantity: e.target.value }))} /><select aria-label="Destino do saque" value={lootDraft.itemType} onChange={(e) => setLootDraft((draft) => ({ ...draft, itemType: e.target.value }))}><option value="general">Inventário</option><option value="consumable">Consumível</option><option value="tool">Ferramenta</option><option value="weapon">Arma</option><option value="armor">Armadura</option><option value="ammo">Munição</option></select><button className="secondary">Adicionar</button></form>
        <div className="loot-list">{runtime.loot.length ? runtime.loot.map((item) => <label key={item.id} className="loot-row"><input type="checkbox" checked={item.selected} onChange={() => updateRuntime((state) => ({ ...state, loot: state.loot.map((loot) => loot.id === item.id ? { ...loot, selected: !loot.selected } : loot) }))} /><span><strong>{item.title}</strong><small>Qtd. {item.quantity} · {['weapon', 'armor', 'ammo'].includes(item.itemType) ? 'Arsenal' : 'Inventário'}</small></span><button type="button" className="icon-button" aria-label={`Remover ${item.title} do saque`} onClick={() => updateRuntime((state) => ({ ...state, loot: state.loot.filter((loot) => loot.id !== item.id) }), `Saque removido: ${item.title}`)}>×</button></label>) : <p className="muted">Nada registrado no saque temporário.</p>}</div>
        <button className="primary" disabled={busy || !runtime.loot.some((item) => item.selected)} onClick={transferSelectedLoot}>Encerrar e transferir selecionados</button>
      </article>
    </section>

    <section className="panel battle-section">
      <div className="panel-title"><div><p className="eyebrow">REFERÊNCIA RÁPIDA</p><h2>Técnicas, passivas e armas</h2></div></div>
      <div className="battle-resource-grid">
        <div><h3>Técnicas e habilidades ativas</h3><div className="battle-list">{techniques.length ? techniques.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">Nível {entry.payload?.requiredLevel ?? 1} · {entry.payload?.category ?? 'Habilidade'}</span><span className="battle-card-meta">{entry.payload?.activation || 'Ativação a definir'}{entry.payload?.cost ? ` · ${entry.payload.cost}` : ''}</span></button>) : <p className="muted">Nenhuma técnica disponível.</p>}</div></div>
        <div><h3>Passivas disponíveis</h3><div className="battle-list">{passives.length ? passives.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">Nível {entry.payload?.requiredLevel ?? 1} · Passiva</span></button>) : <p className="muted">Nenhuma passiva disponível.</p>}</div></div>
        <div><h3>Armas e equipamentos</h3><div className="battle-list">{combatItems.length ? combatItems.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">{entry.payload?.equipped ? 'Equipado' : entry.payload?.container || 'No arsenal'}{entry.payload?.quantity !== undefined ? ` · Qtd. ${entry.payload.quantity}` : ''}</span>{entry.payload?.damage && <span className="battle-card-meta">{entry.payload.damage}{entry.payload?.range ? ` · ${entry.payload.range}` : ''}</span>}</button>) : <p className="muted">Nenhum equipamento de combate identificado.</p>}</div></div>
      </div>
    </section>

    <section className="panel combat-history-panel">
      <details><summary><span>Histórico local da sessão</span><strong>{runtime.history.length} eventos</strong></summary><div className="combat-history-list">{runtime.history.length ? runtime.history.map((event) => <div key={event.id}><time>{new Date(event.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><span>{event.description}</span></div>) : <p className="muted">Ações locais de combate aparecerão aqui.</p>}</div></details>
    </section>

    <details className="panel battle-calculator">
      <summary><span>Ferramenta auxiliar</span><strong>Rolagens e cálculo manual</strong></summary>
      <div className="battle-calculator-body"><Calculator key={character.id} character={character} /></div>
    </details>
  </div>;
}
