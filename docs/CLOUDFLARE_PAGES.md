# Publicação com GitHub Actions e Cloudflare Pages

## 1. Decisão e estado

**Destino aprovado: Cloudflare Pages.** A Hostinger permanece como registradora do domínio e provedora de e-mail. O acesso oferecido pelo plano de teste da Hostinger conduziu ao Builder/one-pager inclusive na opção de upload, sem hospedagem estática utilizável identificada nesta sessão.

O repositório público é [paulovrn12/portfolio-publico](https://github.com/paulovrn12/portfolio-publico). Seu workflow já produz a branch estática `hostinger-deploy`. **Esse nome é legado e será mantido**, embora agora a Cloudflare consuma os arquivos: renomeá-la interromperia a configuração existente sem melhorar a entrega.

```text
main → GitHub Actions (valida e gera arquivos públicos)
     → hostinger-deploy
         ├── Pages: homepage e /bio/
         └── Pages: demonstração Café Aurora
```

Os dois projetos já foram publicados, com HTML e recursos conferidos por HTTPS:

| Projeto Pages | Endereço temporário |
| --- | --- |
| `paulovictorrn-portfolio` | [Portfólio e bio](https://paulovictorrn-portfolio.pages.dev/) |
| `paulovictorrn-cafe-demo` | [Café Aurora](https://paulovictorrn-cafe-demo.pages.dev/) |

Os controles foram conferidos nos dois projetos: produção automática em `hostinger-deploy` e previews `None`. A delegação DNS foi salva na registradora em 13/11/2026 e ainda aguarda reconhecimento para associar os domínios personalizados. Não trate esses domínios como publicados até verificar certificado e conteúdo. Este guia não inclui IDs de conta, credenciais ou cópias de backups.

## 2. Criar dois projetos Pages no mesmo repositório

Use a integração GitHub do **Cloudflare Pages**, autorizando somente o repositório do portfólio quando a seleção estiver disponível. Não crie um projeto Direct Upload: as atualizações devem acompanhar a branch gerada pelo GitHub Actions.

| Configuração | Projeto do portfólio | Projeto da demonstração |
| --- | --- | --- |
| Repositório | `paulovrn12/portfolio-publico` | O mesmo |
| Production branch | `hostinger-deploy` | `hostinger-deploy` |
| Framework preset | `None` | `None` |
| Build command | `exit 0` | `exit 0` |
| Root directory | Vazio: raiz do repositório | `demos/cafe-conceito` |
| Build output directory | `.` | `.` |
| Automatic production deployments | Ativado | Ativado |
| Preview branch deployments | `None` | `None` |
| Domínio personalizado pretendido | `paulovictorrn.tech` | `cafe-demo.paulovictorrn.tech` |

A branch de entrega já contém os arquivos finais. Não escolher `main`, `build/` ou `public-site/` como origem. Não executar npm, scripts do repositório ou uma segunda compilação na Cloudflare. No projeto da demonstração, `.` significa a pasta configurada em Root directory; ela contém o `index.html` e os três recursos locais do Café Aurora. Essa configuração segue os campos documentados de [build](https://developers.cloudflare.com/pages/configuration/build-configuration/) e [controle de branches](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

Após criar cada projeto, confirme que a produção acompanha `hostinger-deploy`, salve os controles de produção/preview e teste a URL `pages.dev` atribuída pelo painel. No portfólio, testar `/` e `/bio/`; na demonstração, testar estilos, imagem, filtros e sacola simulada. Sem dados, pedidos ou pagamentos reais.

## 3. Preparar o DNS preservando o e-mail

Para o domínio raiz em Pages, a Cloudflare exige uma zona do domínio na mesma conta do projeto e a delegação dos nameservers à Cloudflare. O registro do domínio pode continuar na Hostinger. Um subdomínio isolado permitiria DNS externo, mas aqui a homepage na raiz exige essa delegação. Veja [domínios personalizados](https://developers.cloudflare.com/pages/configuration/custom-domains/).

Adicione `paulovictorrn.tech` como zona na mesma conta Cloudflare dos projetos Pages e importe/recrie os registros existentes. **Ainda não altere os nameservers.** Antes da troca:

1. Compare a nova zona com o inventário privado dos **10 registros anteriores**, já salvo pelo operador fora do repositório público. A varredura automática da Cloudflare pode não encontrar tudo; não use a contagem como substituto da comparação de tipos, nomes, valores, prioridades e TTLs.
2. Preserve **MX, SPF, DKIM e DMARC**, além de verificações e demais serviços existentes. Não crie um segundo SPF no mesmo nome. Hostinger continuará recebendo/enviando o e-mail com os mesmos valores.
3. Para registros A/AAAA/CNAME usados exclusivamente por e-mail, como `mail`, mantenha **DNS only**, sem proxy laranja. MX e TXT não são registros de proxy. Preserve os CNAME de DKIM e outros nomes fornecidos pela Hostinger. Não habilite um serviço de redirecionamento de e-mail diferente durante esta mudança.
4. Verifique **DNSSEC e o registro DS no registrador** antes de alterar os nameservers. Se houver uma cadeia ativa do provedor antigo, siga o procedimento de desativação/remoção do DS antigo e confirme a transição antes da delegação; um DS incompatível com os novos servidores causa falha de validação do domínio. Após a zona Cloudflare ficar ativa, reative DNSSEC com o DS novo fornecido por ela, conferindo-o na Hostinger. Não copie o DS antigo para a nova configuração.
5. Preserve os registros **CAA** existentes e confira se autorizam as autoridades certificadoras utilizadas pela Cloudflare. Se houver bloqueio de emissão, ajuste a autorização necessária com base na documentação atual; não remova todos os CAA para contornar o erro.

Esses cuidados seguem o [procedimento de zona completa](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) e a documentação de [CAA](https://developers.cloudflare.com/ssl/edge-certificates/caa-records/). A troca deve usar exatamente os nameservers atribuídos à zona pelo painel; não publique nem reutilize valores ilustrativos.

## 4. Associar os domínios e concluir a delegação

1. Nos dois projetos Pages, abra **Custom domains** e associe o domínio correspondente da tabela. Registre os nomes reais dos projetos e as URLs `pages.dev` mostradas pelo painel nos controles operacionais do projeto.
2. Revise os registros propostos para a homepage e `cafe-demo`. Resolva conflitos somente nesses nomes após comparar o estado anterior; preserve e-mail e serviços independentes. Não basta criar um CNAME manualmente: o domínio precisa estar associado ao projeto Pages correto.
3. Após a revisão da zona e do DNSSEC, substitua na Hostinger apenas os nameservers autoritativos pelos atribuídos à zona Cloudflare. Não transfira o registro do domínio nem altere a assinatura de e-mail para realizar essa delegação.
4. Aguarde a zona ficar ativa e os domínios Pages exibirem situação ativa com certificado válido. Durante a propagação, resolvedores podem mostrar o estado anterior. Não considere a troca concluída apenas por ter salvo os nameservers.

## 5. Validação após publicar

- Abrir `https://paulovictorrn.tech/`, `/bio/` e `https://cafe-demo.paulovictorrn.tech/` em desktop e celular; confirmar HTTPS, links profissionais e recursos da demonstração.
- Conferir `deployment-info.json` na raiz da homepage: o commit de origem precisa corresponder à versão revisada de `main`. Na demonstração, esse marcador não é publicado porque está fora da pasta selecionada.
- Confirmar na Cloudflare que os dois deployments usaram `hostinger-deploy`; nenhum preview deve ser criado a partir de `main` ou de outras branches.
- Conferir DNS de MX, SPF, DKIM e DMARC. O titular pode testar envio e recebimento na conta existente; não enviar mensagens automaticamente em nome dele.
- Fazer a próxima alteração revisada em `main` e comprovar a sequência Actions → branch gerada → ambos os projetos Pages. Um job verde no GitHub sozinho não comprova atualização dos domínios finais.

O Radar, seu banco PostgreSQL, contatos de prospecção e configurações locais continuam fora deste repositório e desta hospedagem. Alterações futuras seguem o workflow já existente; não editar manualmente `hostinger-deploy` e não cadastrar segredos Cloudflare no GitHub para esta integração.
