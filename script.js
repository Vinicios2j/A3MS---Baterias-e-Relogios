/* =========================================
   A3MS - SCRIPT.JS DINÂMICO (API WIO.DB)
   Mantém todas as funções originais + produtos da API
========================================= */

let products = []; // Array que receberá os dados da API
let cart = JSON.parse(localStorage.getItem("a3ms_cart")) || [];

/* =========================================
   ELEMENTOS
========================================= */

const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const openCartButton = document.getElementById("openCart");
const closeCartButton = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const searchOverlay = document.getElementById("searchOverlay");
const openSearch = document.getElementById("openSearch");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const toast = document.getElementById("toast");
const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");

/* =========================================
   FUNÇÕES DE APOIO
========================================= */

function formatPrice(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function saveCart() {
    localStorage.setItem("a3ms_cart", JSON.stringify(cart));
}

function openCart() {
    cartSidebar.classList.add("active");
    cartOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    cartSidebar.classList.remove("active");
    cartOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

/* =========================================
   BUSCAR PRODUTOS DA API E RENDERIZAR NA HOME (APENAS OS 4 PRIMEIROS)
========================================= */

async function fetchAndRenderProducts() {
    try {
        const response = await fetch('https://1aff-201-7-215-23.ngrok-free.app/api/products'); //http://localhost:3000/api/products
        if (!response.ok) throw new Error("Erro ao buscar produtos da API");
        
        products = await response.json();
        
        // Pega apenas os primeiros 4 produtos do array para mostrar na Home
        const featuredProducts = products.slice(0, 4);
        
        renderProductCards(featuredProducts);
    } catch (error) {
        console.error("Erro:", error);
        const grid = document.getElementById("productsGrid");
        if (grid) {
            grid.innerHTML = `<p style="text-align:center; color:red; grid-column: 1/-1;">Erro ao carregar os produtos do servidor. Verifique se a API está rodando.</p>`;
        }
    }
}

function renderProductCards(productsList) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (productsList.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">Nenhum produto cadastrado no momento.</p>`;
        return;
    }

    grid.innerHTML = productsList.map(product => `
        <article class="product-card" data-category="${product.category.toLowerCase()}" data-name="${product.name}">
            <div class="product-image" style="position: relative; overflow: hidden; height: 200px; background: #f3f4f6;">
                <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://via.placeholder.com/200?text=A3MS'">
                <button class="quick-add" data-id="${product.id}" title="Adicionar Rápido">+</button>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="product-bottom">
                    <div class="price-container">
                        <div class="price-type">
                            <small>Varejo</small>
                            <div class="price-box">
                                <span class="price-card">Cartão: ${formatPrice(product.retailCard)}</span>
                                <span class="price-pix">Pix: <strong>${formatPrice(product.retailPix)}</strong></span>
                            </div>
                        </div>
                        <div class="price-type">
                            <small>Atacado (5+ un)</small>
                            <div class="price-box">
                                <span class="price-card">Cartão: ${formatPrice(product.wholesaleCard)}</span>
                                <span class="price-pix">Pix: <strong>${formatPrice(product.wholesalePix)}</strong></span>
                            </div>
                        </div>
                    </div>
                    <button class="add-cart" data-id="${product.id}">Comprar</button>
                </div>
            </div>
        </article>
    `).join("");
}

/* =========================================
   ADICIONAR AO CARRINHO
========================================= */

function addToCart(id) {
    const productId = Number(id);
    const product = products.find(item => item.id === productId);
    
    if (!product) {
        console.error("Produto não encontrado para o ID:", productId);
        return;
    }

    const existingProduct = cart.find(item => item.id === productId);

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            category: product.category,
            icon: "📦",
            quantity: 1,
            retailPix: product.retailPix,
            retailCard: product.retailCard,
            wholesalePix: product.wholesalePix,
            wholesaleCard: product.wholesaleCard
        });
    }

    saveCart();
    updateCart();
    showToast(`${product.name} adicionado!`);
    openCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== Number(id));
    saveCart();
    updateCart();
}

function changeQuantity(id, amount) {
    const productId = Number(id);
    const product = cart.find(item => item.id === productId);
    if (!product) return;

    product.quantity += amount;

    if (product.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }

    saveCart();
    updateCart();
}

/* =========================================
   VARIÁVEL DE FORMA DE PAGAMENTO
========================================= */
let selectedPaymentMethod = null;

