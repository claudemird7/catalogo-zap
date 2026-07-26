const produtos = [
    {
        id: 1,
        nome: "New Balance Rebel",
        referencia: "0081",
        categoria: "Tênis",
        marca: "New Balance",
        precoAntigo: 180,
        precoAtual: 140,
        descricao: "Tênis confortável e leve para uso diário.",
        imagens: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=85"
        ],
        cores: [
            { nome: "Preto", valor: "#111111" },
            { nome: "Cinza", valor: "#8c8c8c" },
            { nome: "Vermelho", valor: "#c62828" }
        ],
        tamanhos: ["37", "38", "39", "40", "41", "42"]
    },
    {
        id: 2,
        nome: "Adizero Evo SL",
        referencia: "0082",
        categoria: "Tênis",
        marca: "Adidas",
        precoAntigo: 180,
        precoAtual: 150,
        descricao: "Modelo esportivo com ótimo amortecimento.",
        imagens: [
            "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=85"
        ],
        cores: [
            { nome: "Azul", valor: "#1565c0" },
            { nome: "Laranja", valor: "#ef6c00" },
            { nome: "Branco", valor: "#f5f5f5" }
        ],
        tamanhos: ["36", "37", "38", "39", "40", "41", "42"]
    },
    {
        id: 3,
        nome: "Air Force 1",
        referencia: "0083",
        categoria: "Tênis",
        marca: "Nike",
        precoAntigo: 120,
        precoAtual: 65,
        descricao: "Tênis casual clássico para diferentes combinações.",
        imagens: [
            "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1000&q=85"
        ],
        cores: [
            { nome: "Branco", valor: "#ffffff" },
            { nome: "Preto", valor: "#111111" }
        ],
        tamanhos: ["35", "36", "37", "38", "39", "40", "41"]
    },
    {
        id: 4,
        nome: "Prophecy 15",
        referencia: "0084",
        categoria: "Atacado",
        marca: "Mizuno",
        precoAntigo: 120,
        precoAtual: 75,
        descricao: "Modelo esportivo com visual moderno e ótimo conforto.",
        imagens: [
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85",
            "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1000&q=85"
        ],
        cores: [
            { nome: "Branco e vermelho", valor: "#f5f5f5" },
            { nome: "Preto", valor: "#111111" },
            { nome: "Cinza", valor: "#777777" }
        ],
        tamanhos: ["38", "39", "40", "41", "42", "43"]
    }
];

exports.home = (req, res) => {
    res.render("catalogo/index", {
        titulo: "Catálogo Zap"
    });
};

exports.detalhes = (req, res) => {
    const id = Number(req.params.id);

    const produto = produtos.find((item) => item.id === id);

    if (!produto) {
        return res.status(404).send("Produto não encontrado.");
    }

    return res.render("catalogo/produto", {
        titulo: produto.nome,
        produto
    });
};