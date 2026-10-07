import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryEditor from '../src/components/entry-editor.jsx';

it('salva notas com texto completo, origem e data sem confundir dia da campanha', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<EntryEditor kind="note" gameDay={31} onSave={onSave} busy={false} />);
  await user.type(screen.getByLabelText('Nome ou título'), 'Objetivo da sessão');
  await user.type(screen.getByLabelText('Descrição completa'), 'Encontrar o ferreiro e preservar a informação.');
  await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Objetivo da sessão', body: 'Encontrar o ferreiro e preservar a informação.', source: 'Anotação do jogador', payload: { gameDay: 31, section: 'Sessão' } }));
});

it('não perde campos de origem ao editar um registro importado', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<EntryEditor kind="item" characterId="personagem" entry={{ title: 'Kit', body: 'Ferramenta', source: 'Original.md', knowledge: 'confirmed', payload: { quantity: 1, originalBody: 'Fonte integral', reusable: true } }} onSave={onSave} busy={false} />);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar registro' }));
  expect(onSave.mock.calls[0][0].payload).toMatchObject({ quantity: 1, originalBody: 'Fonte integral', reusable: true });
});
