/* ============================================================
   CART.JS — ZEALIMAN Drawer Panier
   À inclure dans TOUTES vos pages HTML (avant la fermeture de </body>)
   ============================================================ */

(function () {

    /* ──────────────────────────────────────────────
       1. INJECTION DU HTML DU DRAWER
    ────────────────────────────────────────────── */
    function injectDrawer() {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        overlay.id = 'cart-overlay';
        overlay.addEventListener('click', closeCart);
        document.body.appendChild(overlay);

        // Drawer
        const drawer = document.createElement('div');
        drawer.className = 'cart-drawer';
        drawer.id = 'cart-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-label', 'Votre panier');
        drawer.innerHTML = `
            <div class="cart-drawer-header">
                <div>
                    <span class="cart-drawer-title">Panier</span>
                    <span class="cart-drawer-count" id="drawer-count"></span>
                </div>
                <button class="cart-drawer-close" onclick="closeCart()" aria-label="Fermer le panier">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="cart-drawer-body" id="cart-drawer-body"></div>
            <div class="cart-drawer-footer" id="cart-drawer-footer" style="display:none">
                <div class="cart-subtotal-row">
                    <span class="cart-subtotal-label">Total</span>
                    <span class="cart-subtotal-amount" id="cart-subtotal">0 FCFA</span>
                </div>
                <p class="cart-shipping-note">Livraison calculée à l'étape suivante</p>
                <button class="cart-checkout-btn" onclick="commanderPanier()">
                    Commander →
                </button>
                <button class="cart-continue-btn" onclick="closeCart()">
                    Continuer les achats
                </button>
            </div>
        `;
        document.body.appendChild(drawer);
    }

    /* ──────────────────────────────────────────────
       2. ÉTAT DU PANIER (localStorage partagé)
    ────────────────────────────────────────────── */
    function getCart() {
        return JSON.parse(localStorage.getItem('zealiman-cart')) || [];
    }

    function saveCart(cart) {
        localStorage.setItem('zealiman-cart', JSON.stringify(cart));
    }

    /* ──────────────────────────────────────────────
       3. MISE À JOUR DU BADGE (icône header)
    ────────────────────────────────────────────── */
    function updateBadge() {
        const cart = getCart();
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        const badge = document.getElementById('cart-count');
        if (!badge) return;
        badge.textContent = total;
        badge.style.display = total === 0 ? 'none' : 'flex';
    }

    /* ──────────────────────────────────────────────
       4. RENDU DU CONTENU DU DRAWER
    ────────────────────────────────────────────── */
    function renderDrawer() {
        const cart = getCart();
        const body = document.getElementById('cart-drawer-body');
        const footer = document.getElementById('cart-drawer-footer');
        const countEl = document.getElementById('drawer-count');
        if (!body) return;

        const totalQty = cart.reduce((s, i) => s + i.qty, 0);

        // Nombre d'articles
        if (countEl) {
            countEl.textContent = totalQty > 0 ? `(${totalQty} article${totalQty > 1 ? 's' : ''})` : '';
        }

        if (cart.length === 0) {
            body.innerHTML = `
                <div class="cart-empty-state">
                    <i class="empty-icon">🛍️</i>
                    <p>Votre panier est vide.<br>Découvrez nos collections.</p>
                    <a href="./IMAGES/Collections.html" onclick="closeCart()">Explorer la boutique</a>
                </div>
            `;
            if (footer) footer.style.display = 'none';
            return;
        }

        // Liste des articles
        body.innerHTML = cart.map((item, index) => `
            <div class="cart-line-item" id="cart-item-${index}">
                <div class="cart-item-img-placeholder">🛏️</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${escHtml(item.name)}</div>
                    <div class="cart-item-unit-price">${formatPrice(item.price)} / unité</div>
                    <div class="cart-qty-control">
                        <button class="cart-qty-btn" onclick="changeDrawerQty(${index}, -1)">−</button>
                        <div class="cart-qty-num">${item.qty}</div>
                        <button class="cart-qty-btn" onclick="changeDrawerQty(${index}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <span class="cart-item-subtotal">${formatPrice(item.price * item.qty)}</span>
                    <button class="cart-item-remove" onclick="removeDrawerItem(${index})">Retirer</button>
                </div>
            </div>
        `).join('');

        // Total
        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const subtotalEl = document.getElementById('cart-subtotal');
        if (subtotalEl) subtotalEl.textContent = formatPrice(total);
        if (footer) footer.style.display = 'block';
    }

    /* ──────────────────────────────────────────────
       5. OUVRIR / FERMER LE DRAWER
    ────────────────────────────────────────────── */
    window.openCart = function () {
        renderDrawer();
        document.getElementById('cart-drawer')?.classList.add('open');
        document.getElementById('cart-overlay')?.classList.add('open');
        document.body.style.overflow = 'hidden'; // Bloque le scroll page
    };

    window.closeCart = function () {
        document.getElementById('cart-drawer')?.classList.remove('open');
        document.getElementById('cart-overlay')?.classList.remove('open');
        document.body.style.overflow = '';
    };

    /* ──────────────────────────────────────────────
       6. AJOUTER AU PANIER (remplace l'ancienne fonction)
    ────────────────────────────────────────────── */
    window.addToCart = function (name, price, btn) {
        const cart = getCart();
        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ name, price, qty: 1 });
        }
        saveCart(cart);
        updateBadge();

        // Animation badge
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.style.transform = 'scale(1.6)';
            setTimeout(() => badge.style.transform = 'scale(1)', 300);
        }

        // Feedback bouton (gère tous les types de boutons du projet)
        if (btn) {
            const originalText = btn.textContent.trim();
            const originalBg = btn.style.background;
            const originalColor = btn.style.color;

            // Bouton icône (arrow_forward)
            const icon = btn.querySelector?.('.material-symbols-outlined');
            if (icon) {
                icon.textContent = 'check';
                setTimeout(() => icon.textContent = 'arrow_forward', 1500);
            } else {
                // Bouton texte
                btn.textContent = '✓ Ajouté !';
                btn.style.background = '#091426';
                btn.style.color = 'white';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = originalBg;
                    btn.style.color = originalColor;
                }, 1500);
            }

            // Bouton "item" (suggestions)
            if (btn.classList?.contains('item')) {
                btn.style.opacity = '0.6';
                setTimeout(() => btn.style.opacity = '1', 800);
            }
        }

        // Ouvrir le drawer automatiquement après ajout
        openCart();
    };

    /* ──────────────────────────────────────────────
       7. MODIFIER LA QUANTITÉ DANS LE DRAWER
    ────────────────────────────────────────────── */
    window.changeDrawerQty = function (index, delta) {
        const cart = getCart();
        if (!cart[index]) return;
        cart[index].qty = Math.max(1, cart[index].qty + delta);
        saveCart(cart);
        updateBadge();
        renderDrawer();
    };

    /* ──────────────────────────────────────────────
       8. SUPPRIMER UN ARTICLE DU DRAWER
    ────────────────────────────────────────────── */
    window.removeDrawerItem = function (index) {
        const cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        updateBadge();
        renderDrawer();
    };

    /* ──────────────────────────────────────────────
       9. COMMANDER
    ────────────────────────────────────────────── */
    window.commanderPanier = function () {
        const cart = getCart();
        if (cart.length === 0) return;
        // Adaptez cette URL à votre page de commande
        const message = cart.map(i => `• ${i.name} × ${i.qty} = ${formatPrice(i.price * i.qty)}`).join('\n');
        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
        alert(`Récapitulatif de votre commande :\n\n${message}\n\nTOTAL : ${formatPrice(total)}\n\n(Connectez cette fonction à votre API de commande)`);
    };

    /* ──────────────────────────────────────────────
       10. CONNECTER LES ICÔNES PANIER DU HEADER
    ────────────────────────────────────────────── */
    function bindCartIcons() {
        // Sélectionne tous les .cart-wrapper présents sur la page
        document.querySelectorAll('.cart-wrapper').forEach(wrapper => {
            wrapper.style.cursor = 'pointer';
            wrapper.addEventListener('click', openCart);
        });
    }

    /* ──────────────────────────────────────────────
       11. TOUCHE ÉCHAP POUR FERMER
    ────────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeCart();
    });

    /* ──────────────────────────────────────────────
       12. UTILITAIRES
    ────────────────────────────────────────────── */
    function formatPrice(n) {
        return Number(n).toLocaleString('fr-CI') + ' FCFA';
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ──────────────────────────────────────────────
       13. INITIALISATION
    ────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        injectDrawer();
        bindCartIcons();
        updateBadge();
    });

})();