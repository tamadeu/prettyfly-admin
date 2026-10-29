# Carrinho e checkout em andamento

A tabela `carts` guarda um rascunho: produtos, quantidades, informações parciais do checkout, versão e datas. Não cria pedidos, não reserva estoque e não calcula frete, descontos ou pagamentos. Os preços e descrições são obtidos do catálogo quando os produtos são salvos; não são aceitos valores enviados pelo navegador. O subtotal é uma referência do rascunho e deverá ser revalidado na futura criação do pedido.

## Identificação e recuperação

O Next.js cria `pf_cart`, um cookie HttpOnly/SameSite=Lax com 32 bytes aleatórios, renovado por 180 dias. Em produção também é Secure. O backend recebe o identificador em `X-Cart-Token` e armazena apenas SHA-256. Não há fingerprint do dispositivo. Visitantes recuperam o carrinho no mesmo navegador enquanto mantiverem o cookie.

Clientes autenticados são identificados pelo mecanismo existente `X-Customer-Token`. Ao recuperar o carrinho com uma conta, o rascunho do visitante é vinculado à conta ou unido ao carrinho existente. Quantidades da mesma variante são somadas até 99; dados do checkout do visitante prevalecem. O identificador de visitante deixa de dar acesso ao carrinho da conta. Logout limpa o estado do site. A conta recupera o carrinho também em outros navegadores.

## API

- `GET /api/v1/cart`: retorna `data` com `id`, `owner`, `version`, `items` e `checkout`. Consultar sem produtos não cria um registro.
- `PUT /api/v1/cart`: exige `owner` e `version` recebidos no GET. Aceita `items` (substituição da lista) e/ou `checkout` (mescla dos campos informados).
- Cada produto enviado precisa de `productId`, `variantId` e `quantity` (1 a 99); limite de 100 variantes por requisição.
- Campos de checkout: `first_name`, `last_name`, `country`, `postal_code`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `phone`, `email`, `notes`.
- Campos incompletos, inclusive e-mail e CEP, são permitidos porque este é um rascunho. Campo vazio apaga o valor anterior.
- Escrita de versão ou sessão desatualizada retorna 409. O site oferece recarregar os dados salvos, evitando sobrescritas silenciosas entre abas.

As rotas exigem o token de integração do catálogo e possuem limite de requisições. O navegador usa `/api/cart` no próprio site; os tokens ficam no servidor e em cookies HttpOnly. O site serializa gravações, salva após 650 ms sem alterações e tenta antecipar o envio ao sair do campo ou ocultar a página. Falhas mostram uma opção de nova tentativa. Os campos pessoais não são persistidos no localStorage.

## CEP e administração

`GET /api/cep/{cep}` no site consulta a API oficial https://viacep.com.br/ com oito dígitos, timeout de 5 segundos e cache de 24 horas. A interface trata CEP inexistente e serviço indisponível, mantém os campos editáveis e descarta consultas antigas. Número e complemento são preenchidos pelo usuário. Só uma mudança no input CEP dispara preenchimento; recarregar a página preserva correções manuais do endereço.

O admin oferece **Carrinhos** em `/carrinhos`, com paginação, produtos, subtotal, dados preenchidos e datas. O acesso usa as mesmas restrições das demais telas administrativas.

## Instalação e verificação

Aplicar a migração `2026_10_29_220000_create_carts_table.php` e compilar os dois projetos. Não há nova variável de ambiente: são usadas `API_URL`, `API_TOKEN` e `CATALOG_API_TOKEN` já existentes.

Testes de regressão: `php artisan test --filter=CartsTest`. Cobrem isolamento de visitantes, recuperação, produtos do catálogo, checkout parcial, limpeza de campos, remoção de produtos, conflitos, união após login, bloqueio de contas e acesso administrativo.
