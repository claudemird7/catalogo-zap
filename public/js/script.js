"use strict";

const numeroWhatsApp = "5511985699564";

const produtos = [
    {
        id: 1,
        nome: "New Balance Rebel",
        categoria: "tenis",
        precoAntigo: 180,
        precoAtual: 140,
        imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 2,
        nome: "Adizero Evo SL",
        categoria: "tenis",
        precoAntigo: 180,
        precoAtual: 150,
        imagem: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 3,
        nome: "Air Force 1",
        categoria: "tenis",
        precoAntigo: 120,
        precoAtual: 65,
        imagem: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 4,
        nome: "Prophecy 15",
        categoria: "tenis",
        precoAntigo: 120,
        precoAtual: 75,
        imagem: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 5,
        nome: "Camiseta Essential",
        categoria: "camisetas",
        precoAntigo: 89.9,
        precoAtual: 69.9,
        imagem: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 6,
        nome: "Blusa Moletom Casual",
        categoria: "blusas",
        precoAntigo: 149.9,
        precoAtual: 119.9,
        imagem: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 7,
        nome: "Calça Jeans Slim",
        categoria: "calcas",
        precoAntigo: 159.9,
        precoAtual: 129.9,
        imagem: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=85"
    },
    {
        id: 8,
        nome: "Boné Street",
        categoria: "acessorios",
        precoAntigo: 69.9,
        precoAtual: 49.9,
        imagem: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=85"
    }
];

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
    contadorCarrinho: document.getElementById("contadorCarrinho"),
    itensCarrinho: document.getElementById("itensCarrinho"),
    totalCarrinho: document.getElementById("totalCarrinho"),
    enviarWhatsApp: document.getElementById("enviarWhatsApp"),
    whatsappFlutuante: document.getElementById("whatsappFlutuante")
};

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

function criarCardProduto(produto) {
    const desconto = calcularDesconto(
        produto.precoAntigo,
        produto.precoAtual
    );

    return `
        <article class="produto-card">
            <a
    href="/produto/${produto.id}"
    class="produto-imagem-area produto-link-imagem"
    aria-label="Ver detalhes de ${produto.nome}"
>

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
    elementos.painelCarrinho.classList.add("aberto");
    elementos.fundoPainel.classList.add("ativo");
    document.body.classList.add("painel-aberto");

    elementos.painelCarrinho.setAttribute("aria-hidden", "false");
}

function fecharCarrinho() {
    elementos.painelCarrinho.classList.remove("aberto");
    elementos.fundoPainel.classList.remove("ativo");
    document.body.classList.remove("painel-aberto");

    elementos.painelCarrinho.setAttribute("aria-hidden", "true");
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

function removerDoCarrinho(produtoId) {
    estado.carrinho = estado.carrinho.filter(
        (item) => item.id !== produtoId
    );

    salvarCarrinho();
    renderizarCarrinho();
}

function salvarCarrinho() {
    localStorage.setItem(
        "catalogoZapCarrinho",
        JSON.stringify(estado.carrinho)
    );
}

function carregarCarrinho() {
    try {
        const dadosSalvos = localStorage.getItem(
            "catalogoZapCarrinho"
        );

        estado.carrinho = dadosSalvos
            ? JSON.parse(dadosSalvos)
            : [];
    } catch (erro) {
        console.error("Não foi possível carregar o carrinho:", erro);
        estado.carrinho = [];
    }
}

function renderizarCarrinho() {
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
        .map(
            (item) => `
                <article class="item-carrinho">

                    <img
                        src="${item.imagem}"
                        alt="${item.nome}"
                    >

                    <div>
                        <h3>${item.nome}</h3>

                        <p>
                            ${item.quantidade} ×
                            ${formatarMoeda(item.precoAtual)}
                        </p>
                    </div>

                    <button
                        type="button"
                        data-remover-id="${item.id}"
                        aria-label="Remover ${item.nome}"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>

                </article>
            `
        )
        .join("");
}

function criarMensagemWhatsApp() {
    if (estado.carrinho.length === 0) {
        return "";
    }

    const linhasProdutos = estado.carrinho
        .map((item) => {
            const subtotal =
                item.precoAtual * item.quantidade;

            return [
                `• ${item.nome}`,
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

    return [
        "Olá!",
        "",
        "Gostaria destes produtos:",
        "",
        linhasProdutos,
        "",
        `Total: ${formatarMoeda(total)}`
    ].join("\n");
}

function abrirWhatsAppComCarrinho() {
    if (estado.carrinho.length === 0) {
        window.alert(
            "Adicione pelo menos um produto ao carrinho."
        );

        return;
    }

    const mensagem = encodeURIComponent(
        criarMensagemWhatsApp()
    );

    window.open(
        `https://wa.me/${numeroWhatsApp}?text=${mensagem}`,
        "_blank",
        "noopener,noreferrer"
    );
}

