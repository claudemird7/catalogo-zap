"use strict";

const configuracaoLoja = window.configuracaoLoja || {
    id: "loja-demo",
    nome: "Catálogo Zap",
    whatsapp: "5511985699564",
    atendimento: {
        entregaAtiva: true,
        retiradaAtiva: true
    },
    endereco: {},
    cores: {
        principal: "#1688f8",
        whatsapp: "#25d366"
    }
};

const identificadorLoja =
    String(configuracaoLoja.id || "loja-demo").trim();

const numeroWhatsApp =
    String(configuracaoLoja.whatsapp || "").replace(/\D/g, "");

const chaveCarrinho =
    `catalogoZapCarrinho:${identificadorLoja}`;

let produtos = [];

const estado = {
    categoria: "todos",
    busca: "",
    carrinho: []
};

const elementos = {
    areaProdutos: document.getElementById("produtos"),
    quantidadeResultados: document.getElementById("quantidadeResultados"),
    nenhumProduto: document.getElementById("nenhumProduto"),
    campoBusca: document.getElementById("campoBusca"),
    areaBusca: document.getElementById("areaBusca"),
    botaoBusca: document.getElementById("botaoBusca"),
    limparBusca: document.getElementById("limparBusca"),
    listaCategorias: document.getElementById("listaCategorias"),
    botaoCarrinho: document.getElementById("botaoCarrinho"),
    fecharCarrinho: document.getElementById("fecharCarrinho"),
    painelCarrinho: document.getElementById("painelCarrinho"),
    fundoPainel: document.getElementById("fundoPainel"),
    limparCarrinho: document.getElementById("limparCarrinho"),
    contadorCarrinho: document.getElementById("contadorCarrinho"),
    itensCarrinho: document.getElementById("itensCarrinho"),
    totalCarrinho: document.getElementById("totalCarrinho"),
    enviarWhatsApp: document.getElementById("enviarWhatsApp"),
   whatsappFlutuante: document.getElementById("whatsappFlutuante"),

modalPedido: document.getElementById("modalPedido"),
fundoModalPedido: document.getElementById("fundoModalPedido"),
fecharModalPedido: document.getElementById("fecharModalPedido"),
cancelarPedido: document.getElementById("cancelarPedido"),
formularioPedido: document.getElementById("formularioPedido"),

nomeComprador: document.getElementById("nomeComprador"),
telefoneComprador: document.getElementById("telefoneComprador"),
areaEndereco: document.getElementById("areaEndereco"),
enderecoComprador: document.getElementById("enderecoComprador"),
observacoesComprador: document.getElementById("observacoesComprador"),

erroNomeComprador: document.getElementById("erroNomeComprador"),
erroTelefoneComprador: document.getElementById("erroTelefoneComprador"),
erroFormaRecebimento: document.getElementById("erroFormaRecebimento"),
erroEnderecoComprador: document.getElementById("erroEnderecoComprador")
    
};

function aplicarConfiguracaoLoja() {
    const nomeLoja =
        String(configuracaoLoja.nome || "Catálogo Zap").trim();

    const corPrincipal =
        configuracaoLoja.cores?.principal || "#1688f8";

    const corWhatsApp =
        configuracaoLoja.cores?.whatsapp || "#25d366";

    document.documentElement.style.setProperty(
        "--cor-principal",
        corPrincipal
    );

    document.documentElement.style.setProperty(
        "--cor-whatsapp",
        corWhatsApp
    );

    document
        .querySelectorAll(".marca-texto")
        .forEach((elemento) => {
            elemento.textContent = nomeLoja;
        });

    if (document.title) {
        document.title = document.title.replace(
            /Catálogo Zap/gi,
            nomeLoja
        );
    }
}

