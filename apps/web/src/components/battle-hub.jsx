'use client';

import { abilityModifier, proficiencyBonus } from '@escudo/rules';
import Calculator from './calculator';

const attributeNames = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const signed = (value) => value >= 0 ? `+${value}` : String(value);

function isCombatItem(entry) {
  const text = `${entry.title} ${entry.body} ${entry.payload?.container ?? ''}`.toLocaleLowerCase('pt-BR');
  return entry.payload?.equipped || /arma|arco|espada|flecha|muni|escudo|armadura|adaga|machado|lança|besta/.test(text);
}

export default function BattleHub({ character, entries, onOpenEntry }) {
  const abilities = entries
    .filter((entry) => entry.kind === 'ability' && (!entry.characterId || entry.characterId === character.id))
    .filter((entry) => (entry.payload?.requiredLevel ?? 1) <= character.level && entry.payload?.learned !== false)
    .sort((a, b) => (b.payload?.requiredLevel ?? 1) - (a.payload?.requiredLevel ?? 1));
  const combatItems = entries
    .filter((entry) => entry.kind === 'item' && (!entry.characterId || entry.characterId === character.id))
    .filter(isCombatItem);

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

    <section className="panel battle-section">
      <div className="panel-title"><div><p className="eyebrow">O QUE VOCÊ JÁ SABE USAR</p><h2>Recursos de combate</h2></div></div>
      <div className="battle-resource-grid">
        <div>
          <h3>Habilidades disponíveis</h3>
          <div className="battle-list">{abilities.length ? abilities.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}>
            <span className="battle-card-title">{entry.title}</span>
            <span className="battle-card-meta">Nível {entry.payload?.requiredLevel ?? 1} · {entry.payload?.category ?? 'Habilidade'}</span>
            <span className="battle-card-meta">{entry.payload?.activation || 'Ativação a definir'}{entry.payload?.cost ? ` · ${entry.payload.cost}` : ''}</span>
          </button>) : <p className="muted">Nenhuma habilidade disponível foi registrada para o nível atual.</p>}</div>
        </div>
        <div>
          <h3>Armas e equipamentos</h3>
          <div className="battle-list">{combatItems.length ? combatItems.map((entry) => <button key={entry.id} className="battle-card" onClick={() => onOpenEntry(entry)}>
            <span className="battle-card-title">{entry.title}</span>
            <span className="battle-card-meta">{entry.payload?.equipped ? 'Equipado' : entry.payload?.container || 'No inventário'}{entry.payload?.quantity !== undefined ? ` · Qtd. ${entry.payload.quantity}` : ''}</span>
            {entry.payload?.weight !== undefined && <span className="battle-card-meta">{entry.payload.weight.toLocaleString('pt-BR')} kg por unidade</span>}
          </button>) : <p className="muted">Nenhum equipamento de combate identificado no inventário.</p>}</div>
        </div>
      </div>
    </section>

    <section className="panel battle-strategy">
      <div className="panel-title"><div><p className="eyebrow">MEMÓRIA DE COMBATE</p><h2>Estratégias e combos</h2></div></div>
      <p>Use as descrições das suas habilidades e itens para montar sequências pessoais de turno. O sistema não presume custo, dano, ação ou duração enquanto a regra da mesa não estiver confirmada.</p>
      <div className="strategy-prompts">
        <span>① Abertura do combate</span><span>② Turno de dano</span><span>③ Reação / defesa</span><span>④ Combate à distância</span><span>⑤ Recursos para não esquecer</span>
      </div>
    </section>

    <details className="panel battle-calculator">
      <summary><span>Ferramenta auxiliar</span><strong>Rolagens e cálculo manual</strong></summary>
      <div className="battle-calculator-body"><Calculator key={character.id} character={character} /></div>
    </details>
  </div>;
}
