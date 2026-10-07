# Backlog priorizado

Use as issues do GitHub como registro de execução. Este documento mantém a sequência e o recorte do produto. A base local de cadastro, consulta, cálculo e persistência foi implementada; os itens abaixo são as próximas entregas, sem assumir que já estão prontos.

| Ordem | Prioridade | Entrega | Resultado para o jogador |
| --- | --- | --- | --- |
| [#1](https://github.com/PedroJoao17/escudo-rpg/issues/1) | P0 | Confirmar fontes e resolver divergências de regras | Saber qual versão é válida para a ficha e cada habilidade |
| [#2](https://github.com/PedroJoao17/escudo-rpg/issues/2) | P1 | Normalizar importações e organizar fontes | Converter notas em cartões sem perder o texto original ou inventar informações |
| [#3](https://github.com/PedroJoao17/escudo-rpg/issues/3) | P1 | Sessões, dias, recursos e histórico de ações | Acompanhar usos, recuperações e mudanças com possibilidade de desfazer |
| [#4](https://github.com/PedroJoao17/escudo-rpg/issues/4) | P1 | Disponibilidade de habilidades e modificadores | Conferir nível, aprendizado, condições, ação necessária e cálculo contextual |
| [#5](https://github.com/PedroJoao17/escudo-rpg/issues/5) | P1 | Inventário completo e equipamentos | Controlar moedas, recipientes, cargas, aquisição, descarte e efeitos confirmados |
| [#6](https://github.com/PedroJoao17/escudo-rpg/issues/6) | P1 | Confiança, NPC de missão e companheiros | Distinguir aliados conhecidos, desbloqueados, selecionados e emprestados |
| [#7](https://github.com/PedroJoao17/escudo-rpg/issues/7) | P2 | Enfermaria e reparos como operações confirmadas | Planejar custos e registrar tentativas respeitando regras aprovadas |
| [#8](https://github.com/PedroJoao17/escudo-rpg/issues/8) | P2 | Busca global, diário rápido e mapa real | Reencontrar pistas e serviços e posicionar locais em uma imagem do jogador |
| [#9](https://github.com/PedroJoao17/escudo-rpg/issues/9) | P2 | Restauração de backup e uso offline | Voltar a um caderno salvo e continuar uma sessão com conexão instável |
| [#10](https://github.com/PedroJoao17/escudo-rpg/issues/10) | P2 | Identidade de usuário e preparação para publicação | Separar cadernos de jogadores antes de disponibilizar o projeto online |

## Critérios comuns

- Nenhuma entrega exige telas ou responsabilidades de mestre para funcionar.
- Toda regra automatizada precisa de fonte, escopo, condição, relógio e decisão sobre conflitos.
- Decisões globais do grupo não são inferidas a partir de um único caderno pessoal.
- Um cálculo pode ser simulado sem cobrar recursos; execução explícita deve ser transacional e rastreável.
- Testes de regressão cobrem alterações de regras e persistência. O mobile participa da validação da interface.
- A `main` continua sendo a única branch permanente. CI é obrigatório para concluir entregas; implantação permanece fora desta fase.
