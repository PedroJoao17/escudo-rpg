# Escudo RPG: orientação de trabalho

- O público prioritário é o jogador, especialmente iniciante. Preserve descrições e fontes; não dependa de conhecimentos de mestre para operar a interface.
- Use a branch `main`. Não crie `development` nem configure deploy automático nesta fase. Organize evolução pelas issues.
- Stack: Next.js/React no frontend; Node.js JavaScript ESM no backend; MySQL e Sequelize. Não trocar ORM nem banco sem solicitação.
- Leia `docs/PROPOSTA.md` e `docs/ARQUITETURA.md` antes de mudar comportamento de regras.
- Não fundir D&D 2014, 2024 e regras caseiras silenciosamente. Dúvidas de fonte/ação/custo/duração devem permanecer explícitas.
- Não publicar PDFs, ZIPs, campanhas privadas, credenciais nem a transcrição integral dos livros. Exemplos do repositório devem ser fictícios.
- Nenhum `eval`, `sequelize.sync({ force: true })` ou migração destrutiva de dados pessoais. Mude schema por migração versionada.
- Sem fallback automático de MySQL para memória. Demonstração precisa ser explícita e marcada na interface.
- Edições existentes precisam de revisão; não remover a proteção de concorrência para fazer um teste passar.
- Antes de publicar código: `npm run lint`, `npm test`, `npm run build`. Verifique `npm run test:db` quando houver MySQL de teste e `npm run test:e2e` quando houver Chromium. Não declare como executado um teste apenas configurado.
- Escreva commits descritivos em português, com pontos sobre comportamento e validação quando a mudança for ampla.