function abrirWhatsAppGeral() {
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

    window.location.href = `/produto/${produtoId}`;
}

function tratarCliqueNoCarrinho(evento) {
    const botaoRemover = evento.target.closest(
        "[data-remover-id]"
    );

    if (!botaoRemover) {
        return;
    }

    removerDoCarrinho(
        Number(botaoRemover.dataset.removerId)
    );
}

elementos.botaoBusca.addEventListener("click", abrirBusca);

elementos.campoBusca.addEventListener("input", (evento) => {
    estado.busca = evento.target.value;
    renderizarProdutos();
});

elementos.limparBusca.addEventListener("click", () => {
    elementos.campoBusca.value = "";
    estado.busca = "";
    renderizarProdutos();
    elementos.campoBusca.focus();
});

elementos.listaCategorias.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".categoria-botao");

    if (botao) {
        selecionarCategoria(botao);
    }
});

elementos.areaProdutos.addEventListener(
    "click",
    tratarCliqueNosProdutos
);

elementos.itensCarrinho.addEventListener(
    "click",
    tratarCliqueNoCarrinho
);

elementos.botaoCarrinho.addEventListener(
    "click",
    abrirCarrinho
);

elementos.fecharCarrinho.addEventListener(
    "click",
    fecharCarrinho
);

elementos.fundoPainel.addEventListener(
    "click",
    fecharCarrinho
);

elementos.enviarWhatsApp.addEventListener(
    "click",
    abrirWhatsAppComCarrinho
);

elementos.whatsappFlutuante.addEventListener(
    "click",
    abrirWhatsAppGeral
);

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharCarrinho();
    }
});

carregarCarrinho();
renderizarProdutos();
renderizarCarrinho();

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

    if (!imagemPrincipal) {
        return;
    }

    let corAtual =
        document.querySelector(".opcao-cor.selecionada")?.dataset.cor || "";

    let tamanhoAtual =
        document.querySelector(".opcao-tamanho.selecionada")?.dataset.tamanho || "";

    miniaturas.forEach((miniatura) => {
        miniatura.addEventListener("click", () => {
            miniaturas.forEach((item) => item.classList.remove("ativa"));

            miniatura.classList.add("ativa");
            imagemPrincipal.src = miniatura.dataset.imagem;
        });
    });

    if (listaCores) {
        listaCores.addEventListener("click", (evento) => {
            const botao = evento.target.closest(".opcao-cor");

            if (!botao) {
                return;
            }

            document
                .querySelectorAll(".opcao-cor")
                .forEach((item) => item.classList.remove("selecionada"));

            botao.classList.add("selecionada");
            corAtual = botao.dataset.cor;
            corSelecionada.textContent = corAtual;
        });
    }

    if (listaTamanhos) {
        listaTamanhos.addEventListener("click", (evento) => {
            const botao = evento.target.closest(".opcao-tamanho");

            if (!botao) {
                return;
            }

            document
                .querySelectorAll(".opcao-tamanho")
                .forEach((item) => item.classList.remove("selecionada"));

            botao.classList.add("selecionada");
            tamanhoAtual = botao.dataset.tamanho;
        });
    }

    diminuirQuantidade?.addEventListener("click", () => {
        const valorAtual = Number(quantidadeProduto.value);

        quantidadeProduto.value = Math.max(1, valorAtual - 1);
    });

    aumentarQuantidade?.addEventListener("click", () => {
        const valorAtual = Number(quantidadeProduto.value);

        quantidadeProduto.value = valorAtual + 1;
    });

    adicionarProduto?.addEventListener("click", () => {
        const produto = {
            id: Number(adicionarProduto.dataset.produtoId),
            nome: adicionarProduto.dataset.produtoNome,
            precoAtual: Number(adicionarProduto.dataset.produtoPreco),
            imagem: adicionarProduto.dataset.produtoImagem,
            cor: corAtual,
            tamanho: tamanhoAtual,
            quantidade: Number(quantidadeProduto.value)
        };

        const carrinhoSalvo = JSON.parse(
            localStorage.getItem("catalogoZapCarrinho") || "[]"
        );

        carrinhoSalvo.push(produto);

        localStorage.setItem(
            "catalogoZapCarrinho",
            JSON.stringify(carrinhoSalvo)
        );

        window.alert("Produto adicionado ao carrinho.");
    });
}

iniciarPaginaProduto();