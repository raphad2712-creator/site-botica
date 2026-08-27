const $ = (s, c = document) => c.querySelector(s),
  $$ = (s, c = document) => [...c.querySelectorAll(s)],
  money = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let cart = [];
const productDetails = {
  "Creatina Monohidratada 300g": {
    description: "Suplemento alimentar de creatina monohidratada em pó, sem sabor, apresentado em embalagem de 300 g.",
    items: ["Creatina monohidratada em pó", "Embalagem demonstrativa de 300 g", "Sem adição de açúcar"],
    usage: "O modo de uso deve seguir o rótulo do produto ou a orientação de nutricionista ou médico.",
  },
  "Whey Protein Concentrado 900g": {
    description: "Suplemento proteico em pó à base de proteína concentrada do soro do leite, em embalagem demonstrativa de 900 g.",
    items: ["Proteína do soro do leite", "Produto em pó", "Sabor baunilha demonstrativo"],
    usage: "A quantidade e o horário de consumo devem seguir o rótulo e a orientação de nutricionista.",
  },
  "Melatonina em Gotas 20ml": {
    description: "Suplemento alimentar de melatonina em gotas, apresentado apenas como exemplo de produto da categoria Sono.",
    items: ["Frasco conta-gotas de 20 ml", "Apresentação líquida", "Produto demonstrativo"],
    usage: "Utilize somente conforme as instruções do rótulo e orientação profissional. Não exceda a recomendação diária.",
  },
  "Floral Rescue 30ml": {
    description: "Composto floral em frasco conta-gotas de 30 ml, apresentado como demonstração da linha de florais.",
    items: ["Frasco de 30 ml", "Conta-gotas", "Linha floral demonstrativa"],
    usage: "O uso deve ser individualizado e seguir a orientação do profissional responsável.",
  },
  "Vitamina B12 1000mcg": {
    description: "Suplemento alimentar de vitamina B12 em apresentação demonstrativa de cápsulas.",
    items: ["Vitamina B12", "Apresentação em cápsulas", "Embalagem demonstrativa"],
    usage: "Consuma conforme a recomendação do rótulo ou orientação de nutricionista ou médico.",
  },
  "Vitamina D3 2000 UI": {
    description: "Suplemento alimentar de vitamina D3 em cápsulas, apresentado como exemplo da linha de vitaminas.",
    items: ["Vitamina D3", "Apresentação em cápsulas", "Produto demonstrativo"],
    usage: "A suplementação deve seguir a recomendação do rótulo e a avaliação de um profissional de saúde.",
  },
  "Psyllium 200g": {
    description: "Fibra alimentar de psyllium em pó, apresentada em embalagem demonstrativa de 200 g.",
    items: ["Fonte de fibra alimentar", "Produto em pó", "Embalagem de 200 g"],
    usage: "Consuma com bastante líquido e siga o modo de uso do rótulo. Procure orientação profissional quando necessário.",
  },
  "Sérum de Vitamina C 30ml": {
    description: "Sérum facial cosmético com vitamina C, em frasco demonstrativo de 30 ml para a rotina de cuidados com a pele.",
    items: ["Uso facial", "Frasco de 30 ml", "Textura sérum"],
    usage: "Aplique conforme as instruções do rótulo. Faça teste de sensibilidade e suspenda o uso em caso de irritação.",
  },
};

const detailOverlay = document.createElement("div");
detailOverlay.className = "overlay center product-overlay";
detailOverlay.innerHTML = '<section class="product-detail"><button class="close">×</button><div class="detail-photo"><div class="jar detail-jar"><i></i><b>BOTICA</b><small></small></div></div><div class="detail-copy"><small class="detail-category"></small><h2></h2><p class="detail-description"></p><div class="detail-price"><strong></strong><span>Preço demonstrativo</span></div><ul></ul><div class="usage"><b>Modo de uso e cuidados</b><p></p></div><div class="purchase-row"><div class="quantity"><button class="minus">−</button><b>1</b><button class="plus">+</button></div><button class="detail-buy">ADICIONAR AO CARRINHO</button></div><p class="demo-note">Produto e preço exibidos somente para demonstração.</p></div></section>';
document.body.append(detailOverlay);
let detailProduct = null;
let detailQuantity = 1;

function openProduct(card) {
  const info = productDetails[card.dataset.name];
  detailProduct = { name: card.dataset.name, area: card.dataset.area, price: Number(card.dataset.price) };
  detailQuantity = 1;
  $(".detail-category", detailOverlay).textContent = `${card.dataset.category} • ${card.dataset.area}`;
  $(".detail-copy h2", detailOverlay).textContent = card.dataset.name;
  $(".detail-description", detailOverlay).textContent = info.description;
  $(".detail-price strong", detailOverlay).textContent = money(detailProduct.price);
  $(".detail-jar small", detailOverlay).textContent = card.dataset.category;
  $(".detail-photo", detailOverlay).className = `detail-photo ${$(".photo", card).classList[1] || "p1"}`;
  $(".detail-copy ul", detailOverlay).innerHTML = info.items.map((item) => `<li>${item}</li>`).join("");
  $(".usage p", detailOverlay).textContent = info.usage;
  $(".quantity b", detailOverlay).textContent = "1";
  detailOverlay.classList.add("open");
}

