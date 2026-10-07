# Proposta do Escudo RPG

## Problema e público

Um jogador iniciante precisa consultar a ficha, descobrir o que pode fazer, acompanhar consumíveis e lembrar informações narrativas durante a sessão. A ficha resumida não comporta todas as explicações; anotações espalhadas entre PDF, chat, Obsidian e outras ferramentas aumentam o trabalho de procurar e a chance de esquecer.

O produto reúne **as informações que o jogador conhece** e as relaciona. Não precisa simular toda a campanha. A operação central é registrar, recuperar e contextualizar informações rapidamente. Regras e consequências do mundo continuam dependendo da mesa e do mestre.

## Organização de telas

| Conjunto | Esquerda | Centro | Direita |
| --- | --- | --- | --- |
| Escudo do personagem | Habilidades, técnicas, magias e passivas | Ficha expandida | Inventário e equipamento |
| Escudo da campanha | NPCs e vínculos | Mecânicas e serviços conhecidos | Locais e pontos de interesse |

No desktop largo, três painéis ficam visíveis. Em telas menores, uma aba fica em foco por vez. O jogador também pode escolher uma tela única no desktop. O centro da ficha recebe prioridade visual no primeiro conjunto.

A matemática é um **serviço transversal** e também tem uma tela própria: as seis telas citadas compõem os dois escudos; a calculadora é uma sétima área. O diário de sessão é uma oitava área de registro, porque uma informação narrativa nova pode ainda não ter um NPC, item ou mecânica correspondente. Forçá-la a um desses cadastros durante o jogo criaria atrito.

## Fluxo em mesa

1. Antes da sessão, abrir campanha e personagem, conferir dados atuais e consultar pendências.
2. Durante a sessão, alternar os painéis; consultar a descrição completa de uma habilidade, ajustar PV ou quantidade de item e calcular um teste.
3. Registrar uma anotação rápida com dia fictício, data real, origem e confiança na informação.
4. Vincular uma mecânica a um local e a um NPC conhecido; navegar pelos vínculos para reencontrar a informação.
5. Após a sessão, revisar rumores, resolver conflitos de versão e organizar as notas em cartões estruturados.

A organização completa não deve ser obrigatória no instante em que o mestre fala. A captura rápida vem antes da classificação detalhada.

## Princípios do domínio

- Campanha identifica um caderno pessoal. Ter a mesma campanha em dois computadores não implica estado compartilhado nesta versão.
- Uma campanha admite mais de um personagem, mas a interface mantém um personagem ativo por vez.
- Habilidades, itens e companheiros podem ser ligados ao personagem; NPCs, locais e mecânicas são registros da campanha conhecida.
- Nível suficiente não significa automaticamente habilidade aprendida: escolhas, pré-requisitos e decisões da mesa importam.
- Uma descrição deve manter fonte e indicação de confirmação. Uma suspeita do jogador não vira fato do mundo.
- Dados base da ficha são diferentes de bônus temporários. O total calculado deve mostrar quais fontes foram incluídas.
- Equipado, possuído e consumível são conceitos distintos. Ferramentas reutilizáveis não devem desaparecer ao usar uma mecânica.
- Recursos pessoais e estoques do forte são diferentes; o jogador não é dono automático dos suprimentos de uma região.
- NPC responsável por um serviço, NPC aliado controlável e companheiro animal são papéis distintos, mesmo quando se relacionam.
- Dia da campanha, data da sessão, turno de combate e descanso são relógios separados.
- Ações que alteram dois recursos exigirão transação e evento auditável quando forem implementadas. Consultar uma mecânica não deve executar o atendimento.
- O produto deve preservar descrições completas e permitir seções adicionais, mantendo limites técnicos de tamanho por requisição.

## Evidências dos anexos e brechas encontradas

Análise realizada em 07/10/2026. As referências privadas foram `ficha joao.pdf`, `Guia do Jogador.pdf`, `Guia do jogador 2.pdf` e o conjunto de notas `Forte Galdrak.zip`. O repositório não inclui seus bytes nem reproduz os livros. A ficha foi conferida visualmente porque suas três páginas não tinham texto útil extraível.

