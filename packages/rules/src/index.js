function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${label} fora do intervalo ${min}–${max}.`);
  return value;
}

export function abilityModifier(score) {
  return Math.floor((integer(score, 1, 30, 'Atributo') - 10) / 2);
}

export function proficiencyBonus(level) {
  return 2 + Math.floor((integer(level, 1, 20, 'Nível') - 1) / 4);
}

/** O total é explicado; 1/20 naturais só determinam resultado automático em ataques. */
export function calculateCheck({ score, level, proficiency = 'none', bonuses = [], rolls, advantage = false, disadvantage = false, difficulty, kind = 'check' }) {
  if (!['none', 'proficient', 'expertise'].includes(proficiency)) throw new Error('Proficiência inválida.');
  if (!['check', 'save', 'attack'].includes(kind)) throw new Error('Tipo de teste inválido.');
  if (!Array.isArray(bonuses) || bonuses.length > 20) throw new Error('Até 20 modificadores por cálculo.');
  const mode = advantage === disadvantage ? 'normal' : advantage ? 'advantage' : 'disadvantage';
  const count = mode === 'normal' ? 1 : 2;
  if (!Array.isArray(rolls) || rolls.length !== count) throw new Error(`Informe ${count} resultado(s) de d20.`);
  rolls.forEach((roll) => integer(roll, 1, 20, 'd20'));
  if (difficulty !== undefined) integer(difficulty, 1, 100, 'CD');
  const selected = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls[0];
  const bonus = proficiencyBonus(level) * ({ none: 0, proficient: 1, expertise: 2 }[proficiency]);
  const breakdown = [
    { label: 'd20', value: selected },
    { label: 'Modificador de atributo', value: abilityModifier(score) },
    { label: 'Proficiência', value: bonus },
    ...bonuses.map((b) => {
      if (typeof b.label !== 'string' || !b.label.trim() || b.label.length > 100) throw new Error('Identifique a origem do modificador.');
      return { label: b.label.trim(), value: integer(b.value, -100, 100, 'Modificador') };
    }),
  ];
  const total = breakdown.reduce((sum, part) => sum + part.value, 0);
  const automatic = kind === 'attack' && (selected === 1 || selected === 20);
  const success = automatic ? selected === 20 : difficulty === undefined ? null : total >= difficulty;
  return { total, selected, rolls, mode, breakdown, success, automatic, natural: selected === 1 || selected === 20 ? selected : null };
}

/** RNG injetável para testes. A API usa crypto.randomInt; não reexecuta Sortudo indefinidamente. */
export function rollCheck(input, rollDie) {
  const count = Boolean(input.advantage) === Boolean(input.disadvantage) ? 1 : 2;
  const rerolls = [];
  const rolls = Array.from({ length: count }, (_, index) => {
    const original = rollDie(20);
    if (input.rerollOnes && original === 1) {
      const replacement = rollDie(20);
      rerolls.push({ index, original, replacement });
      return replacement;
    }
    return original;
  });
  return { ...calculateCheck({ ...input, rolls }), rerolls };
}

/** Apenas soma/subtração de dados e inteiros. Não executa JavaScript nem expressões arbitrárias. */
export function parseDice(expression) {
  if (typeof expression !== 'string' || expression.length > 100) throw new Error('Expressão de dados inválida.');
  const compact = expression.toLowerCase().replace(/\s+/g, '');
  if (!/^[+-]?(?:\d+d\d+|\d+)(?:[+-](?:\d+d\d+|\d+))*$/.test(compact)) throw new Error('Use uma expressão como 1d6 + 1d4 + 3.');
  let totalDice = 0;
  const terms = compact.match(/[+-]?[^+-]+/g).map((token) => {
    const sign = token.startsWith('-') ? -1 : 1;
    const body = token.replace(/^[+-]/, '');
    if (!body.includes('d')) return { sign, value: integer(Number(body), 0, 1000, 'Bônus') };
    const [count, sides] = body.split('d').map(Number);
    integer(count, 1, 100, 'Quantidade de dados');
    if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) throw new Error('Use d4, d6, d8, d10, d12, d20 ou d100.');
    totalDice += count;
    return { sign, count, sides };
  });
  if (totalDice > 100) throw new Error('Limite de 100 dados por rolagem.');
  return terms;
}

export function rollExpression(expression, rollDie, { critical = false } = {}) {
  const terms = parseDice(expression);
  if (critical && terms.reduce((n, t) => n + (t.count ?? 0), 0) > 50) throw new Error('Limite de 100 dados incluindo o crítico.');
  const breakdown = terms.map((term) => {
    const rolls = term.count ? Array.from({ length: term.count * (critical ? 2 : 1) }, () => integer(rollDie(term.sides), 1, term.sides, 'Dado')) : [];
    const value = term.sign * (term.count ? rolls.reduce((a, b) => a + b, 0) : term.value);
    return { ...term, rolls, value };
  });
  return { expression, critical, total: breakdown.reduce((n, t) => n + t.value, 0), breakdown };
}

export function adjustHitPoints(character, delta) {
  integer(delta, -10000, 10000, 'Alteração de PV');
  let { hp, hpMax, tempHp } = character;
  if (delta < 0) {
    const absorbed = Math.min(tempHp, -delta);
    tempHp -= absorbed;
    hp = Math.max(0, hp + delta + absorbed);
  } else hp = Math.min(hpMax, hp + delta);
  return { hp, tempHp };
}
