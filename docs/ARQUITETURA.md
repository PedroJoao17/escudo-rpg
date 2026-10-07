# Arquitetura e contrato inicial

## Componentes

O frontend Next.js acessa `/api/v1` na mesma origem. Um rewrite encaminha para a API Node.js. A API valida com Zod, calcula com funções puras e persiste por um repositório Sequelize. MySQL guarda o caderno; Next.js não conecta diretamente ao banco.

`API_URL` é uma variável do servidor Next.js. Como rewrites fazem parte do build, execute novo build se o destino mudar no modo `start`. O modo `dev` lê a configuração ao iniciar. API e frontend usam loopback nesta versão.

O repositório de memória só existe para demonstração explícita e testes do contrato. A aplicação não migra silenciosamente para ele quando MySQL falha. `/health` indica processo e modo; `/ready` verifica conectividade com o armazenamento configurado. A API encerra se não conseguir conectar ao iniciar em modo MySQL. Migrações são executadas pelo comando dedicado, sem `sync({ alter: true })` ou `sync({ force: true })`.

## Modelo inicial

| Tabela | Dados e relações |
| --- | --- |
| `campaigns` | Nome, descrição, perfil de regras e dia conhecido da campanha |
| `characters` | Campanha, ficha base, atributos, detalhes livres, recursos e revisão |
| `entries` | Campanha, personagem opcional, tipo, título, descrição completa, confiança, origem, payload e revisão |
| `entry_links` | Campanha, registro de origem, destino e tipo da relação |
| `SequelizeMeta` | Migrações já aplicadas |

O modelo de cartões mantém colunas comuns relacionais e atributos variáveis em JSON. A API valida campos estruturados de itens, habilidades, notas e locais antes de salvar. Não é um armazenamento de tabelas SQL arbitrárias. Relações ficam em tabela própria, com chaves estrangeiras e unicidade. Vínculos entre campanhas são recusados. Exclusão de cartão remove vínculos por cascata no MySQL.

`sourceKey` identifica o caminho importado e tem unicidade por campanha; `payload.originalBody` preserva a fonte da nota. Essa versão não promove automaticamente notas importadas a cartões executáveis.

O caderno é local e pessoal: ainda não há entidade de usuário nem permissão de campanha. Essa identidade terá de existir antes da disponibilização para vários jogadores. Não há sincronização entre cadernos independentes.

## Endpoints

Prefixo dos endpoints de domínio: `/api/v1`.

| Método e rota | Uso |
| --- | --- |
| `GET /health` | Processo disponível e modo `demo` / `mysql` |
| `GET /ready` | Testar armazenamento configurado |
| `GET /campaigns` | Listar cadernos e informar modo |
| `POST /campaigns` | Criar caderno |
| `GET /campaigns/:campaignId/screen` | Campanha, personagens, cartões e vínculos |
| `GET /campaigns/:campaignId/export` | Snapshot completo com `schemaVersion: 1` |
| `POST /campaigns/:campaignId/characters` | Cadastrar personagem |
| `PATCH /campaigns/:campaignId/characters/:id` | Editar ficha; exige `expectedRevision` |
| `POST /campaigns/:campaignId/characters/:id/hp` | Aplicar `delta` de PV com revisão |
| `POST /campaigns/:campaignId/entries` | Criar cartão |
| `PATCH /campaigns/:campaignId/entries/:id` | Editar cartão com revisão |
| `POST /campaigns/:campaignId/entries/:id/quantity` | Consumir/repor item com revisão |
| `DELETE /campaigns/:campaignId/entries/:id?revision=N` | Excluir cartão e vínculos |
| `POST /campaigns/:campaignId/links` | Relacionar dois cartões da mesma campanha |
| `POST /campaigns/:campaignId/import-notes` | Importar lote de notas, preservando fontes já existentes |
| `POST /calculations/check` | Simular teste físico/digital e retornar detalhamento |
| `POST /calculations/dice` | Rolar expressão validada, com crítico opcional |

Os valores de `kind` são `ability`, `item`, `npc`, `location`, `mechanic`, `note`, `companion`. Confiança aceita `confirmed`, `rumor`, `needs-review`. Relações aceitam `located-at`, `responsible-for`, `uses`, `mentions`. Habilidades/itens sem `characterId` podem representar referências não atribuídas; a interface atribui os cadastros pessoais ao personagem ativo.

Exemplo de item:

```json
{
  "kind": "item",
  "characterId": "22222222-2222-4222-8222-222222222222",
  "title": "Flechas",
  "body": "Munição na aljava.",
  "knowledge": "confirmed",
  "source": "Anotação da sessão",
  "payload": { "quantity": 12, "weight": 0.05, "equipped": false, "container": "Aljava" }
}
```

Exemplo de consumo:

```json
{ "delta": -1, "expectedRevision": 0 }
```

Exemplo de teste:

```json
{
  "score": 17,
  "level": 2,
  "proficiency": "proficient",
  "rolls": [12],
  "kind": "check",
  "difficulty": 15,
  "bonuses": [{ "label": "Ferramenta confirmada", "value": 1 }]
}
```

O resultado desse exemplo é 18 = 12 + 3 + 2 + 1. Omitir `rolls` pede uma rolagem digital. Com vantagem/desvantagem exclusivas, dados físicos devem conter dois resultados. Ao fornecer ambos os efeitos, eles se cancelam e o contrato exige um resultado.

## Consistência e erros

- Quantidade e PV não ficam negativos. Cura não ultrapassa PV máximo; dano absorve PV temporário antes de reduzir PV normal.
- Toda alteração de ficha/item/cartão recebe revisão atual e incrementa a revisão ao salvar. O `UPDATE ... WHERE revision = N` permite apenas uma gravação concorrente baseada nessa versão.
- Revisão desatualizada retorna **409** e não sobrescreve dados. A interface informa que é necessário atualizar antes de tentar novamente.
- Dados inválidos retornam **422**, ausência de registro no caderno retorna **404**, falha de banco retorna **503**.
- O corpo JSON tem limite de **1 MB**. Notas são limitadas a 100.000 caracteres por descrição; importador envia lotes pequenos. Arquivos ZIP são lidos em memória com limites e sem extrair caminhos no disco.
- Expressões de dados têm limite de 100 caracteres, até 100 dados e lados conhecidos. O parser não executa código.
- A importação é idempotente por caminho e campanha. Uma fonte alterada não é substituída automaticamente; revisão semântica de fontes ainda está no backlog.
- A revisão técnica serve à concorrência. Ela não é, por si só, um histórico de versões de regras ou sessões.

## Testes e evolução

Vitest verifica matemática, contrato HTTP e formulários. Supertest verifica validação, alterações concorrentes, isolamento de campanha, importação e exclusões. Os testes persistentes utilizam o próprio Sequelize/MySQL e reconectam para comprovar gravação. Playwright percorre o produto através do rewrite e da API, em dois tamanhos de tela.

O workflow da `main` executa lint, testes, integração MySQL, build e testes em navegador. Deploy não é parte do workflow. Mudanças em cálculos devem ter cenários observáveis; não basta copiar a implementação no teste. Ações que cobram recursos e aplicam efeitos exigirão um serviço transacional e histórico com possibilidade de desfazer, em uma próxima migração.