| Evidência | Brecha | Decisão inicial / pergunta para validação |
| --- | --- | --- |
| A ficha registra nível 1; o índice das notas registra nível 2 | Versões diferentes do mesmo personagem | Cadastrar a ficha conscientemente; confirmar PV máximo e progressão atuais, sem subir o nível silenciosamente |
| O primeiro guia corresponde à versão de 2014; o segundo identifica a revisão de 2024 | As edições não podem ser fundidas automaticamente | Guardar perfil da mesa e origem das exceções; homebrew como referência inicial flexível |
| Classe consolidada move técnicas e Ímpeto para nível 3; nota de técnicas ainda indica nível 2 | O catálogo antigo conflita com o rework | Usar a revisão confirmada pelo mestre para liberação; manter a versão divergente como pendência |
| Uma habilidade tem duração de 1 minuto na classe consolidada e de 3 turnos na nota de técnicas | Duração em relógios distintos | Confirmar duração vigente antes de criar contagem automática |
| Técnicas descritas como ação; outra técnica é explicitamente reação | Uma regra geral conflita com uma exceção | Registrar tipo de ação por habilidade e validar a exceção; não cobrar ação e reação simultaneamente por inferência |
| A troca de estilo permite técnica gratuita após dois ataques, mas a nota também exige ação para técnicas | Custo zero de recurso não esclarece disponibilidade de ação | Perguntar se a troca concede ação adicional, converte a técnica em ação livre ou apenas remove custo de Ímpeto |
| Kits reutilizáveis reduzem tratamentos a zero, mas o texto exige cargas ainda disponíveis | Possível quantidade de atendimentos sem consumir tempo/cargas | Confirmar requisito mínimo, limite de atendimentos e momento da verificação; não automatizar o loop |
| Bandagem, kit e sucesso em Medicina podem combinar descontos | Desconto poderia gerar custo negativo | Custo mínimo zero é uma sugestão; confirmar cumulação e limite de bandagens por atendimento |
| Limites de Medicina são por jogador, paciente e grupo no mesmo dia | Um caderno local não conhece ações dos outros jogadores | Mostrar o limite de grupo como informação manual até existir estado compartilhado autorizado |
| Reparos têm limite diário e falhas podem ser tentadas novamente | Não está claro se falha consome uma das oportunidades | Confirmar se o limite é de tentativas ou reparos concluídos; registrar tentativa e resultado separadamente |
| Especialistas e pedreiro participam de grandes reparos | Um serviço pode usar o trabalho diário de mais de um NPC | Confirmar custo de oportunidade de todos os participantes e não reservar um profissional duas vezes |
| NPCs têm limite de acompanhamento, empréstimo e ordem de turno | Desbloqueio de confiança não é seleção para uma missão | Modelar confiança, seleção, empréstimo e situação como estados distintos na próxima etapa |
| Nomes e títulos de responsáveis variam entre arquivos | Identidades podem parecer iguais sem comprovação | Permitir outros nomes conhecidos e registrar a dúvida; não fundir NPCs automaticamente |
| Relatórios de feridos e combatentes aptos reutilizam alguns nomes; 29 feridos são citados para 15 leitos | Totais e ocupação podem representar conceitos diferentes ou informação desatualizada | Guardar data/estado da observação; não deduzir capacidade ocupada nem somar listas como grupos exclusivos |
| O índice aponta notas de apoio, rework isolado, sessões e um canvas ausentes do ZIP | Os links não comprovam que as informações existem | Importador sinaliza os destinos ausentes; não inventa conteúdo |
| Dez dos trinta arquivos Markdown estão vazios | Arquivo existente não equivale a um NPC descrito | Preservar como pendência e permitir completar depois |
| A ficha traz um companheiro com nome; nota de apoio ainda pede definir o nome | Nota de apoio pode estar desatualizada | Confirmar nome e regras de comando/montaria na ficha atual |

Essas perguntas são **tarefas de confirmação**, não impedimentos para iniciar cadastro e consulta. A primeira versão registra o que existe; ações automatizadas que dependem das respostas ficam no backlog.

## Matemática: escopo inicial e expansão

A calculadora inicial implementa o cálculo comum de d20 usado como referência de D&D: modificador de atributo, proficiência opcional, especialização e bônus identificados. Vantagem e desvantagem se cancelam; a proficiência não é acumulada automaticamente duas vezes. Um 1 ou 20 natural não vira sucesso/falha automática em qualquer perícia; o tratamento automático inicial existe apenas para ataque.

Dados digitais são gerados na API com `crypto.randomInt`. O jogador também pode informar seus dados físicos. A opção de repetir um 1 vale uma única vez por dado digital e aceita o resultado da repetição. Ela depende de confirmação da regra que permite esse comportamento; não é aplicada por reconhecer a raça no cadastro.

O dano usa um parser restrito de soma/subtração de dados e inteiros. Não há `eval`. O crítico duplica os dados da expressão escolhida e não os bônus fixos. Não há inferência de que todo dado mencionado em uma habilidade participa de um crítico.

O próximo passo é um **registro de modificadores**: alvo (ataque, dano, CA, movimento, perícia), fonte, condição de ativação, duração, grupo de acúmulo e decisão da mesa. O jogador deve poder selecionar os efeitos e conferir o total antes de aplicar. Ataques, consumos e habilidades precisam de ações separadas de simulação e execução.

O sistema atual aceita descrições livres, mas os cálculos não são universais para todos os RPGs. Suporte a outros sistemas dependerá de adaptadores explícitos, sem reutilizar fórmulas de D&D automaticamente.

## Recorte do MVP

### Base entregue

Cadastro e edição de campanha/primeiro personagem, ficha expandida, habilidades ordenadas, inventário com quantidades, NPCs, mecânicas, locais esquemáticos, vínculos, diário, cálculo manual/digital, exportação e importação de notas. Persistência local MySQL, revisão para concorrência e testes em camadas.

### MVP de uso contínuo

Normalização assistida das notas, revisão das fontes, recursos editáveis/criáveis, moedas e equipamentos, histórico de ações com desfazer, sessões e dias, regras de disponibilidade de habilidades, seleção de companheiros/NPCs, busca global e restauração de backup.

### Posterior

Mapas reais com imagem e pontos arrastáveis, PWA/offline com reconciliação, autenticação e separação por usuário, compartilhamento voluntário e implantação. Funcionalidades de mestre não são necessárias para validar o objetivo do projeto.

## Critério de sucesso do produto

Durante uma sessão, o jogador consegue reencontrar rapidamente uma habilidade, saber seu custo e condição, localizar um item, reconhecer uma pendência de regra e navegar entre um serviço, seu local e seu NPC. Ao registrar uma informação nova, não precisa decidir imediatamente toda a classificação. Ao voltar na próxima sessão, seus dados persistentes continuam disponíveis e a origem permanece consultável.
