const campaignId = '11111111-1111-4111-8111-111111111111';
const characterId = '22222222-2222-4222-8222-222222222222';
const id = (n) => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;

export function createMockData() {
  const campaign = {
    id: campaignId,
    name: 'Forte Galdrak',
    description: 'Campanha de Arknodia centrada no Forte Galdrak, suas incursões, recursos e ameaças ao redor da fortificação.',
    rulesProfile: 'homebrew',
    gameDay: 1,
  };

  const character = {
    id: characterId,
    campaignId,
    revision: 0,
    name: 'Ander Espinhoso',
    className: 'Patrulheiro Espinhudo',
    species: 'Halfling Pés-Leves',
    background: 'Herói do Povo',
    level: 3,
    hp: 11,
    hpMax: 11,
    tempHp: 0,
    armorClass: 14,
    speed: 7.5,
    attributes: { str: 10, dex: 17, con: 13, int: 12, wis: 14, cha: 9 },
    details: {
      História: 'Batedor e patrulheiro ligado ao Forte Galdrak. Sua motivação é proteger pessoas vulneráveis e enfrentar criaturas e forças associadas às trevas.',
      Ideal: 'Justiça.',
      Vínculos: 'Proteger os indefesos e ajudar quem não consegue se defender sozinho.',
      Defeitos: 'Tem dificuldade com alguns vícios da cidade, incluindo bebida.',
      Idiomas: 'Comum e Halfling.',
      Perícias: 'Adestrar Animais e Sobrevivência pelo antecedente; demais escolhas de classe devem ser conferidas na ficha vigente.',
      Salvaguardas: 'Força e Destreza.',
      Proficiências: 'Armaduras leves e médias, escudos, armas simples e marciais; ferramentas de artesão e veículos terrestres.',
      Especializações: 'Patrulheiro móvel, duas lâminas, arco curto e suporte de campo.',
      Observações: 'PV 11 é o último valor recuperado das notas anteriores e pode precisar de atualização na ficha atual de nível 3.',
    },
    resources: [{ name: 'Ímpeto', current: 2, max: 2, reset: 'Descanso curto ou longo, conforme rework do mestre' }],
  };

  const record = (n, kind, title, body, payload = {}, knowledge = 'confirmed', source = 'Notas do jogador · Forte Galdrak') => ({
    id: id(n), campaignId, characterId: ['ability', 'item', 'companion'].includes(kind) ? characterId : null,
    revision: 0, kind, title, body, payload, knowledge, source,
  });

  const entries = [
    record(1, 'ability', 'Senso do Sobrevivente', 'Habilidade de nível 1 do rework válido do Patrulheiro Espinhudo. O texto mecânico completo deve seguir a versão aprovada pelo mestre.', { requiredLevel: 1, learned: true, category: 'Passiva', activation: 'Passiva', cost: 'Nenhum' }),
    record(2, 'ability', 'Estilos Adaptáveis', 'Conjunto de estilos/posturas do Patrulheiro Espinhudo. Use as descrições aprovadas pelo mestre para cada forma de combate.', { requiredLevel: 1, learned: true, category: 'Posturas', activation: 'Conforme postura', combatStyle: 'Duas lâminas / arco / lâmina', effect: 'Alterna a forma de combate conforme a situação.' }),
    record(3, 'ability', 'Mestria Tripla', 'Habilidade de nível 2 do rework do mestre, ligada à versatilidade entre as formas de combate.', { requiredLevel: 2, learned: true, category: 'Passiva', activation: 'Passiva' }),
    record(4, 'ability', 'Marca Espinhuda', 'Com Trust e Hope, o alvo marcado recebe +1d4 no próximo acerto registrado nas notas anteriores.', { requiredLevel: 2, learned: true, category: 'Passiva', activation: 'Ao acertar com as lâminas', effect: '+1d4 no próximo acerto contra o alvo marcado.' }),
    record(5, 'ability', 'Arco Vigilante', 'A primeira flecha acertada no turno recebe +1 de dano, conforme as notas de combate recuperadas.', { requiredLevel: 2, learned: true, category: 'Passiva', activation: 'Primeiro acerto com arco no turno', effect: '+1 de dano na primeira flecha acertada.' }),
    record(6, 'ability', 'Ímpeto', 'Recurso desbloqueado no nível 3 no rework do mestre.', { requiredLevel: 3, learned: true, category: 'Recurso', activation: 'Conforme técnica', cost: 'Consome Ímpeto' }),
    record(7, 'ability', 'Técnicas de Mestria', 'Grupo de técnicas desbloqueado no nível 3. Consulte a redação do rework para efeitos e custos específicos.', { requiredLevel: 3, learned: true, category: 'Técnica', activation: 'Conforme técnica', cost: 'Ímpeto' }),
    record(8, 'ability', 'Sem Fôlego', 'Habilidade do nível 3 no rework válido do mestre. Efeito detalhado não foi reconstituído no mock para evitar inventar regra.', { requiredLevel: 3, learned: true, category: 'Passiva', activation: 'Passiva' }, 'needs-review'),
    record(9, 'ability', 'Transição Fluida', 'Habilidade do nível 3 no rework válido do mestre. Efeito detalhado deve ser conferido no texto da classe.', { requiredLevel: 3, learned: true, category: 'Passiva', activation: 'Conforme troca de estilo' }, 'needs-review'),

    record(20, 'item', 'Trust', 'Uma das duas espadas curtas principais de Ander.', { itemType: 'weapon', quantity: 1, equipped: true, container: 'Equipado', damage: '1d6 + 3 perfurante', range: 'Corpo a corpo', properties: 'Espada curta; usada em conjunto com Hope' }),
    record(21, 'item', 'Hope', 'Uma das duas espadas curtas principais de Ander.', { itemType: 'weapon', quantity: 1, equipped: true, container: 'Equipado', damage: '1d6 + 3 perfurante', range: 'Corpo a corpo', properties: 'Espada curta; usada em conjunto com Trust' }),
    record(22, 'item', 'Arco curto', 'Arma de apoio à distância.', { itemType: 'weapon', quantity: 1, equipped: true, container: 'Equipado', damage: '1d6 + 3 perfurante', range: 'Arco curto', properties: 'Arma de apoio à distância' }),
    record(23, 'item', 'Flechas', 'Munição armazenada na aljava.', { itemType: 'ammo', quantity: 20, equipped: false, container: 'Aljava' }),
    record(24, 'item', 'Armadura de couro', 'Proteção principal registrada nas notas de Ander.', { itemType: 'armor', quantity: 1, equipped: true, container: 'Vestida', armorClassBonus: 'CA base registrada: 14' }),
    record(25, 'item', 'Mochila', 'Mochila de viagem e incursão.', { itemType: 'general', quantity: 1, container: 'Carregada' }),
    record(26, 'item', 'Capa curta', 'Peça de vestuário de Ander.', { itemType: 'general', quantity: 1, container: 'Vestida' }),
    record(27, 'item', 'Luvas', 'Peça de vestuário e proteção leve.', { itemType: 'general', quantity: 1, container: 'Vestidas' }),
    record(28, 'item', 'Ferramentas de artesão', 'Ferramentas obtidas pelo antecedente.', { itemType: 'tool', quantity: 1, reusable: true, container: 'Mochila' }),
    record(29, 'item', 'Pá', 'Ferramenta de campo.', { itemType: 'tool', quantity: 1, reusable: true, container: 'Mochila' }),
    record(30, 'item', 'Pote de ferro', 'Utensílio carregado nas viagens.', { itemType: 'tool', quantity: 1, reusable: true, container: 'Mochila' }),
    record(31, 'item', 'Roupas comuns', 'Conjunto de roupas comuns.', { itemType: 'general', quantity: 1, container: 'Mochila' }),
    record(32, 'item', 'Algibeira', 'Algibeira pessoal.', { itemType: 'general', quantity: 1, container: 'Cintura' }),
    record(33, 'item', 'Pena verde brilhante', 'Bugiganga de Ander.', { itemType: 'narrative', quantity: 1, container: 'Algibeira' }),
    record(34, 'item', 'Peças de ouro', 'Ouro inicial registrado para Ander.', { itemType: 'currency', quantity: 110, container: 'Algibeira' }),

    record(40, 'npc', 'Brenn', 'Escudeiro escolhido por Ander para a excursão de busca por recursos.', { role: 'Escudeiro', unlocked: true, trust: 'conquistada', availability: 'available', aliases: [] }),
    record(41, 'npc', 'Cain', 'Soldado escolhido por Ander para acompanhar a incursão fora do Forte Galdrak.', { role: 'Soldado', unlocked: true, trust: 'conquistada', availability: 'available', aliases: ['Caim'] }),
    record(42, 'npc', 'Padre Aldren', 'Figura associada ao Forte Galdrak nas notas anteriores. Detalhes atuais devem ser confirmados durante a campanha.', { role: 'Religioso / apoio do forte', unlocked: false, availability: 'known', aliases: [] }, 'needs-review'),

    record(50, 'companion', 'Rati', 'Lobo adestrado que acompanha Ander em campo e nas incursões.', { role: 'Lobo companheiro', hp: null, hpMax: null, command: 'Acompanha Ander e pode avançar com ele para reconhecimento.', availability: 'available' }),

    record(60, 'location', 'Forte Galdrak', 'Base atual do grupo e ponto de partida das excursões.', { x: 50, y: 70, status: 'Base do grupo' }),
    record(61, 'location', 'Floresta ao redor do Forte', 'Área de aproximação furtiva e reconhecimento utilizada na excursão.', { x: 50, y: 45, status: 'Área de patrulha e risco' }),
    record(62, 'location', 'Acampamento inimigo', 'Acampamento localizado durante a incursão de Ander, Brenn, Cain e Rati.', { x: 70, y: 25, status: 'Hostil' }),
    record(63, 'location', 'Enfermaria do Forte', 'Área de atendimento dos feridos e recuperação dentro do Forte Galdrak.', { x: 30, y: 72, status: 'Conhecida' }),

    record(70, 'mechanic', 'Confiança com NPCs', 'A relação e confiança com personagens do forte pode liberar apoio ou benefícios. O efeito concreto depende do que o mestre confirmar.', { trigger: 'Interações e eventos da campanha', reset: 'Não automático', cost: 'Nenhum' }),
    record(71, 'mechanic', 'Reparos e manutenção no Forte', 'Ander possui ferramentas e pode apoiar atividades de reparo. Limites, testes e benefícios devem seguir a mesa.', { trigger: 'Quando houver estrutura ou equipamento para reparar', reset: 'Conforme a mesa', cost: 'Ferramentas / materiais' }, 'needs-review'),
    record(72, 'mechanic', 'Atendimento na enfermaria', 'Mecânica conhecida de atendimento aos feridos. Custos e limites permanecem sob decisão do mestre.', { trigger: 'Quando um ferido recebe atendimento', reset: 'Conforme a mesa', cost: 'A confirmar' }, 'needs-review'),

    record(80, 'note', 'Forte Galdrak: a excursão', 'Ander escolheu Brenn e Cain para investigar acampamentos inimigos e conseguir recursos para o Forte Galdrak. O grupo saiu furtivamente até a floresta; Ander avançou primeiro com Rati para reconhecimento. A incursão envolveu o acampamento inimigo, saque em três mochilas, um dardo, armadilhas na floresta e o resgate de Cain antes do retorno ao forte.', { gameDay: 1, section: 'Sessão' }),
    record(81, 'note', 'Conseguir recursos para o Forte Galdrak', 'Investigar os arredores, localizar ameaças e retornar com recursos úteis sem comprometer a segurança do grupo.', { gameDay: 1, section: 'Objetivo', objectiveStatus: 'open' }),
    record(82, 'note', 'Proteger os indefesos', 'Objetivo pessoal recorrente de Ander, ligado ao seu ideal de Justiça.', { gameDay: 1, section: 'Objetivo', objectiveStatus: 'open' }),
  ];

  const links = [
    [40, 60, 'located-at'], [41, 60, 'located-at'], [42, 60, 'located-at'], [50, 80, 'mentions'],
    [80, 61, 'located-at'], [80, 62, 'located-at'], [81, 60, 'mentions'], [71, 60, 'located-at'], [72, 63, 'located-at'],
  ].map(([from, to, relation], index) => ({ id: id(100 + index), campaignId, sourceId: id(from), targetId: id(to), relation }));

  return { campaigns: [campaign], characters: [character], entries, links };
}
