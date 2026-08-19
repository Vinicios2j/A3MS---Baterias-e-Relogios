/* =========================================
   A3MS - SCRIPT.JS DEFINITIVO (CORRIGIDO)
   Sistema de atacado/varejo automático (>= 5 un)
========================================= */

/* =========================================
   PRODUTOS (IDs ÚNICOS)
========================================= */

const products = [
    {
        id: 1,
        name: "Cartela Bateria 364",
        category: "Baterias",
        image: "364.jpg",
        wholesaleCard: 9.00,
        wholesalePix: 8.00,
        retailCard: 25.00,
        retailPix: 15.00,
        icon: "🔋"
    },
    {
        id: 2,
        name: "Cartela Bateria 377",
        category: "Baterias",
        image: "377.jpg",
        wholesaleCard: 9.00,
        wholesalePix: 8.00,
        retailCard: 25.00,
        retailPix: 15.00,
        icon: "🔋"
    },
    {
        id: 3,
        name: "Cartela Bateria 395",
        category: "Baterias",
        image: "395.jpg",
        wholesaleCard: 10.00,
        wholesalePix: 9.00,
        retailCard: 28.00,
        retailPix: 18.00,
        icon: "🔋"
    },
    {
        id: 4,
        name: "Cartela Bateria 2032",
        category: "Baterias",
        image: "2032.jpg",
        wholesaleCard: 5.00,
        wholesalePix: 4.00,
        retailCard: 10.00,
        retailPix: 7.00,
        icon: "🔋"
    },
    {
        id: 5,
        name: "Cartela Bateria 2025",
        category: "Baterias",
        image: "2025.jpg",
        wholesaleCard: 5.00,
        wholesalePix: 4.00,
        retailCard: 10.00,
        retailPix: 7.00,
        icon: "🔋"
    },
    {
        id: 6,
        name: "Cartela Bateria 2016",
        category: "Baterias",
        image: "2016.jpg",
        wholesaleCard: 5.00,
        wholesalePix: 4.00,
        retailCard: 10.00,
        retailPix: 7.00,
        icon: "🔋"
    },
    {
        id: 7,
        name: "Pilha AAA",
        category: "Pilhas",
        image: "aaa.jpg",
        wholesaleCard: 3.00,
        wholesalePix: 2.50,
        retailCard: 5.00,
        retailPix: 4.00,
        icon: "⚡"
    },
    {
        id: 8,
        name: "Pilha AA",
        category: "Pilhas",
        image: "aa.jpg",
        wholesaleCard: 3.00,
        wholesalePix: 2.50,
        retailCard: 5.00,
        retailPix: 4.00,
        icon: "⚡"
    },
    {
        id: 9,
        name: "Relógio A3MS Clássico",
        category: "Relógios",
        image: "relogio-classico.jpg",
        wholesaleCard: 35.00,
        wholesalePix: 30.00,
        retailCard: 69.90,
        retailPix: 59.90,
        icon: "⌚"
    },
    {
        id: 10,
        name: "Pulseira para Relógio",
        category: "Acessórios",
        image: "pulseira.jpg",
        wholesaleCard: 10.00,
        wholesalePix: 8.00,
        retailCard: 20.00,
        retailPix: 15.00,
        icon: "⌚"
    }
];

/* =========================================
   CARRINHO
========================================= */

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
   ADICIONAR AO CARRINHO (BLindado contra ID trocado)
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
            icon: product.icon,
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
   VARIÁVEL DE FORMA DE PAGAMENTO (Nenhuma selecionada inicialmente)
========================================= */
let selectedPaymentMethod = null; // Começa sem seleção

/* =========================================
   ATUALIZAR CARRINHO E APLICAR ATACADO GERAL (TOTAL >= 5)
========================================= */

function updateCart() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const isGlobalWholesale = totalItems >= 5;

    // Se nenhuma forma foi escolhida ainda, calcula temporariamente com base no Pix só para exibir um valor base, ou R$ 0,00 se preferir. Vamos usar o Pix como padrão de exibição inicial até ele escolher.
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

    cartCount.textContent = totalItems;
    cartTotal.textContent = formatPrice(totalPrice);

    if (cart.length === 0) {
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
        
        document.getElementById("paymentSelectionContainer").style.display = "none";
        return;
    }

    document.getElementById("paymentSelectionContainer").style.display = "block";

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

/* =========================================
   SELEÇÃO DE PAGAMENTO (SEM SELEÇÃO PRÉVIA)
========================================= */

function setPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    const btnPix = document.getElementById("payPixBtn");
    const btnCartao = document.getElementById("payCardBtn");

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
   CHECKOUT WHATSAPP COM VALIDAÇÃO DE PAGAMENTO