function validarConfiguracaoLoja() {
    if (!identificadorLoja) {
        console.error(
            "A configuração da loja precisa ter um identificador."
        );
    }

    if (!numeroWhatsApp) {
        console.warn(
            "O WhatsApp da loja ainda não foi configurado."
        );
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function calcularDesconto(precoAntigo, precoAtual) {
    if (!precoAntigo || precoAntigo <= precoAtual) {
        return 0;
    }

    return Math.round(
        ((precoAntigo - precoAtual) / precoAntigo) * 100
    );
}

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obterProdutosFiltrados() {
    const buscaNormalizada = normalizarTexto(estado.busca);

    return produtos
        .filter((produto) => {
            const correspondeCategoria =
                estado.categoria === "todos" ||
                produto.categoria === estado.categoria;

            const correspondeBusca =
                buscaNormalizada === "" ||
                normalizarTexto(produto.nome).includes(buscaNormalizada);

            return correspondeCategoria && correspondeBusca;
        })
        .sort((produtoA, produtoB) =>
            produtoA.nome.localeCompare(produtoB.nome, "pt-BR")
        );
}

async function carregarProdutos() {
    try {
        const resposta = await fetch(configuracaoLoja.apiProdutosUrl || `/api/produtos?loja=${encodeURIComponent(identificadorLoja)}`);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar produtos.");
        }

        const dados = await resposta.json();
        produtos = Array.isArray(dados) ? dados : [];

        renderizarProdutos();
    } catch (erro) {
        console.error(
            "Não foi possível carregar os produtos:",
            erro
        );

        produtos = [];

        if (elementos.areaProdutos) {
            elementos.areaProdutos.innerHTML = `
                <div class="alert alert-danger">
                    Não foi possível carregar os produtos.
                </div>
            `;
        }

        if (elementos.quantidadeResultados) {
            elementos.quantidadeResultados.textContent =
                "0 produtos";
        }
    }
}

function criarCardProduto(produto) {
    const desconto = calcularDesconto(
        produto.precoAntigo,
        produto.precoAtual
    );

    return `
        <article class="produto-card">
            <a
    href="${configuracaoLoja.catalogoUrl}/produto/${produto.id}"
    class="produto-imagem-area produto-link-imagem"
    aria-label="Ver detalhes de ${produto.nome}"
>

                ${produto.atacado ? '<span class="produto-atacado-card">ATACADO</span>' : ""}

                ${
                    desconto > 0
                        ? `
                            <span class="produto-desconto">
                                -${desconto}%
                            </span>
                        `
                        : ""
                }

                <img
                    class="produto-imagem"
                    src="${produto.imagem}"
                    alt="${produto.nome}"
                    loading="lazy"
                >

            </a>

            <div class="produto-informacoes">

                <h2 class="produto-nome">
                    ${produto.nome}
                </h2>

                <div class="produto-precos">

                    ${
                        produto.precoAntigo > produto.precoAtual
                            ? `
                                <span class="preco-antigo">
                                    ${formatarMoeda(produto.precoAntigo)}
                                </span>
                            `
                            : ""
                    }

                    <span class="preco-atual">
                        ${formatarMoeda(produto.precoAtual)}
                    </span>

                </div>

                <button
                    type="button"
                    class="botao-detalhes"
                    data-produto-id="${produto.id}"
                >
                    Ver detalhes
                </button>

            </div>
        </article>
    `;
}

function renderizarProdutos() {
    if (!elementos.areaProdutos) {
        return;
    }

    const produtosFiltrados = obterProdutosFiltrados();

    elementos.areaProdutos.innerHTML =
        produtosFiltrados.map(criarCardProduto).join("");

    const total = produtosFiltrados.length;

    elementos.quantidadeResultados.textContent =
        total === 1
            ? "1 produto"
            : `${total} produtos`;

    elementos.nenhumProduto.hidden = total !== 0;
    elementos.areaProdutos.hidden = total === 0;
}

function selecionarCategoria(botao) {
    document
        .querySelectorAll(".categoria-botao")
        .forEach((item) => item.classList.remove("ativo"));

    botao.classList.add("ativo");

    estado.categoria = botao.dataset.categoria;
    renderizarProdutos();
}

function abrirBusca() {
    elementos.areaBusca.classList.toggle("aberta");

    if (elementos.areaBusca.classList.contains("aberta")) {
        window.setTimeout(() => {
            elementos.campoBusca.focus();
        }, 100);
    }
}

function abrirCarrinho() {
    if (!elementos.painelCarrinho || !elementos.fundoPainel) {
        return;
    }

    elementos.painelCarrinho.classList.add("aberto");
    elementos.fundoPainel.classList.add("ativo");
    document.body.classList.add("painel-aberto");

    elementos.painelCarrinho.setAttribute("aria-hidden", "false");
}

function fecharCarrinho() {
    if (!elementos.painelCarrinho || !elementos.fundoPainel) {
        return;
    }

    elementos.painelCarrinho.classList.remove("aberto");
    elementos.fundoPainel.classList.remove("ativo");
    document.body.classList.remove("painel-aberto");

    elementos.painelCarrinho.setAttribute("aria-hidden", "true");
}

function abrirModalPedido() {
    if (!elementos.modalPedido) {
        return;
    }

    if (estado.carrinho.length === 0) {
        window.alert(
            "Adicione pelo menos um produto ao carrinho."
        );

        return;
    }

    fecharCarrinho();

    elementos.modalPedido.classList.add("aberto");
    elementos.modalPedido.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-aberto");

    window.setTimeout(() => {
        elementos.nomeComprador?.focus();
    }, 300);
}

function fecharModalPedido() {
    if (!elementos.modalPedido) {
        return;
    }

    elementos.modalPedido.classList.remove("aberto");
    elementos.modalPedido.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-aberto");
}

function obterFormaRecebimento() {
    return document.querySelector(
        'input[name="formaRecebimento"]:checked'
    )?.value || "";
}

function atualizarCampoEndereco() {
    if (!elementos.areaEndereco || !elementos.enderecoComprador) {
        return;
    }

    const formaRecebimento = obterFormaRecebimento();
    const precisaEndereco = formaRecebimento === "entrega";

    elementos.areaEndereco.hidden = !precisaEndereco;
    elementos.enderecoComprador.required = precisaEndereco;

    if (!precisaEndereco) {
        elementos.enderecoComprador.value = "";
        elementos.erroEnderecoComprador.textContent = "";
    }
}

function limparErrosFormulario() {
    elementos.erroNomeComprador.textContent = "";
    elementos.erroTelefoneComprador.textContent = "";
    elementos.erroFormaRecebimento.textContent = "";
    elementos.erroEnderecoComprador.textContent = "";
}

function validarFormularioPedido() {
    limparErrosFormulario();

    const nome = elementos.nomeComprador.value.trim();
    const telefone = elementos.telefoneComprador.value.trim();
    const telefoneNumeros = telefone.replace(/\D/g, "");
    const formaRecebimento = obterFormaRecebimento();
    const endereco = elementos.enderecoComprador.value.trim();

    let formularioValido = true;

    if (nome.length < 2) {
        elementos.erroNomeComprador.textContent =
            "Informe seu nome.";

        formularioValido = false;
    }

    if (telefoneNumeros.length < 10) {
        elementos.erroTelefoneComprador.textContent =
            "Informe um telefone válido.";

        formularioValido = false;
    }

    if (!formaRecebimento) {
        elementos.erroFormaRecebimento.textContent =
            "Escolha entrega ou retirada.";

        formularioValido = false;
    }

    if (formaRecebimento === "entrega" && endereco.length < 5) {
        elementos.erroEnderecoComprador.textContent =
            "Informe o endereço completo.";

        formularioValido = false;
    }

    return formularioValido;
}

function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(
        (item) => item.id === produtoId
    );

    if (!produto) {
        return;
    }

    const itemExistente = estado.carrinho.find(
        (item) => item.id === produtoId
    );

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        estado.carrinho.push({
            ...produto,
            quantidade: 1
        });
    }

    salvarCarrinho();
    renderizarCarrinho();
    abrirCarrinho();
}


