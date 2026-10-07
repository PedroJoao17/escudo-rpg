// Dados fictícios. Os anexos pessoais e os livros não são distribuídos pelo repositório.
export const demoIds = {
  campaign: '11111111-1111-4111-8111-111111111111',
  character: '22222222-2222-4222-8222-222222222222',
};
const id = (n) => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;

export function demoData() {
  const campaign = { id: demoIds.campaign, name: 'Fortaleza do Horizonte', description: 'Campanha fictícia para experimentar o escudo.', rulesProfile: 'homebrew', gameDay: 12 };
  const character = { id: demoIds.character, campaignId: campaign.id, revision: 0, name: 'Ari, o Batedor', className: 'Explorador', species: 'Halfling', background: 'Viajante', level: 2, hp: 18, hpMax: 22, tempHp: 0, armorClass: 14, speed: 7.5, attributes: { str: 10, dex: 17, con: 13, int: 12, wis: 14, cha: 9 }, details: { História: 'Um viajante que encontrou uma nova família entre os defensores da fortaleza.', Ideal: 'Proteger quem precisa de ajuda.', Vínculos: 'A companhia de exploradores.', Idiomas: 'Comum e halfling', 'Perícias e salvaguardas': 'Anote aqui suas proficiências e as exceções da mesa.' }, resources: [{ name: 'Rações', current: 3, max: 3, reset: 'manual' }] };
  const record = (n, kind, title, body, payload = {}, knowledge = 'confirmed') => ({ id: id(n), campaignId: campaign.id, characterId: ['ability', 'item', 'companion'].includes(kind) ? character.id : null, revision: 0, kind, title, body, payload, knowledge, source: 'Exemplo fictício do projeto' });
  const entries = [
    record(1, 'ability', 'Olhar atento', 'Consulte as condições com o mestre antes de aplicar vantagem em uma percepção.', { requiredLevel: 1, learned: true, category: 'Passiva', activation: 'Passiva', cost: 'Nenhum' }),
    record(2, 'ability', 'Golpe focado', 'Técnica de exemplo para organizar progressão. Os efeitos precisam ser definidos pela mesa.', { requiredLevel: 3, learned: false, category: 'Técnica', activation: 'Ação', cost: '1 ponto de foco' }, 'needs-review'),
    record(3, 'item', 'Arco de viagem', 'Arma de exemplo. Registre aqui dano, alcance e propriedades confirmadas.', { quantity: 1, equipped: true, weight: 1, container: 'Equipado' }),
    record(4, 'item', 'Flechas', 'Munição guardada na aljava.', { quantity: 12, equipped: false, weight: 0.05, container: 'Aljava' }),
    record(5, 'item', 'Kit de reparos', 'Ferramenta reutilizável. Não é consumida automaticamente.', { quantity: 1, reusable: true, weight: 2, container: 'Mochila' }),
    record(6, 'npc', 'Mira, a artesã', 'Responsável pela oficina. Pode avaliar ferramentas danificadas.', { role: 'Artesã', unlocked: false, aliases: [] }),
    record(7, 'npc', 'Téo, o curandeiro', 'Responsável pela enfermaria. Custos de atendimento ainda precisam de confirmação.', { role: 'Curandeiro', unlocked: true, aliases: [] }),
    record(8, 'location', 'Oficina', 'Bancadas, ferramentas e materiais de manutenção.', { x: 25, y: 35, status: 'Operante' }),
    record(9, 'location', 'Enfermaria', 'Local de atendimento dos feridos.', { x: 70, y: 30, status: 'Poucos suprimentos' }),
    record(10, 'location', 'Torre de vigia', 'Ponto elevado para observar as trilhas.', { x: 50, y: 75, status: 'Acesso conhecido' }),
    record(11, 'mechanic', 'Reparos durante o cerco', 'Registre limite diário, ferramentas necessárias, teste e dificuldade informados pelo mestre. O registro organiza a consulta; não altera o mundo automaticamente.', { trigger: 'Durante o dia da campanha', reset: 'Amanhecer', cost: 'Conforme a mesa' }),
    record(12, 'mechanic', 'Atendimento na enfermaria', 'Distinguir ferramenta reutilizável, bandagem consumível e tempo de atendimento. Confirmar se um tratamento de custo zero ainda usa uma oportunidade de atendimento.', { trigger: 'Atender um ferido', reset: 'Amanhecer', cost: 'A confirmar' }, 'needs-review'),
    record(13, 'note', 'Preparar a próxima saída', 'Conversar com a artesã, repor munição e perguntar sobre a trilha ao norte.', { gameDay: 12, section: 'Sessão', sessionDate: '2026-10-07' }),
    record(14, 'companion', 'Lobo viajante', 'Companheiro de exemplo. Confirmar ação de comando e regras de montaria com o mestre.', { role: 'Companheiro / montaria' }, 'needs-review'),
  ];
  const links = [[6, 8, 'responsible-for'], [7, 9, 'responsible-for'], [11, 8, 'located-at'], [12, 9, 'located-at'], [11, 6, 'uses'], [12, 7, 'uses']].map(([from, to, relation], index) => ({ id: id(100 + index), campaignId: campaign.id, sourceId: id(from), targetId: id(to), relation }));
  return { campaigns: [campaign], characters: [character], entries, links };
}