$(".close", detailOverlay).onclick = () => detailOverlay.classList.remove("open");
detailOverlay.onclick = (event) => { if (event.target === detailOverlay) detailOverlay.classList.remove("open"); };
$(".minus", detailOverlay).onclick = () => { detailQuantity = Math.max(1, detailQuantity - 1); $(".quantity b", detailOverlay).textContent = detailQuantity; };
$(".plus", detailOverlay).onclick = () => { detailQuantity += 1; $(".quantity b", detailOverlay).textContent = detailQuantity; };
$(".detail-buy", detailOverlay).onclick = () => {
  cart.push(...Array(detailQuantity).fill(detailProduct));
  render();
  detailOverlay.classList.remove("open");
  $(".cart-overlay").classList.add("open");
};
window.addEventListener("load", () =>
  setTimeout(() => $(".splash").classList.add("hide"), 1200),
);
function toast(msg) {
  const t = $(".toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t.timer);
  t.timer = setTimeout(() => t.classList.remove("show"), 2600);
}
function render() {
  const list = $(".cart-list");
  list.innerHTML = "";
  cart.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `<span>${p.name}</span><b>${money(p.price)}</b><button>×</button>`;
    row.querySelector("button").onclick = () => {
      cart.splice(i, 1);
      render();
    };
    list.append(row);
  });
  $(".cart-count").textContent = cart.length;
  $(".empty").style.display = cart.length ? "none" : "block";
  $(".total").style.display = $(".finish").style.display = cart.length
    ? "flex"
    : "none";
  $(".total b").textContent = money(cart.reduce((s, p) => s + p.price, 0));
}
$$(".buy").forEach(
  (btn) =>
    (btn.onclick = () => {
      const c = btn.closest(".card");
      cart.push({
        name: c.dataset.name,
        area: c.dataset.area,
        price: Number(c.dataset.price),
      });
      render();
      $(".cart-overlay").classList.add("open");
    }),
);
$$('.card').forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.insertAdjacentHTML('beforeend', '<span class="see-product">VER DETALHES</span>');
  card.addEventListener('click', (event) => {
    if (!event.target.closest('.buy') && !event.target.closest('.photo > button')) openProduct(card);
  });
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') openProduct(card);
  });
});
$(".cart-open").onclick = () => $(".cart-overlay").classList.add("open");
$(".login-open").onclick = () => $(".login-overlay").classList.add("open");
$$(".overlay").forEach((o) => {
  o.onclick = (e) => {
    if (e.target === o) o.classList.remove("open");
  };
  $(".close", o).onclick = () => o.classList.remove("open");
});
$(".hamb").onclick = () => $(".nav").classList.toggle("open");
$$(".nav a").forEach(
  (a) => (a.onclick = () => $(".nav").classList.remove("open")),
);
$("#cep").oninput = (e) => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 8);
  e.target.value = v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v;
};
$("#calculate").onclick = () => {
  $(".shipping-result").textContent =
    $("#cep").value.replace(/\D/g, "").length === 8
      ? "Entrega padrão: R$ 18,90 • 3 a 7 dias úteis"
      : "Digite um CEP válido";
};
$(".rx-form").onsubmit = (e) => {
  e.preventDefault();
  toast("Receita selecionada para orçamento");
};
$(".login form").onsubmit = (e) => {
  e.preventDefault();
  $(".login-overlay").classList.remove("open");
  toast("Login realizado com sucesso");
};
$(".newsletter form").onsubmit = (e) => {
  e.preventDefault();
  toast("E-mail cadastrado com sucesso");
};
$(".finish").onclick = () => toast("Checkout demonstrativo aberto");

function filterProducts(category) {
  $$(".card").forEach((card) => {
    card.style.display =
      category === "Todos" || card.dataset.category === category
        ? "block"
        : "none";
  });
  $(".catalog-title").textContent =
    category === "Todos" ? "Todos os produtos" : category;
  $$("[data-filter]").forEach((button) =>
    button.classList.toggle("active", button.dataset.filter === category),
  );
}

$$("[data-filter]").forEach((button) => {
  button.onclick = () => {
    filterProducts(button.dataset.filter);
    $("#produtos").scrollIntoView({ behavior: "smooth" });
  };
});

$(".show-all").onclick = () => filterProducts("Todos");

const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        scrollObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -35px" },
);

$$(".scroll-reveal").forEach((section) => scrollObserver.observe(section));
render();