function salvarCarrinho() {
    localStorage.setItem(
    chaveCarrinho,
    JSON.stringify(estado.carrinho)
);
}

function carregarCarrinho() {
    try {
       const dadosSalvos = localStorage.getItem(chaveCarrinho);

        if (!dadosSalvos) {
            estado.carrinho = [];
            return;
        }

        const carrinhoSalvo = JSON.parse(dadosSalvos);

        if (!Array.isArray(carrinhoSalvo)) {
            estado.carrinho = [];
            localStorage.removeItem(chaveCarrinho);
            return;
        }

        estado.carrinho = carrinhoSalvo.filter((item) => {
            return (
                item &&
                Number.isFinite(Number(item.id)) &&
                typeof item.nome === "string" &&
                Number.isFinite(Number(item.precoAtual)) &&
                Number.isFinite(Number(item.quantidade)) &&
                Number(item.quantidade) > 0
            );
        });
    } catch (erro) {
        console.error(
            "Não foi possível carregar o carrinho:",
            erro
        );

        estado.carrinho = [];
        localStorage.removeItem(chaveCarrinho);
    }
}

function limparCarrinho() {
    if (estado.carrinho.length === 0) {
        return;
    }

    const confirmou = window.confirm(
        "Deseja realmente remover todos os produtos do carrinho?"
    );

    if (!confirmou) {
        return;
    }

    estado.carrinho = [];

    salvarCarrinho();
    renderizarCarrinho();
}

