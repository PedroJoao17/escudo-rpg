# Escudo RPG

Escudo virtual para jogadores, com foco em organizar ficha, campanha, inventário, arsenal e combate sem exigir que o jogador mantenha informações espalhadas em várias ferramentas.

## Estado atual

A fase atual é **frontend-first**. O projeto roda com dados mock locais e **não depende de API, MySQL ou Docker para desenvolvimento e testes da interface**.

Os cinco hubs principais são:

- **Infos gerais** — consulta da ficha, atributos, PV, CA, deslocamento, perícias, salvaguardas, interpretação e recursos.
- **Campanha** — enredo/notas, NPCs, locais, mecânicas e objetivos.
- **Inventário** — objetos, consumíveis, ferramentas, itens narrativos e moedas.
- **Arsenal** — armas, armaduras, munição, técnicas, passivas e aliados.
- **Combate** — PV, rodada, XP manual, condições, recursos, munição, aliados, planos de combate, saque temporário e histórico local.

As áreas de arte já possuem placeholders responsivos, mas as imagens serão trabalhadas em uma etapa posterior.

## Mock atual

O mock usa como fonte o vault organizado do Obsidian e a ficha PDF de Ander. Quando as fontes divergem, a divergência é preservada no próprio registro em vez de ser resolvida por suposição.

Estado organizado atualmente:

- **Ander Espinhoso** — Halfling Pés-Leves, Patrulheiro Espinhudo, Herói do Povo;
- **nível 2** conforme o vault organizado; a ficha PDF anexada ainda exibe nível 1 e permanece registrada como referência anterior;
- CA 14, deslocamento 7,5 m e atributos da ficha;
- Trust, Hope, arco curto, zarabatana, flechas, dardos, armadura e demais itens presentes na ficha;
- Rati com ficha própria;
- Forte Galdrak no Dia 31 de cerco, com situação, NPCs, locais e mecânicas registradas nas notas;
- habilidades atuais detalhadas: Senso do Sobrevivente, os três Estilos Adaptáveis, Mestria Tripla, Marca Espinhuda e Afligir;
- progressão futura registrada sem liberar habilidades antes do nível correspondente, incluindo Ímpeto, Técnicas de Mestria, Sem Fôlego, Transição Fluida e técnicas posteriores.

As alterações feitas pela interface ficam em `localStorage`, portanto sobrevivem a reloads no mesmo navegador. Mudanças de versão do mock usam uma nova chave de armazenamento para carregar os dados-base atualizados.

## Executar

Pré-requisito recomendado: Node.js 24.

```powershell
git clone https://github.com/PedroJoao17/escudo-rpg.git
cd escudo-rpg
npm ci
npm run dev
```

Acesse:

```text
http://127.0.0.1:3000
```

`npm run dev` inicia **somente o Next.js** nesta fase.

## Verificações

```powershell
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

O Playwright valida desktop e mobile usando o mesmo mock local do frontend. A CI atual não sobe MySQL nem API.

## Backend futuro

A pasta `apps/api` permanece no repositório como trabalho preparatório/futuro, mas não participa do fluxo padrão desta fase.

Comandos explícitos de backend continuam disponíveis apenas para desenvolvimento posterior:

```powershell
npm run dev:api
npm run test:api
npm run test:db
npm run db:migrate
npm run db:seed
```

Esses comandos **não são executados por `npm run dev`, `npm test`, `npm run test:e2e` ou pela Action principal**.

## Estrutura

| Caminho | Responsabilidade atual |
| --- | --- |
| `apps/web` | Aplicação Next.js, hubs e mock local |
| `apps/web/src/lib/mock-data.js` | Dados iniciais de Ander / Forte Galdrak |
| `apps/web/src/lib/mock-api.js` | Operações locais que substituem a API nesta fase |
| `packages/rules` | Funções puras de cálculo |
| `tests/e2e` | Jornadas Playwright em desktop e mobile |
| `apps/api` | Backend preservado para fase futura; não iniciado por padrão |
| `docs` | Proposta, arquitetura e backlog |

## Próximas etapas

O foco imediato permanece no frontend: concluir organização dos hubs, responsividade, densidade visual, experiência de combate e, posteriormente, produzir as artes reservadas no layout. Backend e persistência real ficam para a fase definida nas issues específicas.
