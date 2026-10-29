# Cotação de frete com SuperFrete

## Configuração

No admin, acesse **Configurações → Frete** (`/configuracoes/frete`):

1. Confira o CEP de origem, inicialmente **05083-010**.
2. Selecione Sandbox para teste ou Produção para preços reais.
3. Informe o e-mail de contato técnico e o token do ambiente correspondente, gerado em Integrações → Desenvolvedores no SuperFrete.
4. Escolha os serviços que deseja oferecer (PAC e SEDEX vêm selecionados) e ative o cálculo.

A integração começa desativada e sem credenciais. Token vazio ao editar mantém o existente. Para trocar de ambiente, informe o token do novo ambiente. O token é criptografado com a chave Laravel, não retorna ao navegador e é ocultado de logs do Telescope e do preenchimento antigo da sessão após falhas de validação. Não há nova variável de ambiente.

As variantes devem ter peso em **kg** e altura, largura e comprimento em **cm**, todos maiores que zero. Não são inventadas medidas quando o cadastro está incompleto.

## Frete grátis

Em **Configurações → Frete**, ative **Oferecer frete grátis** e informe o **valor mínimo em produtos (R$)**. A regra começa desativada; não há um valor mínimo predefinido. O valor 0 permite oferecer o benefício sem mínimo.

A regra vale para todo o Brasil, na opção mais barata disponível entre os serviços habilitados. Ao atingir ou superar o mínimo, apenas essa opção passa a custar zero para o cliente; as outras mantêm seus preços. A loja assume o custo do envio. O SuperFrete continua necessário para verificar cobertura, prazo e volumes, e nenhuma opção é criada quando não há serviço disponível.

O mínimo considera os preços atuais do catálogo e as quantidades, em centavos, sem somar o frete. O custo original do provedor fica salvo em `carrier_price` para uso interno; `price` representa o valor cobrado do cliente. A resposta pública não expõe o custo interno. A escolha grátis é salva e exibida como **Grátis** no checkout e no admin.

O carrinho, o minicarrinho e o checkout mostram quanto falta para atingir o mínimo. Alterações na regra ou nos produtos invalidam a cotação e a seleção anteriores. Desativar a integração também remove a oferta pública. A política chega ao site em `free_shipping_policy` nas respostas do carrinho, sem credenciais. A migration `2026_10_29_235000_add_free_shipping_to_shipping_settings.php` adiciona os campos sem alterar as credenciais existentes.

## Funcionamento

O checkout consulta automaticamente após o CEP e os produtos serem salvos. O backend envia `products`, permitindo ao SuperFrete calcular os volumes. A consulta usa o valor do catálogo como valor declarado, com seguro habilitado, sem mão própria nem aviso de recebimento.

O cliente vê preço e prazo em dias úteis após a postagem; o modo Sandbox é identificado na tela. A seleção fica no carrinho e aparece no modal do admin. A integração não compra fretes, não emite etiquetas e não cria pedidos ou pagamentos.

Cotações têm validade local de 10 minutos. CEP, produtos/quantidades, preços, medidas e configurações integram a identificação da cotação. Mudanças nesses dados invalidam a seleção. O navegador oculta imediatamente o frete anterior quando o CEP ou o carrinho muda. O servidor verifica novamente ao selecionar. Alterações apenas de nome, telefone ou observações preservam a escolha.

A API externa é consultada fora da transação do carrinho. A resposta só é aplicada se a versão e os dados continuarem válidos. Preço e prazo não são aceitos do navegador. Os volumes retornados ficam armazenados para a futura emissão de etiquetas, que deve revalidar a cotação.

## Rotas

- `POST /api/v1/cart/shipping`: corpo com `owner` e `version` do carrinho; retorna o carrinho com `shipping`.
- `POST /api/v1/cart/shipping/select`: acrescenta `quote_id` e `service_id`.
- As rotas exigem a autenticação do catálogo e os mesmos identificadores do carrinho. No Next.js são expostas em `/api/cart/shipping` e `/api/cart/shipping/select`.
- `GET/PUT /api/v1/cart` também retorna `shipping` quando a cotação ainda é válida.

Timeout externo de 10 segundos, cache de até 10 minutos e limite de chamadas. Erros do provedor são tratados sem expor credenciais ou respostas internas. Serviços indisponíveis e serviços não selecionados nas configurações são filtrados. A Loggi depende também das configurações do token na própria SuperFrete.

## Verificação

`php artisan test --filter=ShippingTest` verifica requisição, origem, dados do catálogo, seleção, persistência, invalidação, expiração, isolamento, conflitos, respostas inválidas e proteção do token. As respostas externas são simuladas; a validação real exige credenciais.

Documentação oficial: https://superfrete.readme.io/reference/primeiros-passos e https://superfrete.readme.io/reference/cotacao-de-frete.