function criarChaveItemCarrinho(item) {
    return [
        item.id,
        item.cor || "sem-cor",
        item.tamanho || "sem-tamanho"
    ].join("::");
}

function renderizarCarrinho() {
    if (
        !elementos.contadorCarrinho ||
        !elementos.itensCarrinho ||
        !elementos.totalCarrinho
    ) {
        return;
    }

    const quantidadeTotal = estado.carrinho.reduce(
        (total, item) => total + item.quantidade,
        0
    );

    const valorTotal = estado.carrinho.reduce(
        (total, item) =>
            total + item.precoAtual * item.quantidade,
        0
    );

    elementos.contadorCarrinho.textContent = quantidadeTotal;
    elementos.totalCarrinho.textContent = formatarMoeda(valorTotal);

    if (elementos.enviarWhatsApp) {
        elementos.enviarWhatsApp.disabled =
            estado.carrinho.length === 0;
    }
    
    if (elementos.limparCarrinho) {
    elementos.limparCarrinho.disabled =
        estado.carrinho.length === 0;
}

    if (estado.carrinho.length === 0) {
        elementos.itensCarrinho.innerHTML = `
            <div class="carrinho-vazio">
                <i class="bi bi-cart-x"></i>
                <p>Seu carrinho está vazio.</p>
            </div>
        `;

        return;
    }

    elementos.itensCarrinho.innerHTML = estado.carrinho
        .map((item) => {
            const chaveItem = criarChaveItemCarrinho(item);

            return `
                <article class="item-carrinho">

                    <img
                        src="${item.imagem}"
                        alt="${item.nome}"
                    >

                    <div class="item-carrinho-informacoes">

                        <h3>${item.nome}</h3>

                        <p class="item-carrinho-variacoes">
                            ${
                                item.cor
                                    ? `<span>Cor: ${item.cor}</span>`
                                    : ""
                            }

                            ${
                                item.tamanho
                                    ? `<span>Tamanho: ${item.tamanho}</span>`
                                    : ""
                            }
                        </p>

                        <span class="item-carrinho-preco">
                            ${formatarMoeda(item.precoAtual)}
                        </span>

                        <div class="item-carrinho-acoes">

                            <div class="controle-quantidade-carrinho">

                                <button
                                    type="button"
                                    data-acao-carrinho="diminuir"
                                    data-item-chave="${chaveItem}"
                                    aria-label="Diminuir quantidade de ${item.nome}"
                                >
                                    <i class="bi bi-dash"></i>
                                </button>

                                <span>
                                    ${item.quantidade}
                                </span>

                                <button
                                    type="button"
                                    data-acao-carrinho="aumentar"
                                    data-item-chave="${chaveItem}"
                                    aria-label="Aumentar quantidade de ${item.nome}"
                                >
                                    <i class="bi bi-plus"></i>
                                </button>

                            </div>

                            <button
                                type="button"
                                class="remover-item-carrinho"
                                data-acao-carrinho="remover"
                                data-item-chave="${chaveItem}"
                                aria-label="Remover ${item.nome}"
                            >
                                <i class="bi bi-trash3"></i>
                            </button>

                        </div>

                        <strong class="item-carrinho-subtotal">
                            Subtotal:
                            ${formatarMoeda(
                                item.precoAtual * item.quantidade
                            )}
                        </strong>

                    </div>

                </article>
            `;
        })
        .join("");
}

