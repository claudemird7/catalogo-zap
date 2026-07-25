const produtos = [

{

nome:"Nike Air Max",

preco:399.90,

imagem:"https://picsum.photos/400/300?1"

},

{

nome:"Adidas Run",

preco:299.90,

imagem:"https://picsum.photos/400/300?2"

},

{

nome:"Puma Sport",

preco:279.90,

imagem:"https://picsum.photos/400/300?3"

},

{

nome:"Olympikus",

preco:199.90,

imagem:"https://picsum.photos/400/300?4"

}

];

const area=document.getElementById("produtos");

produtos.forEach(produto=>{

area.innerHTML+=`

<div class="col-md-4">

<div class="card">

<img src="${produto.imagem}">

<div class="card-body">

<h5>${produto.nome}</h5>

<h4 class="text-success">

R$ ${produto.preco.toFixed(2)}

</h4>

<button class="btn btn-success w-100">

Adicionar ao carrinho

</button>

</div>

</div>

</div>

`;

});