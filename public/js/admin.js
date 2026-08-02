"use strict";

const sidebar = document.querySelector("[data-admin-sidebar]");
const overlay = document.querySelector("[data-admin-overlay]");
const openButton = document.querySelector("[data-sidebar-open]");
const closeButton = document.querySelector("[data-sidebar-close]");
const toast = document.querySelector("[data-admin-toast]");
const toastMessage = document.querySelector("[data-toast-message]");

function abrirMenu() {
    sidebar?.classList.add("is-open");
    overlay?.classList.add("is-visible");
    document.body.classList.add("menu-open");
}
function fecharMenu() {
    sidebar?.classList.remove("is-open");
    overlay?.classList.remove("is-visible");
    document.body.classList.remove("menu-open");
}
function mostrarAviso(recurso) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = `${recurso} será liberado no próximo módulo.`;
    toast.classList.add("is-visible");
    window.clearTimeout(mostrarAviso.timeoutId);
    mostrarAviso.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

openButton?.addEventListener("click", abrirMenu);
closeButton?.addEventListener("click", fecharMenu);
overlay?.addEventListener("click", fecharMenu);
window.addEventListener("keydown", (evento) => { if (evento.key === "Escape") fecharMenu(); });
window.addEventListener("pageshow", fecharMenu);
document.querySelectorAll("[data-admin-sidebar] a").forEach((link) => link.addEventListener("click", fecharMenu));

document.querySelectorAll("[data-coming-soon]").forEach((elemento) => {
    elemento.addEventListener("click", () => mostrarAviso(elemento.dataset.comingSoon || "Este recurso"));
});
document.querySelectorAll("[data-delete-product]").forEach((form) => {
    form.addEventListener("submit", (evento) => {
        if (!confirm(`Excluir “${form.dataset.deleteProduct}”? Esta ação não poderá ser desfeita.`)) evento.preventDefault();
    });
});

const imageInput = document.querySelector("[data-image-input]");
const imagePreview = document.querySelector("[data-image-preview]");
if (imageInput && imagePreview) {
    imageInput.addEventListener("change", () => {
        const arquivo = imageInput.files[0];
        if (arquivo) imagePreview.innerHTML = `<img src="${URL.createObjectURL(arquivo)}" alt="Prévia">`;
    });
}

const colorList = document.querySelector("[data-color-list]");
const sizeList = document.querySelector("[data-size-list]");
const colorEmpty = document.querySelector("[data-color-empty]");
const sizeEmpty = document.querySelector("[data-size-empty]");

function atualizarVazios() {
    if (colorEmpty) colorEmpty.hidden = Boolean(colorList?.children.length);
    if (sizeEmpty) sizeEmpty.hidden = Boolean(sizeList?.children.length);
}
function criarLinhaCor() {
    const linha = document.createElement("div");
    linha.className = "variation-row color-row";
    linha.innerHTML = `<input name="corNome" maxlength="50" placeholder="Ex.: Azul"><input type="color" name="corValor" value="#808080" aria-label="Cor"><button type="button" class="remove-variation" data-remove-variation aria-label="Remover cor"><i class="bi bi-trash3"></i></button>`;
    return linha;
}
function criarLinhaTamanho() {
    const linha = document.createElement("div");
    linha.className = "variation-row size-row";
    linha.innerHTML = `<input name="tamanhoNome" maxlength="30" placeholder="Ex.: M"><button type="button" class="remove-variation" data-remove-variation aria-label="Remover tamanho"><i class="bi bi-trash3"></i></button>`;
    return linha;
}

document.querySelector("[data-add-color]")?.addEventListener("click", () => {
    const linha = criarLinhaCor(); colorList.appendChild(linha); atualizarVazios(); linha.querySelector("input").focus();
});
document.querySelector("[data-add-size]")?.addEventListener("click", () => {
    const linha = criarLinhaTamanho(); sizeList.appendChild(linha); atualizarVazios(); linha.querySelector("input").focus();
});
document.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-remove-variation]");
    if (!botao) return;
    botao.closest(".variation-row")?.remove();
    atualizarVazios();
});
atualizarVazios();

const saleMode = document.querySelector("[data-sale-mode]");
const wholesaleFields = document.querySelector("[data-wholesale-fields]");
function atualizarAtacado() {
    if (!wholesaleFields) return;
    const temAtacado = saleMode?.value === "varejo_atacado" || saleMode?.value === "atacado";
    wholesaleFields.hidden = !temAtacado;
    wholesaleFields.querySelectorAll("input").forEach((input) => {
        input.required = Boolean(temAtacado);
    });
}
saleMode?.addEventListener("change", atualizarAtacado);
atualizarAtacado();