function criarMensagemWhatsApp(dadosComprador) {
    if (estado.carrinho.length === 0) {
        return "";
    }

    const linhasProdutos = estado.carrinho
        .map((item) => {
            const subtotal =
                item.precoAtual * item.quantidade;

            const variacoes = [
                item.cor ? `Cor: ${item.cor}` : "",
                item.tamanho ? `Tamanho: ${item.tamanho}` : ""
            ].filter(Boolean);

            return [
                `• ${item.nome}${item.atacado ? " (ATACADO)" : ""}`,
                ...variacoes,
                `Quantidade: ${item.quantidade}`,
                `Subtotal: ${formatarMoeda(subtotal)}`
            ].join("\n");
        })
        .join("\n\n");

    const total = estado.carrinho.reduce(
        (soma, item) =>
            soma + item.precoAtual * item.quantidade,
        0
    );

    const tipoRecebimento =
        dadosComprador.formaRecebimento === "entrega"
            ? "Receber em casa"
            : "Retirar na loja";

    const linhasCliente = [
        "🛍️ *NOVO PEDIDO*",
        "",
        `*Cliente:* ${dadosComprador.nome}`,
        `*Telefone:* ${dadosComprador.telefone}`,
        `*Recebimento:* ${tipoRecebimento}`
    ];

    if (dadosComprador.formaRecebimento === "entrega") {
        linhasCliente.push(
            `*Endereço:* ${dadosComprador.endereco}`
        );
    }

    return [
        ...linhasCliente,
        "",
        "*ITENS DO PEDIDO*",
        "",
        linhasProdutos,
        "",
        `*Total: ${formatarMoeda(total)}*`,
        "",
        dadosComprador.observacoes
            ? `*Observações:* ${dadosComprador.observacoes}`
            : ""
    ]
        .filter((linha, indice, lista) => {
            if (linha !== "") {
                return true;
            }

            return lista[indice - 1] !== "";
        })
        .join("\n")
        .trim();
}

function enviarPedidoParaWhatsApp(evento) {
    evento.preventDefault();

    if (!validarFormularioPedido()) {
        return;
    }

    const dadosComprador = {
        nome: elementos.nomeComprador.value.trim(),
        telefone: elementos.telefoneComprador.value.trim(),
        formaRecebimento: obterFormaRecebimento(),
        endereco: elementos.enderecoComprador.value.trim(),
        observacoes:
            elementos.observacoesComprador.value.trim()
    };

    if (!numeroWhatsApp) {
        window.alert(
            "O WhatsApp desta loja ainda não foi configurado."
        );
        return;
    }

    const mensagem = encodeURIComponent(
        criarMensagemWhatsApp(dadosComprador)
    );

    window.open(
        `https://wa.me/${numeroWhatsApp}?text=${mensagem}`,
        "_blank",
        "noopener,noreferrer"
    );
}

