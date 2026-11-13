# Publicação do portfólio na Hostinger

**Estado atual: preparação local.** Este material não cria repositório, não altera DNS e não publica o site. A primeira publicação deve ser revisada e autorizada por Paulo.

**Limitação confirmada nesta sessão:** o hPanel mostra o Premium como “Teste grátis”; as entradas de criação/importação Git conduziram ao Builder/one-pager temporário, sem um painel de hospedagem PHP/HTML acessível. Portanto, a integração descrita abaixo é a arquitetura proposta, condicionada à confirmação de suporte no produto ativo. Não foi contratado outro plano nem publicada uma página temporária. Não compre uma hospedagem para seguir este guia sem antes avaliar essa limitação.

## 1. Estrutura e limites

O novo repositório GitHub deve ter **o conteúdo de `public-site/` como sua raiz**, sem o restante deste projeto. Ele contém somente o portfólio, a página de bio e demonstrações fictícias. Não coloque o Radar/CRM, contatos de prospecção, dados financeiros, arquivos de banco, `.env` ou backups nesse repositório.

| Destino | Conteúdo |
| --- | --- |
| `https://paulovictorrn.tech/` | Homepage e portfólio |
| `https://paulovictorrn.tech/bio/` | Links de bio |
| `https://cafe-demo.paulovictorrn.tech/` | Café Aurora, demonstração fictícia |

```text
GitHub: main (fontes públicas revisadas)
  → GitHub Actions: testes + validação + build estático
  → GitHub: hostinger-deploy (somente arquivos publicáveis)
  → integração Git nativa da Hostinger: public_html/
      ├── index.html
      ├── bio/index.html
      └── demos/cafe-conceito/index.html
          ↑ pasta do subdomínio cafe-demo
```

O plano PHP/HTML serve estes arquivos estáticos. A aplicação de prospecção em Docker/PostgreSQL continua sendo uma implantação separada; este fluxo não a publica.

## 2. Validação local

Use **Node.js 24** e Git. Não há dependências npm nem etapa de instalação.

Execute na raiz do repositório exclusivo do portfólio:

```powershell
node --test scripts/build.test.mjs
node scripts/build.mjs
```

O segundo comando gera `build/` e não envia arquivos. O gerador verifica referências locais de HTML/CSS, imports e sintaxe JavaScript. Em `site-data.js`, os destinos dos cartões precisam ser strings literais revisáveis. URLs com credenciais, protocolos ativos como `javascript:`, caminhos fora da raiz e recursos remotos embutidos são rejeitados. Links externos HTTP(S), telefone e e-mail são permitidos para navegação; sua disponibilidade não é testada pela CI.

Somente extensões estáticas permitidas são copiadas. Documentação, scripts, workflows, dependências e o próprio `build/` ficam fora do resultado. Arquivos privados e links simbólicos interrompem a geração. O gerador substitui exclusivamente sua pasta local `build/`; não apaga nada na hospedagem. O marcador público `deployment-info.json`, acrescentado apenas na publicação, identifica o commit de origem e a branch gerada.

Esses controles reduzem erros de publicação, mas não identificam dados pessoais inseridos dentro de um HTML ou JavaScript permitido. Revise as alterações de conteúdo antes do merge. Não versionar `build/`; manter a regra `build/` no `.gitignore` deste repositório.

## 3. Preparar o GitHub

1. Revise nome, descrição, WhatsApp, e-mail, links, projetos e indicação de demonstração fictícia. Confirme os dados que ficarão públicos.
2. Crie um repositório exclusivo com a estrutura descrita acima e branch principal `main`. Não conecte o repositório do CRM à hospedagem.
3. Nas configurações do GitHub Actions, permita os workflows do repositório. O workflow usa apenas ações oficiais fixadas por SHA; a permissão padrão é de leitura, com escrita somente no job de publicação.
4. Configure o ambiente `hostinger-production`. Restrinja-o à branch `main` e, quando disponível no plano do GitHub, use revisor obrigatório para controlar publicações. Uma regra de proteção de `main` também pode exigir o job `validate` antes do merge.
5. Após autorização para a primeira publicação, execute o workflow `Validate and publish static portfolio` na branch `main`, ou envie um commit revisado a ela. Confirme o sucesso dos jobs e a criação de `hostinger-deploy`.

O workflow valida pull requests sem publicar. Em pushes de `main` ou execução manual nessa branch, ele gera a branch de entrega. O token automático do GitHub é usado pela ação oficial de checkout somente no job que precisa enviar a branch; não há PAT, token manual, chave SSH, senha ou segredo de hospedagem a cadastrar neste projeto.

O script recusa uma branch de entrega preexistente sem seu marcador esperado, recusa retrocessos na história de origem e usa `--force-with-lease` exclusivamente em `hostinger-deploy`. Ele não reescreve `main`. Não utilize `hostinger-deploy` para edições manuais nem a escolha como branch principal. Se houver alteração inesperada, investigue o estado em vez de remover a proteção do script. A concorrência do job mantém uma publicação ativa por vez.