========================================= */

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio.");
        return;
    }

    // Validação se o usuário escolheu a forma de pagamento
    if (!selectedPaymentMethod) {
        showToast("⚠️ Escolha entre Pix/Dinheiro ou Cartão!");
        return;
    }

    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const isGlobalWholesale = totalItems >= 5;
    const paymentName = selectedPaymentMethod === 'cartao' ? 'Cartão' : 'Pix / Dinheiro';

    let message = `Olá! Gostaria de fazer um pedido na A3MS:%0A`;
    message += `💳 *Forma de Pagamento:* ${paymentName}%0A%0A`;

    cart.forEach(item => {
        let activePrice = selectedPaymentMethod === 'cartao' 
            ? (isGlobalWholesale ? item.wholesaleCard : item.retailCard)
            : (isGlobalWholesale ? item.wholesalePix : item.retailPix);

        const subtotal = activePrice * item.quantity;
        message += `• ${item.quantity}x ${item.name} (${isGlobalWholesale ? 'Atacado' : 'Varejo'}) - ${formatPrice(subtotal)}%0A`;
    });

    const total = cart.reduce((sum, item) => {
        let activePrice = selectedPaymentMethod === 'cartao' 
            ? (isGlobalWholesale ? item.wholesaleCard : item.retailCard)
            : (isGlobalWholesale ? item.wholesalePix : item.retailPix);
        return sum + (activePrice * item.quantity);
    }, 0);

    message += `%0A*Total Geral (${paymentName}): ${formatPrice(total)}*`;
    window.open(`https://wa.me/5511999999999?text=${message}`, "_blank");
});

/* =========================================
   EVENTOS DOS BOTÕES DE COMPRA
========================================= */

openCartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// Delegação de cliques para garantir que qualquer botão funcione perfeitamente
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

const filters = document.querySelectorAll(".filter");
const productCards = document.querySelectorAll(".product-card");

filters.forEach(filter => {
    filter.addEventListener("click", () => {
        filters.forEach(item => item.classList.remove("active"));
        filter.classList.add("active");
        const selectedCategory = filter.dataset.filter;

        productCards.forEach(card => {
            const cardCategory = card.dataset.category;
            if (selectedCategory === "todos" || cardCategory === selectedCategory) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });
    });
});

document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
        const category = card.dataset.category;
        const filter = document.querySelector(`.filter[data-filter="${category}"]`);
        if (filter) filter.click();
        document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
    });
});

openSearch.addEventListener("click", () => {
    searchOverlay.classList.add("active");
    setTimeout(() => searchInput.focus(), 100);
});

closeSearch.addEventListener("click", () => {
    searchOverlay.classList.remove("active");
    searchInput.value = "";
    searchResults.innerHTML = "";
});

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
            <strong>${product.icon} ${product.name}</strong>
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

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCart();
        searchOverlay.classList.remove("active");
        mobileMenu.classList.remove("active");
        searchInput.value = "";
        searchResults.innerHTML = "";
    }
});

menuButton.addEventListener("click", () => mobileMenu.classList.toggle("active"));

document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", () => mobileMenu.classList.remove("active"));
});

/* =========================================
   CHECKOUT WHATSAPP COM TRAVA ABSOLUTA
========================================= */

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Seu carrinho está vazio.");
        return;
    }

    // TRAVA RIGOROSA: Se não escolheu Pix ou Cartão, barra na hora e NÃO vai pro WhatsApp
    if (!selectedPaymentMethod) {
        showToast("⚠️ Escolha entre Pix/Dinheiro ou Cartão antes de finalizar!");
        return;
    }

    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const isGlobalWholesale = totalItems >= 5;
    const paymentName = selectedPaymentMethod === 'cartao' ? 'Cartão' : 'Pix / Dinheiro';

    let message = `Olá! Gostaria de fazer um pedido na A3MS:%0A`;
    message += `💳 *Forma de Pagamento:* ${paymentName}%0A%0A`;

    cart.forEach(item => {
        let activePrice = selectedPaymentMethod === 'cartao' 
            ? (isGlobalWholesale ? item.wholesaleCard : item.retailCard)
            : (isGlobalWholesale ? item.wholesalePix : item.retailPix);

        const subtotal = activePrice * item.quantity;
        message += `• ${item.quantity}x ${item.name} (${isGlobalWholesale ? 'Atacado' : 'Varejo'}) - ${formatPrice(subtotal)}%0A`;
    });

    const total = cart.reduce((sum, item) => {
        let activePrice = selectedPaymentMethod === 'cartao' 
            ? (isGlobalWholesale ? item.wholesaleCard : item.retailCard)
            : (isGlobalWholesale ? item.wholesalePix : item.retailPix);
        return sum + (activePrice * item.quantity);
    }, 0);

    message += `%0A*Total Geral (${paymentName}): ${formatPrice(total)}*`;
    window.open(`https://wa.me/5521990440544?text=${message}`, "_blank");
});

/* =========================================
   TOAST
========================================= */

let toastTimeout;
function showToast(message) {
    const toastMessage = toast.querySelector("p");
    toastMessage.textContent = message;
    toast.classList.add("active");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("active"), 2500);
}

/* =========================================
   INICIALIZAÇÃO
========================================= */
updateCart();