function abrirWhatsAppGeral() {
    if (!numeroWhatsApp) {
        window.alert(
            "O WhatsApp desta loja ainda não foi configurado."
        );
        return;
    }

    const mensagem = encodeURIComponent(
        "Olá! Gostaria de saber mais sobre os produtos do catálogo."
    );

    window.open(
        `https://wa.me/${numeroWhatsApp}?text=${mensagem}`,
        "_blank",
        "noopener,noreferrer"
    );
}

function tratarCliqueNosProdutos(evento) {
    const botao = evento.target.closest(".botao-detalhes");

    if (!botao) {
        return;
    }

    const produtoId = Number(botao.dataset.produtoId);

    window.location.href = `${configuracaoLoja.catalogoUrl}/produto/${produtoId}`;
}

function tratarCliqueNoCarrinho(evento) {
    const botao = evento.target.closest("[data-acao-carrinho]");

    if (!botao) {
        return;
    }

    const acao = botao.dataset.acaoCarrinho;
    const chaveItem = botao.dataset.itemChave;

    const indice = estado.carrinho.findIndex(
        (item) => criarChaveItemCarrinho(item) === chaveItem
    );

    if (indice === -1) {
        return;
    }

    const item = estado.carrinho[indice];

    if (acao === "aumentar") {
        const estoque = Math.max(0, Number(item.estoque) || Number.MAX_SAFE_INTEGER);
        if (item.quantidade < estoque) item.quantidade += 1;
        else window.alert(`Estoque máximo disponível: ${estoque}.`);
    }

    if (acao === "diminuir") {
        const minimo = Math.max(1, Number(item.quantidadeMinima) || 1);
        if (item.quantidade > minimo) {
            item.quantidade -= 1;
        } else {
            estado.carrinho.splice(indice, 1);
        }
    }

    if (acao === "remover") {
        estado.carrinho.splice(indice, 1);
    }

    salvarCarrinho();
    renderizarCarrinho();
}