/* =========================================
   ATUALIZAR CARRINHO E ATACADO GERAL (>= 5)
========================================= */

function updateCart() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const isGlobalWholesale = totalItems >= 5;

    const paymentMode = selectedPaymentMethod || 'pix';

    const totalPrice = cart.reduce((total, item) => {
        let activePrice;
        if (paymentMode === 'cartao') {
            activePrice = isGlobalWholesale ? item.wholesaleCard : item.retailCard;
        } else {
            activePrice = isGlobalWholesale ? item.wholesalePix : item.retailPix;
        }
        return total + (activePrice * item.quantity);
    }, 0);

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);

    if (cart.length === 0) {
        if (cartItems) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h3>Seu carrinho está vazio</h3>
                    <p>Adicione produtos para começar sua compra.</p>
                    <button class="btn btn-primary" id="continueShopping">Continuar comprando</button>
                </div>
            `;
            const continueButton = document.getElementById("continueShopping");
            if (continueButton) continueButton.addEventListener("click", closeCart);
        }
        
        const paymentContainer = document.getElementById("paymentSelectionContainer");
        if (paymentContainer) paymentContainer.style.display = "none";
        return;
    }

    const paymentContainer = document.getElementById("paymentSelectionContainer");
    if (paymentContainer) paymentContainer.style.display = "block";

    if (cartItems) {
        cartItems.innerHTML = cart.map(item => {
            let activePrice;
            if (paymentMode === 'cartao') {
                activePrice = isGlobalWholesale ? item.wholesaleCard : item.retailCard;
            } else {
                activePrice = isGlobalWholesale ? item.wholesalePix : item.retailPix;
            }

            const itemSubtotal = activePrice * item.quantity;
            const itensFaltantesParaAtacado = Math.max(0, 5 - totalItems);

            return `
                <div class="cart-item">
                    <div class="cart-item-image">${item.icon}</div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatPrice(activePrice)} un (${paymentMode === 'cartao' ? 'Cartão' : 'Pix/Dinheiro'})</p>
                        
                        ${isGlobalWholesale ? `
                            <div style="background: #dcfce7; color: #166534; font-size: 9px; font-weight: 700; padding: 3px 6px; border-radius: 4px; margin: 4px 0; display: inline-block;">
                                🔥 Atacado Geral Ativado! (5+ un)
                            </div>
                        ` : `
                            <p style="font-size: 9px; color: #6b7280; margin-top: 2px;">
                                Faltam ${itensFaltantesParaAtacado} un para o Atacado em tudo!
                            </p>
                        `}

                        <div class="quantity-controls">
                            <button onclick="changeQuantity(${item.id}, -1)">−</button>
                            <span>${item.quantity}</span>
                            <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; justify-content: space-between;">
                        <strong style="font-size: 12px;">${formatPrice(itemSubtotal)}</strong>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">Remover</button>
                    </div>
                </div>
            `;
        }).join("");
    }
}

/* =========================================
   SELEÇÃO DE PAGAMENTO
========================================= */

function setPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    const btnPix = document.getElementById("payPixBtn");
    const btnCartao = document.getElementById("payCardBtn");

    if (!btnPix || !btnCartao) return;

    if (method === 'pix') {
        btnPix.style.background = "#16a34a";
        btnPix.style.color = "#fff";
        btnPix.style.borderColor = "#16a34a";
        
        btnCartao.style.background = "#f3f4f6";
        btnCartao.style.color = "#374151";
        btnCartao.style.borderColor = "#d1d5db";
    } else {
        btnCartao.style.background = "#16a34a";
        btnCartao.style.color = "#fff";
        btnCartao.style.borderColor = "#16a34a";
        
        btnPix.style.background = "#f3f4f6";
        btnPix.style.color = "#374151";
        btnPix.style.borderColor = "#d1d5db";
    }

    updateCart();
}

/* =========================================
   CHECKOUT WHATSAPP
========================================= */

const checkoutButton = document.getElementById('checkoutButton');
if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        if (!selectedPaymentMethod) {
            alert("Por favor, selecione a forma de pagamento (Pix/Dinheiro ou Cartão) antes de continuar.");
            return;
        }

        const totalItens = cart.reduce((sum, item) => sum + item.quantity, 0);
        const isGlobalWholesale = totalItens >= 5;
        const tipoPedido = isGlobalWholesale ? "Atacado" : "Varejo";
        const formaPagamentoTexto = selectedPaymentMethod === 'pix' ? 'Pix / Dinheiro' : 'Cartão';

        let produtosTexto = "";
        let valorTotalGeral = 0;

        cart.forEach(item => {
            produtosTexto += `${item.quantity} x ${item.name}\n`;
            
            let activePrice;
            if (selectedPaymentMethod === 'cartao') {
                activePrice = isGlobalWholesale ? item.wholesaleCard : item.retailCard;
            } else {
                activePrice = isGlobalWholesale ? item.wholesalePix : item.retailPix;
            }

            valorTotalGeral += activePrice * item.quantity;
        });

        let mensagem = `Olá, estou solicitando um orçamento no *${tipoPedido}*\n\n`;
        mensagem += `Produtos:\n${produtosTexto}\n`;
        mensagem += `Forma de pagamento: *${formaPagamentoTexto}*\n\n`;
        
        const totalFormatado = valorTotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        mensagem += `Total: *${totalFormatado}*`;

        const mensagemCodificada = encodeURIComponent(mensagem);
        const numeroWhatsApp = "5521990440544";
        const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensagemCodificada}`;
        
        window.open(urlWhatsApp, '_blank');
    });
}

