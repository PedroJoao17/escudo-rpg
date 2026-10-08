'use client';

import { useState } from 'react';
import { abilityModifier, proficiencyBonus } from '@escudo/rules';
import Calculator from './calculator';

const attributeNames = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const signed = (value) => value >= 0 ? `+${value}` : String(value);

function isCombatItem(entry) {
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
    await onSave(plan, {
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
  }

  return <form className="combat-plan-form" onSubmit={submit}>
    <div className="combat-plan-form-head">
      <div><p className="eyebrow">{plan ? 'EDITAR PLANO' : 'NOVO PLANO'}</p><h3>{plan ? plan.title : 'Monte um combo ou ataque'}</h3></div>
      <button type="button" className="text-button" onClick={onCancel}>Cancelar</button>
    </div>
    <div className="combat-plan-grid">
      <label className="field-span-2">Nome do combo / ataque<input name="title" required maxLength="200" defaultValue={plan?.title ?? ''} placeholder="Ex.: Abertura com duas espadas" /></label>
      <label className="field-span-2">Quando usar<input name="trigger" maxLength="500" defaultValue={p.trigger ?? ''} placeholder="Ex.: inimigo isolado, alvo a média distância, início do combate..." /></label>
    </div>

    <div className="combat-resource-picker">
      <fieldset><legend>Armas / equipamentos</legend>{weapons.length ? <div className="choice-grid">{weapons.map((entry) => <label className="choice-chip" key={entry.id}><input type="checkbox" name="weaponIds" value={entry.id} defaultChecked={(p.weaponIds ?? []).includes(entry.id)} /><span>{entry.title}</span></label>)}</div> : <p className="muted">Cadastre ou equipe uma arma no inventário para selecioná-la aqui.</p>}</fieldset>
      <fieldset><legend>Técnicas / habilidades ativas</legend>{techniques.length ? <div className="choice-grid">{techniques.map((entry) => <label className="choice-chip" key={entry.id}><input type="checkbox" name="techniqueIds" value={entry.id} defaultChecked={(p.techniqueIds ?? []).includes(entry.id)} /><span>{entry.title}<small>{entry.payload?.activation || entry.payload?.category || 'Ativa'}</small></span></label>)}</div> : <p className="muted">Nenhuma técnica ou habilidade ativa disponível no nível atual.</p>}</fieldset>
      <fieldset><legend>Passivas que participam</legend>{passives.length ? <div className="choice-grid">{passives.map((entry) => <label className="choice-chip" key={entry.id}><input type="checkbox" name="passiveIds" value={entry.id} defaultChecked={(p.passiveIds ?? []).includes(entry.id)} /><span>{entry.title}</span></label>)}</div> : <p className="muted">Nenhuma passiva disponível foi registrada.</p>}</fieldset>
    </div>

    <div className="combat-plan-grid text-plan-fields">
      <label className="field-span-2">Sequência do turno<textarea name="sequence" rows="4" defaultValue={p.sequence ?? ''} placeholder="Ex.: aproximar → atacar com espada principal → segundo ataque → aplicar técnica..." /></label>
      <label className="field-span-2">Estratégia / objetivo<textarea name="strategy" rows="4" defaultValue={p.strategy ?? ''} placeholder="O que este combo tenta alcançar? Quando vale gastar recurso? O que evitar?" /></label>
      <label className="field-span-2">Lembretes<textarea name="notes" rows="3" defaultValue={p.notes ?? ''} placeholder="Passivas, condições, alcance ou perguntas para confirmar com o mestre." /></label>
    </div>
    <div className="combat-plan-actions"><button className="primary" disabled={busy}>{busy ? 'Salvando…' : plan ? 'Salvar alterações' : 'Salvar plano de combate'}</button></div>
  </form>;
}

export default function BattleHub({ character, entries, onOpenEntry, onSavePlan, onDeletePlan, busy = false }) {
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const abilities = entries
    .filter((entry) => entry.kind === 'ability' && (!entry.characterId || entry.characterId === character.id))
    .filter((entry) => (entry.payload?.requiredLevel ?? 1) <= character.level && entry.payload?.learned !== false)
    .sort((a, b) => (b.payload?.requiredLevel ?? 1) - (a.payload?.requiredLevel ?? 1));
  const passives = abilities.filter(isPassive);
  const techniques = abilities.filter((entry) => !isPassive(entry));
  const combatItems = entries
    .filter((entry) => entry.kind === 'item' && (!entry.characterId || entry.characterId === character.id))
    .filter(isCombatItem);
  const plans = entries
    .filter((entry) => entry.kind === 'note' && entry.payload?.combatPlan === true && (!entry.characterId || entry.characterId === character.id));
  const editingPlan = plans.find((entry) => entry.id === editingPlanId);

  async function savePlan(plan, values) {
    await onSavePlan(plan, values);
    setEditingPlanId(null);
    setCreatingPlan(false);
  }

  return <div className="battle-hub">
    <section className="panel battle-summary">
      <div className="panel-title"><div><p className="eyebrow">PRONTO PARA O TURNO</p><h2>Batalha</h2></div><span className="battle-level">Nível {character.level}</span></div>
      <div className="battle-primary-stats">
        <div><span>PV</span><strong>{character.hp}<small> / {character.hpMax}</small></strong></div>
        <div><span>CA</span><strong>{character.armorClass}</strong></div>
        <div><span>Proficiência</span><strong>+{proficiencyBonus(character.level)}</strong></div>
        <div><span>Deslocamento</span><strong>{character.speed.toLocaleString('pt-BR')} m</strong></div>
      </div>
      <div className="battle-attributes">
        {Object.entries(attributeNames).map(([key, label]) => <div key={key}><span>{label}</span><strong>{signed(abilityModifier(character.attributes[key]))}</strong><small>{character.attributes[key]}</small></div>)}
      </div>
    </section>

    <section className="panel battle-strategy">
      <div className="panel-title"><div><p className="eyebrow">MEMÓRIA DE COMBATE</p><h2>Combos, ataques e estratégias</h2></div>{!creatingPlan && !editingPlan && <button className="primary" onClick={() => setCreatingPlan(true)}>+ Criar plano</button>}</div>
      <p className="battle-strategy-intro">Monte uma sequência com as armas, técnicas e passivas que seu personagem já possui. O plano é uma anotação rápida do jogador: ele não executa dano, não consome ações e não presume regras ainda não confirmadas.</p>

      {(creatingPlan || editingPlan) && <CombatPlanForm plan={editingPlan} weapons={combatItems} techniques={techniques} passives={passives} busy={busy} onCancel={() => { setCreatingPlan(false); setEditingPlanId(null); }} onSave={savePlan} />}

      {!creatingPlan && !editingPlan && <div className="combat-plan-list">{plans.length ? plans.map((plan) => <article className="combat-plan-card" key={plan.id}>
        <div className="combat-plan-card-head"><div><p className="eyebrow">PLANO SALVO</p><h3>{plan.title}</h3></div><div className="combat-plan-card-actions"><button className="text-button" onClick={() => setEditingPlanId(plan.id)}>Editar</button><button className="text-button danger" disabled={busy} onClick={() => onDeletePlan(plan)}>Excluir</button></div></div>
        {plan.payload?.trigger && <p className="combat-plan-trigger"><strong>Quando:</strong> {plan.payload.trigger}</p>}
        <div className="combat-plan-resources">
          <div><span>Armas</span><strong>{namesFromIds(plan.payload?.weaponIds, combatItems)}</strong></div>
          <div><span>Técnicas</span><strong>{namesFromIds(plan.payload?.techniqueIds, techniques)}</strong></div>
          <div><span>Passivas</span><strong>{namesFromIds(plan.payload?.passiveIds, passives)}</strong></div>
        </div>
        {plan.payload?.sequence && <div className="combat-plan-copy"><span>Sequência</span><p className="preserve-text">{plan.payload.sequence}</p></div>}
        {plan.payload?.strategy && <div className="combat-plan-copy"><span>Estratégia</span><p className="preserve-text">{plan.payload.strategy}</p></div>}
        {plan.payload?.notes && <div className="combat-plan-copy"><span>Lembretes</span><p className="preserve-text">{plan.payload.notes}</p></div>}
      </article>) : <div className="battle-plan-empty"><span aria-hidden="true">⚔</span><h3>Nenhum plano preparado</h3><p>Crie um combo para deixar sua decisão de turno pronta antes da batalha.</p><button className="secondary" onClick={() => setCreatingPlan(true)}>Criar primeiro plano</button></div>}</div>}
    </section>

    <section className="panel battle-section">
      <div className="panel-title"><div><p className="eyebrow">REFERÊNCIA RÁPIDA</p><h2>Recursos disponíveis</h2></div></div>
      <div className="battle-resource-grid">
        <div><h3>Técnicas e habilidades ativas</h3><div className="battle-list">{techniques.length ? techniques.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">Nível {entry.payload?.requiredLevel ?? 1} · {entry.payload?.category ?? 'Habilidade'}</span><span className="battle-card-meta">{entry.payload?.activation || 'Ativação a definir'}{entry.payload?.cost ? ` · ${entry.payload.cost}` : ''}</span></button>) : <p className="muted">Nenhuma técnica disponível foi registrada para o nível atual.</p>}</div></div>
        <div><h3>Passivas disponíveis</h3><div className="battle-list">{passives.length ? passives.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">Nível {entry.payload?.requiredLevel ?? 1} · Passiva</span></button>) : <p className="muted">Nenhuma passiva disponível foi registrada.</p>}</div></div>
        <div><h3>Armas e equipamentos</h3><div className="battle-list">{combatItems.length ? combatItems.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}><span className="battle-card-title">{entry.title}</span><span className="battle-card-meta">{entry.payload?.equipped ? 'Equipado' : entry.payload?.container || 'No inventário'}{entry.payload?.quantity !== undefined ? ` · Qtd. ${entry.payload.quantity}` : ''}</span>{entry.payload?.weight !== undefined && <span className="battle-card-meta">{entry.payload.weight.toLocaleString('pt-BR')} kg por unidade</span>}</button>) : <p className="muted">Nenhum equipamento de combate identificado no inventário.</p>}</div></div>
      </div>
    </section>

    <details className="panel battle-calculator">
      <summary><span>Ferramenta auxiliar</span><strong>Rolagens e cálculo manual</strong></summary>
      <div className="battle-calculator-body"><Calculator key={character.id} character={character} /></div>
    </details>
  </div>;
}
