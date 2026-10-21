import { test, expect } from '@playwright/test';

async function navigate(page, name) {
  const sidebar = page.getByRole('complementary', { name: 'Navegação principal' });
  const menuButton = page.getByRole('button', { name: 'Abrir menu principal' });
  const mobile = await menuButton.isVisible();

  if (mobile) {
    await expect(sidebar).toBeHidden();
    await menuButton.click();
    await expect(sidebar).toBeVisible();
  }

  const destination = sidebar.getByRole('button', { name, exact: true });
  await expect(destination).toBeVisible();
  await destination.click();

  if (mobile) await expect(sidebar).toBeHidden();
}

function uniqueName(prefix) {
  const info = test.info();
  return `${prefix} ${info.project.name}-${info.retry}-${Date.now()}`;
}

test('infos gerais, inventário, consumo e cálculo no Hub de Combate funcionam através da API', async ({ page }) => {
  const itemName = uniqueName('Poção');

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ari, o Batedor' })).toBeVisible();
  await expect(page.getByText('CONSULTA · SEM EDIÇÃO NESTA TELA')).toBeVisible();

  await navigate(page, 'Inventário');
  await page.getByRole('button', { name: '+ Item', exact: true }).click();
  await page.getByLabel('Nome ou título').fill(itemName);
  await page.getByLabel('Tipo de item').selectOption('consumable');
  await page.getByLabel('Quantidade', { exact: true }).fill('2');
  await page.getByLabel('Descrição completa').fill('Item adquirido nesta sessão.');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: `Consumir uma unidade de ${itemName}` }).click();
  await expect(page.getByLabel(`Quantidade de ${itemName}`)).toHaveText('1');

  await page.reload();
  await navigate(page, 'Inventário');
  await expect(page.getByLabel(`Quantidade de ${itemName}`)).toHaveText('1');

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
  const objectiveName = uniqueName('Objetivo');

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
  await page.getByLabel('Nome ou título').fill(objectiveName);
  await page.getByLabel('Descrição completa').fill('Uma tarefa ainda precisa ser resolvida.');
  await page.getByLabel('Confiança na informação').selectOption('confirmed');
  await page.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.getByRole('heading', { name: objectiveName })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
