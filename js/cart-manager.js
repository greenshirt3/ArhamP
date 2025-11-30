// 
// File: js/cart-manager.js
// Core logic for managing the shopping cart state and UI interactions.
//

const Cart = (() => {
    let cartItems = JSON.parse(localStorage.getItem('arhamPrintersCart')) || [];
    let currentDeliveryType = 'HomeDelivery';
    let currentShippingZone = 'Within City';
    let currentPaymentMethod = 'CashOnDelivery';
    
    const WHATSAPP_NUMBER = '923006238233'; 

    // --- Configuration (Duplicated for standalone manager access) ---
    const LOCAL_FREE_SHIPPING_THRESHOLD = 3000;
    const SHIPPING_RATES = {
        'small': { 'Within City': 100, 'Same Province': 347, 'Cross Province': 359 },
        'medium': { 'Within City': 100, 'Same Province': 529, 'Cross Province': 541 },
        'overland': { 'Within City': 150, 'Same Province': 1254, 'Cross Province': 1254 }
    };

    const CITY_TO_ZONE = {
        "jalalpur jattan": "Within City", "gujrat": "Same Province", "gujranwala": "Same Province", 
        "lahore": "Same Province", "sialkot": "Same Province", "rawalpindi": "Same Province", 
        "multan": "Same Province", "faisalabad": "Same Province", "karachi": "Cross Province",
        "islamabad": "Cross Province", "peshawar": "Cross Province", "quetta": "Cross Province",
        "sukkur": "Cross Province"
    };
    
    const LOCAL_DELIVERY_COST = 100; // Flat local rate

    // ----------------------------------------------------
    // --- STATE MANAGEMENT AND PERSISTENCE ---
    // ----------------------------------------------------

    const saveCart = () => {
        localStorage.setItem('arhamPrintersCart', JSON.stringify(cartItems));
        updateCartDisplay();
    };

    const calculateCartTotals = () => {
        let subtotal = 0;
        let totalWeightGroup = 'small'; // Determine the highest cost weight group
        
        cartItems.forEach(item => {
            subtotal += item.finalItemPrice; 
            const itemWeightGroup = getShippingPacketType(item.productName);
            
            if (itemWeightGroup === 'overland') {
                totalWeightGroup = 'overland';
            } else if (itemWeightGroup === 'medium' && totalWeightGroup !== 'overland') {
                totalWeightGroup = 'medium';
            }
        });

        let shippingCost = 0;
        let shippingNote = '';

        if (currentDeliveryType === 'SelfPickUp') {
            shippingCost = 0;
            shippingNote = 'Self Pick Up. No shipping charges.';
        } else {
            // Home Delivery Logic
            if (currentShippingZone === 'Within City') {
                // Flat local rate for JLP Home Delivery
                shippingCost = SHIPPING_RATES[totalWeightGroup]['Within City'];
                shippingNote = `Local Delivery (Jalalpur Jattan). Flat rate for ${totalWeightGroup.toUpperCase()} zone.`;
            } else {
                // PostEx rates for outside JLP
                shippingCost = SHIPPING_RATES[totalWeightGroup][currentShippingZone] || SHIPPING_RATES[totalWeightGroup]['Cross Province'];
                shippingNote = `Courier to ${currentShippingZone}. Based on ${totalWeightGroup.toUpperCase()} zone.`;
            }
        }

        const grandTotal = subtotal + shippingCost;

        return {
            subtotal: Math.round(subtotal),
            shippingCost: Math.round(shippingCost),
            grandTotal: Math.round(grandTotal),
            shippingNote: shippingNote,
            weightGroup: totalWeightGroup
        };
    };

    // ----------------------------------------------------
    // --- UI RENDERING ---
    // ----------------------------------------------------

    const updateCartDisplay = () => {
        const cartList = document.getElementById('cart-items-list');
        const emptyMsg = document.getElementById('empty-cart-message');
        const cartCountBadge = document.getElementById('cart-count');
        const desktopCartCount = document.getElementById('desktop-cart-count');
        const continueShoppingBtn = document.getElementById('continue-shopping-btn');

        if (cartCountBadge) cartCountBadge.textContent = cartItems.length;
        if (desktopCartCount) desktopCartCount.textContent = cartItems.length;

        if (cartItems.length === 0) {
            if (cartList) cartList.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (continueShoppingBtn) continueShoppingBtn.textContent = "Start Shopping";
        } else {
            if (emptyMsg) emptyMsg.style.display = 'none';
            if (continueShoppingBtn) continueShoppingBtn.textContent = "Continue Shopping";
            
            const listHtml = cartItems.map((item, index) => {
                const optionsHtml = Object.entries(item.options)
                    .map(([key, value]) => `<li>${key}: ${value}</li>`)
                    .join('');

                return `
                    <div class="list-group-item d-flex align-items-center mb-3 p-3 border-bottom shadow-sm">
                        <div class="flex-shrink-0 me-3">
                            <img src="${item.imageFile}" alt="${item.productName}" class="img-fluid rounded" style="width: 60px; height: 60px; object-fit: cover;">
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="mb-1">${item.productName}</h5>
                            <small class="text-muted">${item.isAreaBased ? 'Area-Based' : 'Standard'} | Unit Price: PKR ${(item.finalItemPrice / item.quantity).toFixed(2)}</small>
                            <ul class="list-unstyled small mt-1 mb-0">${optionsHtml}</ul>
                        </div>
                        <div class="d-flex align-items-center flex-column flex-md-row">
                            <div class="d-flex me-3 my-2 my-md-0">
                                <button class="btn btn-outline-secondary btn-sm rounded-0" onclick="Cart.updateQuantity(${index}, -1)">-</button>
                                <input type="number" value="${item.quantity}" min="1" onchange="Cart.updateQuantity(${index}, 0, this.value)" class="form-control form-control-sm text-center rounded-0" style="width: 60px;">
                                <button class="btn btn-outline-secondary btn-sm rounded-0" onclick="Cart.updateQuantity(${index}, 1)">+</button>
                            </div>
                            <span class="fw-bold me-3 text-primary">PKR ${item.finalItemPrice.toLocaleString('en-PK')}</span>
                            <button class="btn btn-sm btn-danger rounded-0" onclick="Cart.removeItem(${index})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
            if (cartList) cartList.innerHTML = listHtml;
        }

        updateSummaryDisplay();
    };

    const updateSummaryDisplay = () => {
        const totals = calculateCartTotals();
        
        if (document.getElementById('cart-subtotal')) {
            document.getElementById('cart-item-count').textContent = cartItems.length;
            document.getElementById('cart-subtotal').textContent = `PKR ${totals.subtotal.toLocaleString('en-PK')}`;
            document.getElementById('cart-delivery-cost').textContent = totals.shippingCost === 0 ? "FREE" : `PKR ${totals.shippingCost.toLocaleString('en-PK')}`;
            document.getElementById('cart-grand-total').textContent = `PKR ${totals.grandTotal.toLocaleString('en-PK')}`;
            
            // Checkout page totals
            if (document.getElementById('checkout-grand-total')) {
                document.getElementById('checkout-grand-total').textContent = `PKR ${totals.grandTotal.toLocaleString('en-PK')}`;
            }

            // Delivery Type UI update on cart/checkout page
            const homeCard = document.getElementById('checkout-delivery-home');
            const pickupCard = document.getElementById('checkout-delivery-pickup');
            const zoneSelector = document.getElementById('checkout-shipping-zone-selector');
            const addressGroup = document.getElementById('checkout-address-group');
            
            if (homeCard) homeCard.classList.toggle('selected', currentDeliveryType === 'HomeDelivery');
            if (pickupCard) pickupCard.classList.toggle('selected', currentDeliveryType === 'SelfPickUp');
            
            if (zoneSelector) zoneSelector.style.display = currentDeliveryType === 'HomeDelivery' ? 'block' : 'none';
            
            // Required address only for Home Delivery
            if (addressGroup) {
                 const addressInput = document.getElementById('checkout-address');
                 if (currentDeliveryType === 'SelfPickUp') {
                     addressInput.required = false;
                     addressInput.placeholder = "Full Address (Optional for Pick Up)";
                 } else {
                     addressInput.required = true;
                     addressInput.placeholder = "Full Shipping Address (Required)";
                 }
            }
            
            // Update location display
            const zoneDisplay = document.getElementById('checkout-zone-name');
            if (zoneDisplay) {
                zoneDisplay.textContent = `${currentShippingZone}`;
                zoneDisplay.classList.remove('text-success', 'text-warning', 'text-danger');
                zoneDisplay.classList.add(currentShippingZone === 'Within City' ? 'text-success' : (currentShippingZone === 'Same Province' ? 'text-warning' : 'text-danger'));
            }
        }
    };

    // ----------------------------------------------------
    // --- PUBLIC API METHODS ---
    // ----------------------------------------------------

    const addItem = (item) => {
        // Simple check for now, can be expanded to group identical items
        cartItems.push(item);
        saveCart();
        showAlert(`${item.productName} added to cart! Total items: ${cartItems.length}`, 'success');
    };

    const removeItem = (index) => {
        cartItems.splice(index, 1);
        saveCart();
    };

    const updateQuantity = (index, change = 0, manualValue = null) => {
        let newQuantity;
        if (manualValue !== null) {
            newQuantity = parseInt(manualValue);
        } else {
            newQuantity = cartItems[index].quantity + change;
        }

        newQuantity = Math.max(1, newQuantity);
        
        // Re-calculate price for the item with the new quantity
        const item = cartItems[index];
        const unitPrice = item.finalItemPrice / item.quantity;
        item.quantity = newQuantity;
        item.finalItemPrice = unitPrice * newQuantity; // Simplistic update assuming fixed unit price per option set
        
        cartItems[index] = item;
        saveCart();
    };
    
    const setDeliveryType = (type) => {
        currentDeliveryType = type;
        if (type === 'SelfPickUp') {
            currentShippingZone = 'Within City'; 
        }
        updateSummaryDisplay();
    };

    const setPaymentMethod = (method) => {
        currentPaymentMethod = method;
    };
    
    // --- Shipping/Zone Logic (Copied from gopro/gowed) ---
    const getShippingPacketType = (productName) => {
        if (productName.includes('Card') || productName.includes('Print') || productName.includes('Sticker')) return 'small';
        if (productName.includes('Letterpad') || productName.includes('Bill Book') || productName.includes('T-Shirt') || productName.includes('Mug') || productName.includes('Pen')) return 'medium';
        if (productName.includes('Banner') || productName.includes('Wallpaper') || productName.includes('Frame')) return 'overland';
        return 'small'; 
    };
    
    const updateShippingZone = (cityName) => {
        const normalizedCity = cityName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
        let zone = 'Cross Province'; 
        
        if (CITY_TO_ZONE[normalizedCity]) {
            zone = CITY_TO_ZONE[normalizedCity];
        } else {
            if (cityName.toLowerCase().includes('lahore') || cityName.toLowerCase().includes('gujrat')) {
                 zone = 'Same Province';
            }
        }
        
        currentShippingZone = zone;
        updateSummaryDisplay(); 
    };

    const manualLocationCheck = () => {
        const cityInput = document.getElementById('checkout-input-city').value.trim();
        if (cityInput.length > 2) {
             updateShippingZone(cityInput);
        } else {
             // Reset to default JLP if input is cleared
             updateShippingZone('Jalalpur Jattan');
        }
    };

    // ----------------------------------------------------
    // --- CHECKOUT SUBMISSION ---
    // ----------------------------------------------------
    
    const handleCheckoutSubmission = (e) => {
        e.preventDefault();
        
        if (cartItems.length === 0) {
            showAlert('Your cart is empty. Please add items to proceed.', 'error');
            return;
        }

        const totals = calculateCartTotals();
        const name = document.getElementById('checkout-name').value;
        const phone = document.getElementById('checkout-phone').value;
        const address = document.getElementById('checkout-address').value || 'N/A (Self Pick Up)';
        const email = document.getElementById('checkout-email').value || 'N/A';
        
        // Final WhatsApp message generation
        let message = `*NEW WEB ORDER - #${Date.now().toString().slice(-6)}*\n\n`;
        message += `*Customer:* ${name}\n`;
        message += `*Phone:* ${phone}\n`;
        message += `*Email:* ${email}\n`;
        message += `*Delivery Type:* ${currentDeliveryType} (${currentShippingZone})\n`;
        if (currentDeliveryType === 'HomeDelivery') {
             message += `*Shipping Address:* ${address}\n`;
        }
        message += `*Payment:* ${currentPaymentMethod}\n\n`;

        message += `*--- Order Items (${cartItems.length}) ---*\n`;
        cartItems.forEach((item, index) => {
            message += `${index + 1}. *${item.productName}*\n`;
            message += `   Qty: ${item.quantity} | Total: PKR ${item.finalItemPrice.toLocaleString('en-PK')}\n`;
            message += `   Options: ${Object.entries(item.options).map(([k, v]) => `${k}:${v}`).join(', ')}\n`;
        });
        
        message += `\n*--- Summary ---*\n`;
        message += `*Subtotal:* PKR ${totals.subtotal.toLocaleString('en-PK')}\n`;
        message += `*Delivery:* ${totals.shippingCost === 0 ? 'FREE' : 'PKR ' + totals.shippingCost.toLocaleString('en-PK')}\n`;
        message += `*Grand Total:* PKR ${totals.grandTotal.toLocaleString('en-PK')}\n\n`;
        message += `_Please confirm this order, payment method, and final delivery details._`;
        
        // Open WhatsApp
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
        
        // Clear cart after successful redirection/submission initiation
        cartItems = [];
        saveCart();
        
        showAlert('Order initiated! Please complete your order details on WhatsApp.', 'success');
        showSection('home');
    };


    // Helper for general alerts (copied from original files)
    const showAlert = (message, type) => {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '300px';
        alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(alert);
        setTimeout(() => { if (alert.parentNode) alert.parentNode.removeChild(alert); }, 5000);
    };


    // ----------------------------------------------------
    // --- INITIALIZATION ---
    // ----------------------------------------------------
    
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize the cart count on load
        updateCartDisplay();
        
        // Initialize delivery type selector listeners on cart/checkout
        const homeCard = document.getElementById('checkout-delivery-home');
        const pickupCard = document.getElementById('checkout-delivery-pickup');
        const cityInput = document.getElementById('checkout-input-city');
        
        if (homeCard) homeCard.onclick = () => setDeliveryType('HomeDelivery');
        if (pickupCard) pickupCard.onclick = () => setDeliveryType('SelfPickUp');
        if (cityInput) cityInput.oninput = manualLocationCheck;
        
        // Initialize payment selector listeners on checkout
        const cod = document.getElementById('payment-cod');
        const bank = document.getElementById('payment-bank');
        if (cod) cod.onclick = () => setPaymentMethod('CashOnDelivery');
        if (bank) bank.onclick = () => setPaymentMethod('BankTransfer');

        // Set initial state of selectors
        setDeliveryType('HomeDelivery');
        setPaymentMethod('CashOnDelivery');
    });

    return {
        addItem,
        removeItem,
        updateQuantity,
        setDeliveryType,
        setPaymentMethod,
        manualLocationCheck,
        handleCheckoutSubmission,
        calculateCartTotals,
        showAlert,
    };
})();
