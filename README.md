# Escudo RPG

Um escudo virtual para **jogadores**, pensado para quem quer acompanhar a própria ficha e organizar as informações recebidas durante a campanha.

O centro do projeto é o caderno pessoal do jogador. Ficha, habilidades, inventário, NPCs, mecânicas, locais e diário se conectam sem exigir experiência como mestre.

## Estado atual: base funcional local

| Área | Entregue nesta versão |
| --- | --- |
| Personagem | Habilidades, ficha ao centro e inventário; três painéis no desktop e navegação por abas no celular |
| Campanha | NPCs, mecânicas e locais; vínculos navegáveis entre os cartões |
| Ficha | Cadastro, atributos, nível, PV, PV temporários, CA, deslocamento, recursos existentes e seções de texto adicionais |
| Habilidades | Descrição, nível necessário, aprendida/futura, ativação, custo e origem |
| Inventário | Cadastro, quantidade, consumo/reposição, peso conhecido, recipiente e estado equipado |
| Locais | Mapa esquemático com posições percentuais e cartões; não representa uma planta real |
| Diário | Anotações completas, dia da campanha, data real, origem e indicação de rumor ou pendência |
| Calculadora | Dados físicos ou digitais, atributo, proficiência/especialização, vantagem/desvantagem, bônus identificados e detalhamento do total |
| Dados de dano | Expressões como `1d6 + 1d4 + 3`; crítico explícito duplica dados, mantendo os bônus fixos |
| Dados | API REST, Sequelize, MySQL, migração versionada, seed fictício idempotente e proteção por revisão contra sobrescrita concorrente |
| Importação | ZIP de notas Markdown/Obsidian, preservação integral, notas vazias, referências ausentes e proteção contra sobrescrita em reimportação |
| Exportação | Caderno completo em JSON, incluindo personagens, registros, fontes e relações |
| Qualidade | Vitest, React Testing Library, Supertest, Playwright, testes com MySQL real e GitHub Actions |

**Ainda não implementado:** autenticação, compartilhamento entre jogadores, PWA/offline, restauração de backup, progressão automática de classe, execução de habilidades, rastreio automático de turnos/descansos/dias, moedas estruturadas e aplicação automática das mecânicas de enfermaria/reparo. A CA cadastrada e os efeitos condicionais continuam sob controle do jogador. O perfil de regras identifica a referência; não instala um catálogo de regras.

O modo demonstrativo usa memória e **perde as alterações quando a API reinicia**. O modo MySQL é a opção persistente. A primeira versão usa loopback e não tem login; é destinada à execução local.

## Tecnologias

- Frontend: Next.js 16.4, React e JavaScript, App Router.
- Backend: Node.js 24, JavaScript ESM e Express.
- Banco: MySQL 8.4, Sequelize 6, mysql2 e Umzug para migrações.
- Testes: Vitest em frontend/API/domínio; Playwright em desktop e celular.
- Organização: npm workspaces, uma única branch `main`, issues e Actions.

