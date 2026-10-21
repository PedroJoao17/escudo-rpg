import { test, expect } from '@playwright/test';

async function navigate(page, name) {
  const sidebar = page.getByRole('complementary', { name: 'Navegação principal' });
  if (!(await sidebar.isVisible())) await page.getByRole('button', { name: 'Abrir menu principal' }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

test('infos gerais, inventário, consumo e cálculo no Hub de Combate funcionam através da API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ari, o Batedor' })).toBeVisible();
  await expect(page.getByText('CONSULTA · SEM EDIÇÃO NESTA TELA')).toBeVisible();

  await navigate(page, 'Inventário');
  await page.getByRole('button', { name: '+ Item', exact: true }).click();
  await page.getByLabel('Nome ou título').fill(`Poção ${test.info().project.name}`);
  await page.getByLabel('Tipo de item').selectOption('consumable');
  await page.getByLabel('Quantidade', { exact: true }).fill('2');
  await page.getByLabel('Descrição completa').fill('Item adquirido nesta sessão.');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: `Consumir uma unidade de Poção ${test.info().project.name}` }).click();
  await expect(page.getByLabel(`Quantidade de Poção ${test.info().project.name}`)).toHaveText('1');

  await page.reload();
  await navigate(page, 'Inventário');
  await expect(page.getByLabel(`Quantidade de Poção ${test.info().project.name}`)).toHaveText('1');

  await navigate(page, 'Combate');
  await page.getByText('Rolagens e cálculo manual').click();
  await page.getByLabel('Primeiro d20 físico').fill('12');
  await page.getByRole('combobox', { name: 'Proficiência', exact: true }).selectOption('proficient');
  await page.getByRole('button', { name: 'Calcular teste' }).click();
  await expect(page.locator('.result-number')).toHaveText('17');
  await expect(page.getByText('Modificador de atributo')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('campanha centraliza NPCs, locais e objetivos mantendo a origem', async ({ page }) => {
  await page.goto('/');
  await navigate(page, 'Campanha');
  await page.getByRole('button', { name: /NPCs/ }).click();
  await page.getByRole('button', { name: 'Editar Mira, a artesã' }).click();
  await expect(page.getByLabel('Origem da informação')).toHaveValue('Exemplo fictício do projeto');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();

  await page.getByRole('button', { name: /Locais/ }).click();
  await expect(page.getByText('Mapa esquemático · sem escala')).toBeVisible();

  await page.getByRole('button', { name: /Objetivos/ }).click();
  await page.getByRole('button', { name: '+ Adicionar', exact: true }).click();
  await page.getByLabel('Nome ou título').fill(`Objetivo ${test.info().project.name}`);
  await page.getByLabel('Descrição completa').fill('Uma tarefa ainda precisa ser resolvida.');
  await page.getByLabel('Confiança na informação').selectOption('confirmed');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('heading', { name: `Objetivo ${test.info().project.name}` })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
