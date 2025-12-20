// js/cart-manager.js

const Cart = {
    // 1. LOAD CART FROM COOKIE INSTEAD OF LOCALSTORAGE
    items: [],
    
    init() {
        this.items = this.getCookie('arham_cart') ? JSON.parse(this.getCookie('arham_cart')) : [];
        this.updateCartDisplay();
    },

    addItem(item) {
        this.items.push(item);
        this.save();
        this.updateCartDisplay();
        alert("Item added to cart!");
        if(typeof showSection === 'function') showSection('cart');
    },

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
        this.updateCartDisplay();
    },

    // 2. SAVE TO COOKIE WITH ROOT DOMAIN (The Magic Part)
    save() {
        const days = 7; // Cart expires in 7 days
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        
        // IMPORTANT: domain=.arhamprinters.pk allows all subdomains to see this cart
        document.cookie = "arham_cart=" + JSON.stringify(this.items) + ";" + expires + ";path=/;domain=.arhamprinters.pk;SameSite=Lax";
    },

    // Helper to read cookies
    getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    },

    updateCartDisplay() {
        const listContainer = document.getElementById('cart-items-list');
        const emptyMsg = document.getElementById('empty-cart-message');
        const countBadges = ['cart-count', 'desktop-cart-count', 'cart-item-count'];
        
        // Update badges safely
        countBadges.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = this.items.length;
        });

        // Calculate Totals
        const subtotal = this.items.reduce((sum, item) => sum + item.basePrice, 0);
        
        // Shipping Logic (Basic default, main page script handles specifics)
        let shipping = 0; 
        if (typeof currentDeliveryType !== 'undefined' && currentDeliveryType === 'HomeDelivery') {
            shipping = (subtotal > 3000 && typeof currentShippingZone !== 'undefined' && currentShippingZone === 'Within City') ? 0 : 350; 
        }

        // Update UI Text
        if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').textContent = `PKR ${subtotal.toLocaleString()}`;
        if (document.getElementById('cart-delivery-cost')) document.getElementById('cart-delivery-cost').textContent = shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`;
        if (document.getElementById('cart-grand-total')) document.getElementById('cart-grand-total').textContent = `PKR ${(subtotal + shipping).toLocaleString()}`;
        if (document.getElementById('checkout-grand-total')) document.getElementById('checkout-grand-total').textContent = `PKR ${(subtotal + shipping).toLocaleString()}`;
        
        // Render List
        if (!listContainer) return;

        if (this.items.length === 0) {
            listContainer.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        listContainer.innerHTML = this.items.map(item => {
            // Simplify options display
            let opts = "";
            if (item.options) {
                opts = Object.entries(item.options)
                    .map(([k,v]) => `<span class="badge bg-light text-dark border me-1">${v}</span>`)
                    .join('');
            }
            
            return `
            <div class="list-group-item p-3 border mb-2 shadow-sm rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-bold">${item.productName} <small class="text-muted">x${item.quantity}</small></h6>
                        <div class="mb-1">${opts}</div>
                        <span class="text-primary fw-bold">PKR ${item.basePrice.toLocaleString()}</span>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" onclick="Cart.removeItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    },

    // Helper functions called by checkout HTML
    setDeliveryType(type) {
        // Just triggers the UI update, actual logic is in the main file
        this.updateCartDisplay();
    },
    
    setPaymentMethod(method) {
        // Visual toggle for payment options
        document.getElementById('raast-qr-display').style.display = (method === 'RaastQR' ? 'block' : 'none');
    },

    manualLocationCheck() {
       // Handled by main script
    },

    handleCheckoutSubmission(e) {
        e.preventDefault();
        
        const name = document.getElementById('checkout-name').value;
        const phone = document.getElementById('checkout-phone').value;
        const address = document.getElementById('checkout-address').value;
        
        if(!name || !phone) { alert("Please fill in Name and Phone"); return; }

        let msg = `*NEW WEB ORDER*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n*ITEMS:*`;
        
        this.items.forEach(i => {
            msg += `\n- ${i.productName} (x${i.quantity}) - PKR ${i.basePrice}`;
            if(i.options) msg += ` [${Object.values(i.options).join(', ')}]`;
        });

        const total = document.getElementById('checkout-grand-total').innerText;
        msg += `\n\n*TOTAL: ${total}*`;

        const WHATSAPP_NUMBER = '923006238233';
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
        
        // Clear cart after order
        this.items = [];
        this.save();
        this.updateCartDisplay();
        window.location.reload();
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => Cart.init());