const stockList = document.querySelector("[data-stock-list]");
const stockEmpty = document.querySelector("[data-stock-empty]");
let estoquesIniciais = {};
try {
    const dados = JSON.parse(document.getElementById("estoquesIniciais")?.textContent || "[]");
    estoquesIniciais = Object.fromEntries(dados.map((item) => [item.chave, item.estoque]));
} catch (_) { estoquesIniciais = {}; }

function valoresDosInputs(lista, seletor) {
    return Array.from(lista?.querySelectorAll(seletor) || [])
        .map((input) => input.value.trim()).filter(Boolean);
}
function renderizarEstoque() {
    if (!stockList) return;
    const atuais = {};
    stockList.querySelectorAll("tr").forEach((linha) => {
        atuais[linha.dataset.chave] = linha.querySelector("[name='estoqueQuantidade']")?.value || "0";
    });
    const cores = valoresDosInputs(colorList, "[name='corNome']");
    const tamanhos = valoresDosInputs(sizeList, "[name='tamanhoNome']");
    let combinacoes = [];
    if (cores.length && tamanhos.length) combinacoes = cores.flatMap((cor) => tamanhos.map((tamanho) => ({ cor, tamanho })));
    else if (cores.length) combinacoes = cores.map((cor) => ({ cor, tamanho: "" }));
    else if (tamanhos.length) combinacoes = tamanhos.map((tamanho) => ({ cor: "", tamanho }));
    else combinacoes = [{ cor: "", tamanho: "" }];

    stockList.innerHTML = combinacoes.map(({ cor, tamanho }) => {
        const chave = `${cor}|${tamanho}`;
        const valor = atuais[chave] ?? estoquesIniciais[chave] ?? 0;
        return `<tr data-chave="${chave.replace(/"/g, '&quot;')}">
            <td>${cor || "Sem cor"}</td><td>${tamanho || "Sem tamanho"}</td>
            <td><input type="hidden" name="estoqueChave" value="${chave.replace(/"/g, '&quot;')}"><input class="stock-input" type="number" name="estoqueQuantidade" min="0" step="1" value="${valor}" inputmode="numeric"></td>
        </tr>`;
    }).join("");
    if (stockEmpty) stockEmpty.hidden = combinacoes.length > 0;
}
colorList?.addEventListener("input", renderizarEstoque);
sizeList?.addEventListener("input", renderizarEstoque);
document.querySelector("[data-add-color]")?.addEventListener("click", () => setTimeout(renderizarEstoque));
document.querySelector("[data-add-size]")?.addEventListener("click", () => setTimeout(renderizarEstoque));
document.addEventListener("click", (evento) => {
    if (evento.target.closest("[data-remove-variation]")) setTimeout(renderizarEstoque);
});
renderizarEstoque();