function iniciarPaginaProduto() {
    const imagemPrincipal = document.getElementById("imagemPrincipal");
    const miniaturas = document.querySelectorAll(".miniatura-produto");
    const listaCores = document.getElementById("listaCores");
    const corSelecionada = document.getElementById("corSelecionada");
    const listaTamanhos = document.getElementById("listaTamanhos");
    const quantidadeProduto = document.getElementById("quantidadeProduto");
    const diminuirQuantidade = document.getElementById("diminuirQuantidade");
    const aumentarQuantidade = document.getElementById("aumentarQuantidade");
    const adicionarProduto = document.getElementById("adicionarProduto");
    const estoqueDisponivel = document.getElementById("estoqueDisponivel");
    if (!imagemPrincipal || !adicionarProduto) return;

    let variacoes = [];
    try { variacoes = JSON.parse(document.getElementById("variacoesProduto")?.textContent || "[]"); } catch (_) { variacoes = []; }
    let corAtual = document.querySelector(".opcao-cor.selecionada")?.dataset.cor || "";
    let tamanhoAtual = document.querySelector(".opcao-tamanho.selecionada")?.dataset.tamanho || "";
    const quantidadeMinima = Math.max(1, Number(adicionarProduto.dataset.produtoQuantidadeMinima) || 1);

    function obterVariacaoAtual() {
        return variacoes.find((v) => String(v.cor || "") === corAtual && String(v.tamanho || "") === tamanhoAtual) || null;
    }
    function atualizarDisponibilidade() {
        const variacao = obterVariacaoAtual();
        const estoque = Math.max(0, Number(variacao?.estoque) || 0);
        quantidadeProduto.min = String(quantidadeMinima);
        quantidadeProduto.max = String(estoque);
        if (Number(quantidadeProduto.value) < quantidadeMinima) quantidadeProduto.value = String(quantidadeMinima);
        if (estoque >= quantidadeMinima && Number(quantidadeProduto.value) > estoque) quantidadeProduto.value = String(estoque);
        adicionarProduto.disabled = estoque < quantidadeMinima;
        adicionarProduto.innerHTML = estoque < quantidadeMinima
            ? '<i class="bi bi-x-circle"></i> Indisponível'
            : '<i class="bi bi-cart-plus"></i> Adicionar ao carrinho';
        if (estoqueDisponivel) estoqueDisponivel.textContent = estoque > 0 ? `Estoque disponível: ${estoque}` : "Sem estoque";

        document.querySelectorAll(".opcao-cor").forEach((botao) => {
            const existe = variacoes.some((v) => String(v.cor || "") === botao.dataset.cor && Number(v.estoque) >= quantidadeMinima);
            botao.classList.toggle("indisponivel", !existe);
        });
        document.querySelectorAll(".opcao-tamanho").forEach((botao) => {
            const existe = variacoes.some((v) => String(v.tamanho || "") === botao.dataset.tamanho && (!corAtual || String(v.cor || "") === corAtual) && Number(v.estoque) >= quantidadeMinima);
            botao.classList.toggle("indisponivel", !existe);
        });
    }

    miniaturas.forEach((miniatura) => miniatura.addEventListener("click", () => {
        miniaturas.forEach((item) => item.classList.remove("ativa"));
        miniatura.classList.add("ativa");
        if (imagemPrincipal.tagName === "IMG") imagemPrincipal.src = miniatura.dataset.imagem;
    }));

    listaCores?.addEventListener("click", (evento) => {
        const botao = evento.target.closest(".opcao-cor");
        if (!botao || botao.classList.contains("indisponivel")) return;
        document.querySelectorAll(".opcao-cor").forEach((item) => item.classList.remove("selecionada"));
        botao.classList.add("selecionada"); corAtual = botao.dataset.cor;
        if (corSelecionada) corSelecionada.textContent = corAtual;
        const tamanhoValido = variacoes.some((v) => String(v.cor || "")===corAtual && String(v.tamanho || "")===tamanhoAtual && Number(v.estoque)>=quantidadeMinima);
        if (!tamanhoValido) {
            const primeira = variacoes.find((v)=>String(v.cor||"")===corAtual && Number(v.estoque)>=quantidadeMinima);
            if (primeira) {
                tamanhoAtual=String(primeira.tamanho||"");
                document.querySelectorAll(".opcao-tamanho").forEach((item)=>item.classList.toggle("selecionada",item.dataset.tamanho===tamanhoAtual));
            }
        }
        atualizarDisponibilidade();
    });
    listaTamanhos?.addEventListener("click", (evento) => {
        const botao = evento.target.closest(".opcao-tamanho");
        if (!botao || botao.classList.contains("indisponivel")) return;
        document.querySelectorAll(".opcao-tamanho").forEach((item)=>item.classList.remove("selecionada"));
        botao.classList.add("selecionada"); tamanhoAtual=botao.dataset.tamanho; atualizarDisponibilidade();
    });
    diminuirQuantidade?.addEventListener("click",()=>{
        quantidadeProduto.value=String(Math.max(quantidadeMinima,Number(quantidadeProduto.value)-1));
    });
    aumentarQuantidade?.addEventListener("click",()=>{
        const estoque=Math.max(0,Number(obterVariacaoAtual()?.estoque)||0);
        quantidadeProduto.value=String(Math.min(estoque,Number(quantidadeProduto.value)+1));
    });
    adicionarProduto.addEventListener("click",()=>{
        const variacao=obterVariacaoAtual();
        const estoque=Math.max(0,Number(variacao?.estoque)||0);
        const quantidade=Number(quantidadeProduto.value);
        if (!variacao || quantidade<quantidadeMinima || quantidade>estoque) {
            window.alert("A quantidade escolhida não está disponível em estoque."); return;
        }
        const produtoId=Number(adicionarProduto.dataset.produtoId);
        const carrinhoSalvo=JSON.parse(localStorage.getItem(chaveCarrinho)||"[]");
        const itemExistente=carrinhoSalvo.find((item)=>item.id===produtoId&&item.cor===corAtual&&item.tamanho===tamanhoAtual);
        const novaQuantidade=(itemExistente?.quantidade||0)+quantidade;
        if (novaQuantidade>estoque) { window.alert(`Estoque máximo disponível: ${estoque}.`); return; }
        if (itemExistente) { itemExistente.quantidade=novaQuantidade; itemExistente.estoque=estoque; }
        else carrinhoSalvo.push({id:produtoId,nome:adicionarProduto.dataset.produtoNome,precoAtual:Number(adicionarProduto.dataset.produtoPreco),imagem:adicionarProduto.dataset.produtoImagem,cor:corAtual,tamanho:tamanhoAtual,quantidade,quantidadeMinima,estoque,atacado:adicionarProduto.dataset.produtoAtacado==="1"});
        localStorage.setItem(chaveCarrinho,JSON.stringify(carrinhoSalvo)); estado.carrinho=carrinhoSalvo; renderizarCarrinho(); abrirCarrinho();
    });
    atualizarDisponibilidade();
}