/* =========================================
   EVENTOS DOS BOTÕES DE COMPRA (DELEGATION)
========================================= */

if (openCartButton) openCartButton.addEventListener("click", openCart);
if (closeCartButton) closeCartButton.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

document.addEventListener("click", event => {
    const button = event.target.closest(".add-cart, .quick-add");
    if (button) {
        const id = button.dataset.id;
        if (id) {
            addToCart(id);
        }
    }
});

/* =========================================
   FILTROS, BUSCA E MENU
========================================= */

// Delegação de eventos para os filtros (necessário já que os cards vêm dinâmicos da API)
document.addEventListener("click", event => {
    const filterBtn = event.target.closest(".filter");
    if (filterBtn) {
        document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
        filterBtn.classList.add("active");
        const selectedCategory = filterBtn.dataset.filter;

        document.querySelectorAll(".product-card").forEach(card => {
            const cardCategory = card.dataset.category;
            if (selectedCategory === "todos" || cardCategory === selectedCategory) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });
    }
});

document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
        const category = card.dataset.category;
        const filter = document.querySelector(`.filter[data-filter="${category}"]`);
        if (filter) filter.click();
        const produtosSecao = document.getElementById("produtos");
        if (produtosSecao) produtosSecao.scrollIntoView({ behavior: "smooth" });
    });
});

if (openSearch) {
    openSearch.addEventListener("click", () => {
        searchOverlay.classList.add("active");
        setTimeout(() => searchInput.focus(), 100);
    });
}

if (closeSearch) {
    closeSearch.addEventListener("click", () => {
        searchOverlay.classList.remove("active");
        searchInput.value = "";
        searchResults.innerHTML = "";
    });
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            searchResults.innerHTML = "";
            return;
        }

        const results = products.filter(product => 
            product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query)
        );

        if (results.length === 0) {
            searchResults.innerHTML = `<div class="no-results">Nenhum produto encontrado.</div>`;
            return;
        }

        searchResults.innerHTML = results.map(product => `
            <div class="search-result" data-search-id="${product.id}">
                <strong>📦 ${product.name}</strong>
                <span>${formatPrice(product.retailPix)}</span>
            </div>
        `).join("");

        document.querySelectorAll(".search-result").forEach(result => {
            result.addEventListener("click", () => {
                addToCart(result.dataset.searchId);
                searchOverlay.classList.remove("active");
                searchInput.value = "";
                searchResults.innerHTML = "";
            });
        });
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCart();
        if (searchOverlay) searchOverlay.classList.remove("active");
        if (mobileMenu) mobileMenu.classList.remove("active");
        if (searchInput) searchInput.value = "";
        if (searchResults) searchResults.innerHTML = "";
    }
});

if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => mobileMenu.classList.toggle("active"));
}

document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", () => {
        if (mobileMenu) mobileMenu.classList.remove("active");
    });
});

/* =========================================
   TOAST
========================================= */

let toastTimeout;
function showToast(message) {
    if (!toast) return;
    const toastMessage = toast.querySelector("p");
    if (toastMessage) toastMessage.textContent = message;
    toast.classList.add("active");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("active"), 2500);
}

/* =========================================
   INICIALIZAÇÃO DA APLICAÇÃO
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProducts(); // Busca os produtos da API e preenche o grid
    updateCart();            // Inicializa o carrinho
});