## 4. Conectar a Hostinger por OAuth

Faça estas operações no hPanel somente após revisar o site e autorizar a publicação:

1. Confirme o plano ativo e o acesso efetivo à hospedagem PHP/HTML com integração Git. Se o hPanel continuar encaminhando apenas ao Builder, interrompa a configuração e confirme a disponibilidade do recurso com a Hostinger; não escolha um template nem uma compra para contornar isso. Depois confirme o domínio correto e o conteúdo atualmente servido. Se já existir um site, faça backup e revise o impacto da troca antes de conectar a integração. Não esvazie `public_html` para seguir este guia.
2. Crie ou selecione o website **PHP/HTML** de `paulovictorrn.tech`. Na integração Git/GitHub, conecte sua conta por OAuth e conceda acesso somente ao repositório do portfólio quando essa seleção estiver disponível. Se a tela pedir uma nova autorização, o titular deve revisar e aprovar essa permissão; não compartilhe credenciais no chat.
3. Selecione o repositório exclusivo, a branch **`hostinger-deploy`** e a raiz do repositório como diretório de origem. A raiz dessa branch já contém `index.html`; **não** selecione `build/` ou `public-site/`.
4. Ative a implantação automática da integração e confirme que o destino é o `public_html` do website correto. Não configure instalação npm, servidor Node.js, SSH ou sincronização com exclusão de arquivos.
5. Verifique HTTPS e o redirecionamento correspondente. Antes de alterar DNS, preserve registros de e-mail, verificações e outros subdomínios usados por serviços existentes. Este guia não prescreve substituição dos registros atuais.

A documentação da Hostinger descreve a seleção de repositório/branch/diretório e a atualização automática a cada push para sites PHP/HTML. A disponibilidade e os rótulos exatos no plano contratado devem ser confirmados no hPanel. O recebimento dos pushes gerados por este workflow ainda precisa ser comprovado com a primeira publicação real; um job verde no GitHub, sozinho, não comprova que a Hostinger atualizou o site.

## 5. Criar o subdomínio da demonstração

Na gestão de **subdomínios do website PHP/HTML existente**, crie `cafe-demo` e habilite a opção de **pasta personalizada**. Escolha a pasta cujo caminho final seja:

```text
public_html/demos/cafe-conceito
```

O campo pode mostrar `public_html` como prefixo; nesse caso informe apenas o trecho restante. Confira o caminho final antes de salvar. O subdomínio deve apontar diretamente para o `index.html` da demonstração, sem uma segunda implantação Git e sem apontar para a homepage.

A Hostinger documenta esse recurso no método de criação de subdomínio dentro de um website PHP/HTML existente. Confirme DNS e SSL do novo subdomínio. Para futuras demonstrações, adicione uma pasta própria em `demos/` e associe cada novo subdomínio à sua pasta. Os recursos da demonstração devem usar referências relativas à própria pasta.

## 6. Verificar e manter

Após a primeira publicação, confirme manualmente:

- Homepage e `/bio/` abrem por HTTPS em desktop e celular; os contatos apontam para os destinos revisados.
- `cafe-demo.paulovictorrn.tech` abre a demonstração, seus estilos e interações; dados e pedidos continuam fictícios.
- `deployment-info.json` informa o commit de `main` esperado; scripts de build, documentação e arquivos do CRM não estão presentes na branch de entrega.
- Um novo commit revisado de conteúdo chega à Hostinger pela sequência completa. Confira também a retirada de um arquivo em uma demonstração de teste: o comportamento de limpeza da integração não foi presumido e arquivos antigos podem exigir revisão específica.

Atualizações normais são feitas por commit/PR em `main`. Para voltar ao conteúdo anterior, prefira reverter o commit de origem e passar pela mesma validação; isso preserva a história. Não faça reset forçado da branch de origem ou edições na branch gerada. Caso a hospedagem não reflita o marcador, verifique o histórico de implantação da integração no hPanel antes de repetir configurações.

Os testes automatizados usam apenas diretórios e repositórios Git temporários locais, sem rede: verificam exclusão de privados, bloqueio de links simbólicos, validação de links e JavaScript, limites de evento/branch, preservação de `main`, atualização idempotente da branch gerada e recusa de uma branch alheia. O Windows pode exigir permissão para criar links simbólicos; nesse ambiente o teste específico é marcado como indisponível. No runner Ubuntu ele deve executar normalmente.

## Fontes oficiais

- [Hostinger: implantação de repositório Git](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/).
- [Hostinger: subdomínios e pasta personalizada](https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/).
- [GitHub: uso seguro de workflows e fixação por SHA](https://docs.github.com/en/actions/reference/security/secure-use).
- [GitHub: ambientes de implantação](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments).
- [Ação oficial checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) e [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0).