// =========================================================
// CONFIGURAÇÕES DA LOJA
// =========================================================
(function iniciarConfiguracoesLoja() {
    const formulario = document.querySelector(
        "[data-configuracoes-form]"
    );

    if (!formulario) {
        return;
    }

    const botoes = Array.from(
        document.querySelectorAll("[data-config-tab]")
    );

    const paineis = Array.from(
        document.querySelectorAll("[data-config-panel]")
    );

    const caixaErro = document.querySelector(
        "[data-image-error]"
    );

    const textoErro = document.querySelector(
        "[data-image-error-message]"
    );

    const tamanhoMaximo = 8 * 1024 * 1024;

    const tiposPermitidos = new Set([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/x-ms-bmp",
        "image/tiff"
    ]);

    function mostrarErro(mensagem) {
        if (caixaErro && textoErro) {
            textoErro.textContent = mensagem;
            caixaErro.hidden = false;

            caixaErro.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return;
        }

        window.alert(mensagem);
    }

    function limparErro() {
        if (caixaErro) {
            caixaErro.hidden = true;
        }

        if (textoErro) {
            textoErro.textContent = "";
        }
    }

    function abrirAba(nome) {
        botoes.forEach((botao) => {
            const ativa =
                botao.dataset.configTab === nome;

            botao.classList.toggle(
                "active",
                ativa
            );

            botao.setAttribute(
                "aria-selected",
                ativa ? "true" : "false"
            );
        });

        paineis.forEach((painel) => {
            const ativo =
                painel.dataset.configPanel === nome;

            painel.hidden = !ativo;

            painel.classList.toggle(
                "active",
                ativo
            );
        });

        sessionStorage.setItem(
            "catalogoZapAbaConfiguracao",
            nome
        );
    }

    botoes.forEach((botao) => {
        botao.addEventListener("click", () => {
            abrirAba(
                botao.dataset.configTab
            );
        });
    });

    const abaSalva = sessionStorage.getItem(
        "catalogoZapAbaConfiguracao"
    );

    const abaExiste = paineis.some(
        (painel) =>
            painel.dataset.configPanel === abaSalva
    );

    abrirAba(
        abaExiste ? abaSalva : "identidade"
    );

    function atualizarPreview(tipo, arquivo) {
        const container = document.querySelector(
            `[data-preview-container="${tipo}"]`
        );

        if (!container) {
            return;
        }

        const url = URL.createObjectURL(arquivo);

        container.innerHTML = `
            <img
                src="${url}"
                alt="Pré-visualização da imagem"
            >
        `;
    }

    document
        .querySelectorAll("[data-image-upload]")
        .forEach((input) => {
            input.addEventListener("change", () => {
                limparErro();

                const arquivo = input.files?.[0];

                if (!arquivo) {
                    return;
                }

                if (arquivo.size > tamanhoMaximo) {
                    input.value = "";

                    mostrarErro(
                        `A imagem ${arquivo.name} ultrapassa o limite de 8 MB.`
                    );

                    return;
                }

                if (!tiposPermitidos.has(arquivo.type)) {
                    input.value = "";

                    mostrarErro(
                        "Envie uma imagem JPG, PNG, GIF, BMP ou TIFF."
                    );

                    return;
                }

                atualizarPreview(
                    input.dataset.imageUpload,
                    arquivo
                );

                if (input.id === "banner") {
                    const campoRemover =
                        document.getElementById(
                            "remover_banner"
                        );

                    const botaoRemover =
                        document.querySelector(
                            "[data-remove-banner]"
                        );

                    if (campoRemover) {
                        campoRemover.value = "0";
                    }

                    if (botaoRemover) {
                        botaoRemover.disabled = false;
                    }
                }
            });
        });

    const botaoRemover = document.querySelector(
        "[data-remove-banner]"
    );

    botaoRemover?.addEventListener("click", () => {
        if (
            !window.confirm(
                "Deseja remover o banner da loja?"
            )
        ) {
            return;
        }

        const campoRemover = document.getElementById(
            "remover_banner"
        );

        const campoBanner = document.getElementById(
            "banner"
        );

        const container = document.querySelector(
            '[data-preview-container="banner"]'
        );

        if (campoRemover) {
            campoRemover.value = "1";
        }

        if (campoBanner) {
            campoBanner.value = "";
        }

        if (container) {
            container.innerHTML = `
                <div class="imagem-placeholder">
                    <i class="bi bi-image"></i>
                    <span>O banner será removido ao salvar</span>
                </div>
            `;
        }

        botaoRemover.disabled = true;
    });

    const nome = document.getElementById("nome");
    const previewNome = document.querySelector(
        "[data-preview-store-name]"
    );
    const previewCores = document.querySelector(
        "[data-config-preview]"
    );
    const corPrimaria = document.getElementById(
        "cor_primaria"
    );
    const corSecundaria = document.getElementById(
        "cor_secundaria"
    );

    function atualizarCores() {
        if (previewCores) {
            previewCores.style.setProperty(
                "--preview-primary",
                corPrimaria?.value || "#0d6efd"
            );

            previewCores.style.setProperty(
                "--preview-secondary",
                corSecundaria?.value || "#212529"
            );
        }

        if (previewNome) {
            previewNome.textContent =
                nome?.value.trim() ||
                "Nome da loja";
        }
    }

    document
        .querySelectorAll("[data-color-picker]")
        .forEach((seletor) => {
            seletor.addEventListener("input", () => {
                const campoTexto = document.getElementById(
                    seletor.dataset.colorTarget
                );

                if (campoTexto) {
                    campoTexto.value = seletor.value;
                }

                atualizarCores();
            });
        });

    document
        .querySelectorAll("[data-color-text]")
        .forEach((campo) => {
            campo.addEventListener("input", () => {
                const valor = campo.value.trim();

                if (/^#[0-9a-fA-F]{6}$/.test(valor)) {
                    const seletor =
                        document.getElementById(
                            campo.dataset.colorTarget
                        );

                    if (seletor) {
                        seletor.value = valor;
                    }

                    atualizarCores();
                }
            });
        });

    nome?.addEventListener(
        "input",
        atualizarCores
    );

    atualizarCores();

    const descricao = document.getElementById(
        "descricao"
    );

    const contador = document.querySelector(
        "[data-description-count]"
    );

    function contarDescricao() {
        if (contador) {
            contador.textContent = String(
                descricao?.value.length || 0
            );
        }
    }

    descricao?.addEventListener(
        "input",
        contarDescricao
    );

    contarDescricao();

    formulario.addEventListener("submit", () => {
        const botaoSalvar = formulario.querySelector(
            "[data-submit-config]"
        );

        if (!botaoSalvar) {
            return;
        }

        botaoSalvar.disabled = true;
        botaoSalvar.innerHTML = `
            <i class="bi bi-arrow-repeat"></i>
            Ajustando e salvando imagens...
        `;
    });
})();

