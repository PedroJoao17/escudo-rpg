import { test, expect } from '@playwright/test';

async function navigate(page, name) {
  await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

async function useSingleView(page) {
  await page.getByRole('button', { name: /Escudo aberto/ }).click();
}

test('ficha, cadastro de item, consumo, recarga e cálculo no Hub de Batalha funcionam através da API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ari, o Batedor' })).toBeVisible();
  await useSingleView(page);
  await page.getByRole('tab', { name: 'Inventário' }).click();
  await page.getByRole('button', { name: 'Adicionar Item', exact: true }).click();
  await page.getByLabel('Nome ou título').fill(`Poção ${test.info().project.name}`);
  await page.getByLabel('Quantidade', { exact: true }).fill('2');
  await page.getByLabel('Descrição completa').fill('Item adquirido nesta sessão.');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: `Consumir uma unidade de Poção ${test.info().project.name}` }).click();
  await expect(page.getByLabel(`Quantidade de Poção ${test.info().project.name}`)).toHaveText('1');
  await page.reload();
  await useSingleView(page);
  await page.getByRole('tab', { name: 'Inventário' }).click();
  await expect(page.getByLabel(`Quantidade de Poção ${test.info().project.name}`)).toHaveText('1');
  await navigate(page, 'Batalha');
  await page.getByText('Rolagens e cálculo manual').click();
  await page.getByLabel('Primeiro d20 físico').fill('12');
  await page.getByRole('combobox', { name: 'Proficiência', exact: true }).selectOption('proficient');
  await page.getByRole('button', { name: 'Calcular teste' }).click();
  await expect(page.locator('.result-number')).toHaveText('17');
  await expect(page.getByText('Modificador de atributo')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('consulta NPC e locais e registra diário mantendo a origem', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ari, o Batedor' })).toBeVisible();
  await navigate(page, 'Campanha');
  await useSingleView(page);
  await page.getByRole('button', { name: 'Editar Mira, a artesã' }).click();
  await expect(page.getByLabel('Origem da informação')).toHaveValue('Exemplo fictício do projeto');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('tab', { name: 'Locais', exact: true }).click();
  await expect(page.getByText('Mapa esquemático · sem escala')).toBeVisible();
  await navigate(page, 'Diário de sessão');
  await page.getByRole('button', { name: 'Adicionar Anotação', exact: true }).click();
  await page.getByLabel('Nome ou título').fill(`Pista ${test.info().project.name}`);
  await page.getByLabel('Descrição completa').fill('Uma pista ainda precisa de confirmação.');
  await page.getByLabel('Confiança na informação').selectOption('rumor');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('heading', { name: `Pista ${test.info().project.name}` })).toBeVisible();
});
