import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BattleHub from '../src/components/battle-hub.jsx';

const character = {
  id: 'personagem', level: 3, hp: 20, hpMax: 24, armorClass: 15, speed: 9,
  attributes: { str: 12, dex: 16, con: 14, int: 10, wis: 13, cha: 8 },
};

const entries = [
  { id: 'arma-1', kind: 'item', characterId: 'personagem', title: 'Espada curta', body: 'Arma leve.', payload: { equipped: true, quantity: 2 } },
  { id: 'tecnica-1', kind: 'ability', characterId: 'personagem', title: 'Ataque coordenado', body: '', payload: { learned: true, requiredLevel: 3, category: 'Técnica', activation: 'Ação' } },
  { id: 'passiva-1', kind: 'ability', characterId: 'personagem', title: 'Duas armas', body: '', payload: { learned: true, requiredLevel: 2, category: 'Passiva', activation: 'Passiva' } },
];

it('monta um plano de combate com recursos disponíveis e estratégia editável', async () => {
  const onSavePlan = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<BattleHub character={character} entries={entries} busy={false} onOpenEntry={vi.fn()} onSavePlan={onSavePlan} onDeletePlan={vi.fn()} />);

  await user.click(screen.getByRole('button', { name: '+ Criar plano' }));
  await user.type(screen.getByLabelText('Nome do combo / ataque'), 'Investida dupla');
  await user.click(screen.getByLabelText('Espada curta'));
  await user.click(screen.getByLabelText(/Ataque coordenado/));
  await user.click(screen.getByLabelText('Duas armas'));
  await user.type(screen.getByLabelText('Sequência do turno'), 'Aproximar e executar os dois ataques.');
  await user.type(screen.getByLabelText('Estratégia / objetivo'), 'Pressionar um alvo isolado.');
  await user.click(screen.getByRole('button', { name: 'Salvar plano de combate' }));

  expect(onSavePlan).toHaveBeenCalledWith(null, expect.objectContaining({
    title: 'Investida dupla',
    payload: expect.objectContaining({
      combatPlan: true,
      weaponIds: ['arma-1'],
      techniqueIds: ['tecnica-1'],
      passiveIds: ['passiva-1'],
      sequence: 'Aproximar e executar os dois ataques.',
      strategy: 'Pressionar um alvo isolado.',
    }),
  }));
});
