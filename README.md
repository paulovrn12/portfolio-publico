# Portfólio público — conteúdo para revisão

Site estático sem dependências, fontes externas, rastreadores, formulários ou chamadas de API. A página principal fica em `/` e a página curta de links em `/bio/`.

## Dados profissionais

Os dados estão centralizados em `site-data.js`. A apresentação usa informações declaradas no [README público do GitHub](https://github.com/paulovrn12/paulovrn12/blob/main/README.md), consultado em 13/11/2026. E-mail profissional, WhatsApp e Instagram foram explicitamente autorizados pelo operador nesta conversa. Não há renda, vínculo familiar, credenciais, detalhes de repositórios privados, métricas inventadas ou alegações de clientes atendidos.

O cartão GitHub identifica um perfil público, não uma aplicação pública. Ritmo e Renditro são aplicações próprias cujos endereços públicos foram verificados pelo agente principal em 13/11/2026. Os links não expõem seus repositórios privados. Novos projetos só devem entrar com link verificável e informações aprovadas para divulgação. O CTA principal abre conversa pelo WhatsApp; nenhum texto é enviado automaticamente.

## Demonstração

`demos/cafe-conceito/` contém somente os quatro arquivos públicos da demonstração Café Aurora: `index.html`, `style.css`, `app.js`, `coffee-hero.svg`. Esse conceito usa uma cafeteria fictícia e simulações no navegador; não há pedidos ou pagamentos reais.

Em localhost, o cartão utiliza `/demos/cafe-conceito/`. Fora de localhost, o endereço proposto é `https://cafe-demo.paulovictorrn.tech`; isso **não comprova que o subdomínio já foi publicado**. Revisar a URL final em `site-data.js` antes de publicar.

## Separação do Radar

Este diretório deve conter somente conteúdo público. Não copiar arquivos de ambiente, dados de contatos, banco, backups, configuração pessoal ou código privado do CRM para ele. O workflow em `.github/workflows/` e os scripts geram uma branch estática exclusiva; consulte [publicação e limites atuais](docs/DEPLOYMENT.md). A integração real ainda não foi ativada.

Arquivos do site: `index.html`, `bio/index.html`, `styles.css`, `site.js`, `site-data.js`, e os recursos da demonstração. Os links sociais são navegação, não coleta de credenciais.
