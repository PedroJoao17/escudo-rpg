import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterEditor from '../src/components/character-editor.jsx';

it('salva perícias e salvaguardas em campos separados da ficha', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<CharacterEditor busy={false} onSave={onSave} />);

  await user.type(screen.getByLabelText('Nome do personagem'), 'Nara');
  await user.click(screen.getByLabelText('DES · Destreza'));
  await user.click(screen.getByLabelText('Furtividade'));
  await user.click(screen.getByLabelText('Percepção'));
  await user.type(screen.getByLabelText('Idiomas'), 'Comum, Élfico');
  await user.click(screen.getByRole('button', { name: 'Criar personagem' }));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Nara',
    details: expect.objectContaining({
      Salvaguardas: 'DES',
      'Perícias': 'Furtividade, Percepção',
      Idiomas: 'Comum, Élfico',
    }),
  }));
});
