const $ = (s, c = document) => c.querySelector(s),
  $$ = (s, c = document) => [...c.querySelectorAll(s)],
  money = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let cart = [];
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
