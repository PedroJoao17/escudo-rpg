import { describe, expect, it } from 'vitest';
import { abilityModifier, proficiencyBonus, calculateCheck, rollCheck, parseDice, rollExpression, adjustHitPoints } from '../src/index.js';

describe('cálculos explicáveis', () => {
  it('arredonda atributos negativos para baixo e aplica patamares de proficiência', () => {
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(17)).toBe(3);
    expect([1, 4, 5, 20].map(proficiencyBonus)).toEqual([2, 2, 3, 6]);
  });
  it('cancela vantagem com desvantagem sem somar proficiência duas vezes', () => {
    const result = calculateCheck({ score: 17, level: 2, proficiency: 'expertise', rolls: [10], advantage: true, disadvantage: true, bonuses: [{ label: 'Arma', value: 1 }] });
    expect(result.total).toBe(18);
    expect(result.mode).toBe('normal');
    expect(result.breakdown).toHaveLength(4);
  });
  it('não trata um 20 natural em perícia como sucesso automático', () => {
    expect(calculateCheck({ score: 9, level: 1, rolls: [20], difficulty: 25 }).success).toBe(false);
    expect(calculateCheck({ score: 9, level: 1, rolls: [20], difficulty: 25, kind: 'attack' }).success).toBe(true);
  });
  it('escolhe o dado correto e valida dados ausentes', () => {
    expect(calculateCheck({ score: 10, level: 1, rolls: [4, 17], disadvantage: true }).selected).toBe(4);
    expect(() => calculateCheck({ score: 10, level: 1, rolls: [4], advantage: true })).toThrow();
  });
  it('repete o 1 apenas uma vez, inclusive quando o segundo resultado é 1', () => {
    const sequence = [1, 1];
    const result = rollCheck({ score: 10, level: 1, rerollOnes: true }, () => sequence.shift());
    expect(result.selected).toBe(1);
    expect(result.rerolls).toEqual([{ index: 0, original: 1, replacement: 1 }]);
  });
  it('duplica dados, mas não o bônus fixo, em um crítico explicitamente solicitado', () => {
    expect(rollExpression('1d6 + 1d4 + 3', () => 2, { critical: true }).total).toBe(11);
  });
  it.each(['0d6', '101d6', '1d7', 'process.exit()', '1d6 * 3', '1d6; alert(1)', '', '99d6+99d4'])('rejeita expressão inválida: %s', (input) => {
    expect(() => parseDice(input)).toThrow();
  });
  it('absorve dano com PV temporários e limita cura ao máximo', () => {
    const character = { hp: 10, hpMax: 15, tempHp: 3 };
    expect(adjustHitPoints(character, -5)).toEqual({ hp: 8, tempHp: 0 });
    expect(adjustHitPoints(character, 99)).toEqual({ hp: 15, tempHp: 3 });
  });
});
