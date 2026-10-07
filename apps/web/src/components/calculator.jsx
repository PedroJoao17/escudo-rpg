'use client';
import { useState } from 'react';
import { apiRequest } from '../lib/api';
import { abilityModifier, proficiencyBonus } from '@escudo/rules';

const attrs = { str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma' };
export default function Calculator({ character }) {
  const [attribute, setAttribute] = useState('dex');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function calculate(event) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const input = { score: character.attributes[attribute], level: character.level, proficiency: data.get('proficiency'), advantage: data.has('advantage'), disadvantage: data.has('disadvantage'), kind: data.get('kind'), bonuses: data.get('bonusLabel') ? [{ label: data.get('bonusLabel'), value: Number(data.get('bonus')) }] : [], rerollOnes: data.has('reroll') };
    if (data.get('difficulty')) input.difficulty = Number(data.get('difficulty'));
    if (data.get('roll1')) input.rolls = [Number(data.get('roll1')), ...(input.advantage !== input.disadvantage ? [Number(data.get('roll2'))] : [])];
    setError(''); setBusy(true);
    try { setResult(await apiRequest('/calculations/check', { method: 'POST', body: JSON.stringify(input) })); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function rollDice(event) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setError(''); setBusy(true);
    try { setResult(await apiRequest('/calculations/dice', { method: 'POST', body: JSON.stringify({ expression: data.get('expression'), critical: data.has('critical') }) })); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="calculator-grid">
    <section className="panel"><div className="panel-title"><h2>Teste de d20</h2><span className="tag">Cada bônus tem uma origem</span></div>
      <form onSubmit={calculate} className="form-stack">
        <div className="form-grid"><label>Tipo<select name="kind"><option value="check">Perícia / atributo</option><option value="save">Salvaguarda</option><option value="attack">Ataque</option></select></label>
          <label>Atributo<select value={attribute} onChange={(e) => setAttribute(e.target.value)}>{Object.entries(attrs).map(([key, value]) => <option key={key} value={key}>{value} ({character.attributes[key]})</option>)}</select></label></div>
        <label>Proficiência<select name="proficiency"><option value="none">Sem proficiência</option><option value="proficient">Proficiente (+{proficiencyBonus(character.level)})</option><option value="expertise">Especialização (+{proficiencyBonus(character.level) * 2})</option></select></label>
        <div className="checks"><label><input name="advantage" type="checkbox" /> Vantagem</label><label><input name="disadvantage" type="checkbox" /> Desvantagem</label></div>
        <p className="muted">Vantagem e desvantagem se cancelam. Modificador do atributo: {abilityModifier(character.attributes[attribute]) >= 0 ? '+' : ''}{abilityModifier(character.attributes[attribute])}.</p>
        <div className="form-grid"><label>CD, se conhecida<input name="difficulty" type="number" min="1" max="100" placeholder="Opcional" /></label><label>Primeiro d20 físico<input name="roll1" type="number" min="1" max="20" placeholder="Vazio para rolar no sistema" /></label></div>
        <label>Segundo d20 físico<input name="roll2" type="number" min="1" max="20" placeholder="Para vantagem ou desvantagem" /></label>
        <div className="form-grid"><label>Origem do bônus extra<input name="bonusLabel" maxLength="100" placeholder="Ex.: arma ou efeito temporário" /></label><label>Bônus ou penalidade<input name="bonus" type="number" min="-100" max="100" defaultValue="0" /></label></div>
        <label className="check"><input type="checkbox" name="reroll" /> Repetir 1 uma vez nas rolagens do sistema</label>
        <p className="muted">Ative apenas se sua regra permitir. Dados físicos já informados são respeitados.</p>
        <button className="primary" disabled={busy}>{busy ? 'Calculando…' : 'Calcular teste'}</button>
      </form>
    </section>
    <div className="form-stack"><section className="panel"><h2>Dados de dano e efeitos</h2><form className="form-stack" onSubmit={rollDice}>
      <label>Expressão<input name="expression" defaultValue="1d6 + 3" maxLength="100" required /></label>
      <label className="check"><input name="critical" type="checkbox" /> Crítico: duplicar os dados desta expressão</label>
      <p className="muted">Os bônus fixos não são duplicados. Confirme com a mesa quais dados fazem parte do crítico.</p>
      <button className="secondary" disabled={busy}>Rolar dados</button>
    </form></section>
    <section className="panel calculation-result" aria-live="polite"><p className="eyebrow">Resultado explicado</p>
      {result ? <><strong className="result-number">{result.total}</strong><p>{result.success === true ? 'Sucesso' : result.success === false ? 'Falha' : 'Compare com a dificuldade definida na mesa.'}</p>
        {result.mode && <p className="muted">{({ normal: 'Rolagem normal', advantage: 'Vantagem: maior dado', disadvantage: 'Desvantagem: menor dado' })[result.mode]} · Dados: {result.rolls.join(', ')}</p>}
        <ul className="breakdown">{result.breakdown.map((part, index) => <li key={index}><span>{part.label ?? (part.count ? `${part.count}${result.critical ? ' × 2' : ''}d${part.sides}: ${part.rolls.join(', ')}` : 'Bônus fixo')}</span><strong>{part.value}</strong></li>)}</ul>
        {result.rerolls?.map((r) => <p key={r.index} className="muted">Dado {r.index + 1}: 1 repetido, novo resultado {r.replacement}.</p>)}
        {result.automatic && <p className="tag">Resultado natural aplicado ao ataque.</p>}</> : <p className="muted">Faça um teste para ver de onde vem cada parte do total.</p>}
      {error && <p role="alert" className="error-text">{error}</p>}
    </section></div>
  </div>;
}