validarConfiguracaoLoja();
aplicarConfiguracaoLoja();
carregarCarrinho();

if (elementos.areaProdutos) {
    carregarProdutos();
}

renderizarCarrinho();
iniciarPaginaProduto();

elementos.botaoCarrinho?.addEventListener(
    "click",
    abrirCarrinho
);

elementos.fecharCarrinho?.addEventListener(
    "click",
    fecharCarrinho
);

elementos.fundoPainel?.addEventListener(
    "click",
    fecharCarrinho
);

elementos.itensCarrinho?.addEventListener(
    "click",
    tratarCliqueNoCarrinho
);

elementos.limparCarrinho?.addEventListener(
    "click",
    limparCarrinho
);

elementos.enviarWhatsApp?.addEventListener(
    "click",
    abrirModalPedido
);

elementos.fecharModalPedido?.addEventListener(
    "click",
    fecharModalPedido
);

elementos.cancelarPedido?.addEventListener(
    "click",
    fecharModalPedido
);

elementos.fundoModalPedido?.addEventListener(
    "click",
    fecharModalPedido
);

elementos.formularioPedido?.addEventListener(
    "submit",
    enviarPedidoParaWhatsApp
);

document
    .querySelectorAll('input[name="formaRecebimento"]')
    .forEach((opcao) => {
        opcao.addEventListener(
            "change",
            atualizarCampoEndereco
        );
    });

elementos.whatsappFlutuante?.addEventListener(
    "click",
    abrirWhatsAppGeral
);

elementos.botaoBusca?.addEventListener(
    "click",
    abrirBusca
);

elementos.limparBusca?.addEventListener(
    "click",
    () => {
        estado.busca = "";
        elementos.campoBusca.value = "";
        renderizarProdutos();
        elementos.campoBusca.focus();
    }
);

elementos.campoBusca?.addEventListener(
    "input",
    (evento) => {
        estado.busca = evento.target.value;
        renderizarProdutos();
    }
);

elementos.listaCategorias?.addEventListener(
    "click",
    (evento) => {
        const botao = evento.target.closest(
            ".categoria-botao"
        );

        if (botao) {
            selecionarCategoria(botao);
        }
    }
);

elementos.areaProdutos?.addEventListener(
    "click",
    tratarCliqueNosProdutos
);

document.addEventListener(
    "keydown",
    (evento) => {
        if (evento.key === "Escape") {
            fecharCarrinho();
            fecharModalPedido();
        }
    }
);