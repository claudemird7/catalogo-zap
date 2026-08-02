# Correções realizadas

- Corrigido erro de sintaxe em `database/migracoes.js`.
- Migrações agora preservam planos existentes e criam planos padrão apenas em banco vazio.
- Lojas antigas sem plano/assinatura recebem automaticamente o plano ativo de menor valor.
- Corrigidas consultas do dashboard e cálculo de produtos sem estoque por variação.
- Corrigido HTML dos cartões do dashboard.
- Atalhos do dashboard agora apontam para páginas existentes.
- Removidas rotas e controller de IA ainda incompletos para evitar erro de view inexistente.
- Categorias e IA permanecem marcadas como recursos futuros, sem links quebrados.
- Categorias públicas agora são carregadas dinamicamente do banco.
- Banner, logo, favicon, cores, mensagem e rodapé são aplicados no catálogo.
- Imagens antigas de logo/banner/favicon são apagadas quando substituídas.
- Erros de upload agora aparecem na tela de configurações.
- Corrigido `.gitignore` e removidos bancos temporários, ZIPs, backups e arquivos de atualização.
- Removidas pastas vazias e arquivos sem uso.
- Adicionados limites de corpo das requisições e cabeçalhos básicos de segurança.
- Cookie de sessão usa `secure` automaticamente quando `NODE_ENV=production`.

## Antes de publicar na internet

Ainda é recomendado configurar uma `SESSION_SECRET` forte e adotar armazenamento persistente de sessões, HTTPS, proteção CSRF e limitação de tentativas de login.