As versões resolvidas estão fixadas no `package-lock.json`. Next.js documenta Vitest e Playwright como ferramentas de teste; Sequelize 6 permanece a linha estável utilizada aqui. Referências: [Vitest no Next.js](https://nextjs.org/docs/app/guides/testing/vitest), [Playwright no Next.js](https://nextjs.org/docs/app/guides/testing/playwright), [Sequelize 6](https://sequelize.org/docs/v6/) e [migrações](https://sequelize.org/docs/v6/other-topics/migrations/).

## Experimentar rapidamente

Pré-requisito: Node.js 24 com npm. Não precisa de instalação global do Next.js.

```powershell
git clone https://github.com/PedroJoao17/escudo-rpg.git
cd escudo-rpg
npm ci
npm run dev:demo
```

Se o repositório já estiver clonado, execute `git pull origin main` e `npm ci` dentro dele.

Acesse [http://localhost:3000](http://localhost:3000). A API fica em [http://127.0.0.1:4000](http://127.0.0.1:4000). Os exemplos são fictícios e não incluem a campanha pessoal nem os livros anexados.

## Executar com MySQL e salvar alterações

Com Docker Desktop em execução no Windows:

```powershell
Copy-Item .env.example .env
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run dev
```

No Linux/macOS, substitua `Copy-Item .env.example .env` por `cp .env.example .env`.

O banco usa a porta local **3307**, evitando disputar a porta usual 3306 com outra instalação. O volume `mysql_data` mantém os dados ao reiniciar os containers. `db:seed` adiciona apenas exemplos ausentes; não substitui registros existentes. Você pode criar uma nova campanha vazia pela interface. Para usar um MySQL já instalado, ajuste as variáveis `DB_*` no `.env` e crie o banco antes da migração.

Use `npm run dev`, com `DEMO_MODE=false`, para persistência. O comando `dev:demo` sempre ativa a demonstração, mesmo quando há um `.env` configurado para MySQL.

## Importar suas notas localmente

Os PDFs serviram como referência de análise. Não há importador automático de ficha PDF nesta versão. A ficha pode ser cadastrada pela interface. O importador atual é para **notas Markdown dentro de ZIP**.

Primeiro confira a importação, sem gravar:

```powershell
npm run campaign:import -- --zip "C:\caminho\Forte Galdrak.zip" --dry-run
```

Crie a campanha desejada pela interface. Descubra seu ID:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/v1/campaigns
```

Com a API em modo MySQL, importe para essa campanha:

```powershell
npm run campaign:import -- --zip "C:\caminho\Forte Galdrak.zip" --campaign UUID_DA_CAMPANHA
```

Depois abra o **Diário** ou clique em **Atualizar**. Cada arquivo vira uma anotação com o conteúdo integral, o caminho de origem e as referências ausentes. O texto original também é guardado em `payload.originalBody`. Notas vazias são preservadas e sinalizadas. Importar novamente não duplica uma fonte nem sobrescreve alterações; diferenças são informadas como `changed` para revisão manual. Cada lote usa uma transação no MySQL; lotes já concluídos permanecem salvos se um posterior falhar, e a reexecução pula esses arquivos.

O importador não transforma automaticamente todo parágrafo em regra executável, NPC ou habilidade: isso poderia promover uma nota antiga ou incompleta a uma regra vigente. A normalização orientada e a confirmação das fontes são próximas tarefas.

## Verificações

```powershell
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`test:e2e` exige um build pronto e as portas 3000/4000 livres; inicia seus próprios serviços em demonstração. Os cenários validam cadastro, consumo, atualização após recarregar, calculadora, locais e diário em desktop e celular.

`npm test` executa testes de domínio, contrato HTTP e componentes. Os dois testes de MySQL são separados e aparecem como ignorados quando `TEST_MYSQL` não está ativo. No GitHub Actions, são executados com um serviço MySQL real e banco de teste. Para rodar localmente, use um banco **terminado em `_test`** e configure as variáveis `DB_*` para ele:

```powershell
$env:DB_NAME = "escudo_rpg_test"
npm run test:db
```

Crie o banco e conceda acesso ao usuário antes desse comando. O teste aplica migrações nesse banco, verifica JSON após reconectar, concorrência, cascata de vínculos e reimportação. O guardião de nome evita execução acidental no banco pessoal.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `apps/web` | Interface Next.js e componentes |
| `apps/api` | API, validação, repositórios, migrações e seed |
| `packages/rules` | Funções puras de cálculo compartilhadas, sem executar expressões arbitrárias |
| `scripts/import-notes.js` | Importação local do ZIP de Markdown |
| `tests/e2e` | Jornadas do jogador em navegador |
| `docs` | Proposta, decisões, análise das brechas e contrato técnico |
| `.github` | CI e modelos de issues |

## Documentação e próximas etapas

- [Proposta e análise das regras](docs/PROPOSTA.md)
- [Arquitetura e contrato da API](docs/ARQUITETURA.md)
- [Backlog priorizado](docs/BACKLOG.md)
- [Issues do projeto](https://github.com/PedroJoao17/escudo-rpg/issues)
- [GitHub Actions](https://github.com/PedroJoao17/escudo-rpg/actions)

As próximas entregas devem partir das issues, mantendo a `main` e verificações automáticas. **Sem implantação automática nesta fase.**
