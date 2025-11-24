(function ($) {
    "use strict";

    // --- GLOBAL CONFIGURATION ---
    const WHATSAPP_NUMBER = '923006238233'; // Your WhatsApp Number (Used across all submission handlers)

    // Function to generate a unique, user-facing order ID
    function generateOrderId() {
        var timestamp = new Date().getTime().toString().slice(-6);
        var random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return 'P-' + timestamp + '-' + random;
    }

    // --- NEW CENTRALIZED MOBILE NAV LOGIC ---
    
    /**
     * Handles clicks on the mobile bottom navigation bar links.
     * @param {Event} e 
     */
    function handleMobileNavClick(e) {
        let target = e.target.closest('.mobile-nav-link, .mobile-nav-link-center');
        if (target) {
            // Stop processing if it's the dropdown toggle to allow the menu to open
            if (target.classList.contains('dropdown-toggle')) {
                return;
            }

            let linkId = target.id;
            if (linkId) {
                let linkType = linkId.replace('mobile-link-', '').replace('-center', '');
                
                // Special handling for hard links that leave the page
                if (linkType === 'products' || linkType === 'wedding' || linkType === 'home') {
                    // Let the default link action happen
                    return;
                }

                // For SPA navigation (Product Catalog, Quote, Contact)
                setActiveMobileNav(linkType);
            }
        }
    }

    /**
     * Sets the active state on the mobile bottom navigation bar.
     * @param {string} sectionName The ID suffix of the link (e.g., 'home', 'products', 'contact', 'wedding')
     */
    function setActiveMobileNav(sectionName) {
         // Clear all active classes on all relevant links
         document.querySelectorAll('#mobile-bottom-nav a.mobile-nav-link').forEach(link => {
             link.classList.remove('active');
         });
         
         // Logic to set the correct link as active
         if (sectionName === 'home' || sectionName === 'index') {
             document.getElementById('mobile-link-home')?.classList.add('active');
         } else if (sectionName === 'shop-catalog' || sectionName === 'products' || sectionName === 'product-detail') {
             document.getElementById('mobile-link-products')?.classList.add('active');
         } else if (sectionName === 'contact') {
             document.getElementById('mobile-link-contact')?.classList.add('active');
         } else if (sectionName === 'wedding') {
             document.getElementById('mobile-link-wedding')?.classList.add('active');
         }
         // Note: The Products link (in index.html) and Wedding link use hard links, but this ensures the active state is correct when switching.
    }

    // --- EXISTING ARHAM PRINTERS SITE LOGIC (LAYOUT & CAROUSELS) ---

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);
    
    // Initiate the wowjs
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.nav-bar').addClass('sticky-top shadow-sm');
        } else {
            $('.nav-bar').removeClass('sticky-top shadow-sm');
        }
    });


    // Hero Header carousel
    if ($.fn.owlCarousel) {
        $(".header-carousel").owlCarousel({
            items: 1,
            autoplay: true,
            smartSpeed: 2000,
            center: false,
            dots: false,
            loop: true,
            margin: 0,
            nav : true,
            navText : [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });


        // ProductList carousel
        $(".productList-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 2000,
            dots: false,
            loop: true,
            margin: 25,
            nav : true,
            navText : [
                '<i class="fas fa-chevron-left"></i>',
                '<i class="fas fa-chevron-right"></i>'
            ],
            responsiveClass: true,
            responsive: {
                0:{ items:1 },
                576:{ items:1 },
                768:{ items:2 },
                992:{ items:2 },
                1200:{ items:3 }
            }
        });

        // ProductList categories carousel
        $(".productImg-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            dots: false,
            loop: true,
            items: 1,
            margin: 25,
            nav : true,
            navText : [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });


        // Single Products carousel
        $(".single-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            dots: true,
            dotsData: true,
            loop: true,
            items: 1,
            nav : true,
            navText : [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });


        // ProductList carousel
        $(".related-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            dots: false,
            loop: true,
            margin: 25,
            nav : true,
            navText : [
                '<i class="fas fa-chevron-left"></i>',
                '<i class="fas fa-chevron-right"></i>'
            ],
            responsiveClass: true,
            responsive: {
                0:{ items:1 },
                576:{ items:1 },
                768:{ items:2 },
                992:{ items:3 },
                1200:{ items:4 }
            }
        });
    }

    // Product Quantity
    $('.quantity button').on('click', function () {
        var button = $(this);
        var oldValue = button.parent().parent().find('input').val();
        var newVal = 0;
        
        if (button.hasClass('btn-plus')) {
            newVal = parseFloat(oldValue) + 1;
        } else {
            if (oldValue > 0) {
                newVal = parseFloat(oldValue) - 1;
            } else {
                newVal = 0;
            }
        }
        button.parent().parent().find('input').val(newVal);
    });

    
    // Back to top button
    $(window).scroll(function () {
     if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
     } else {
        $('.back-to-top').fadeOut('slow');
     }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // --- NEW PRINT ORDER LOGIC (Copied from print-order.html for centralization, though currently unused) ---
    
    // Wait for the document to be fully ready
    $(document).ready(function() {
        // Set year in footer
        $('#currentYear').text(new Date().getFullYear());
        
        // Attach listener for mobile navigation
        document.getElementById('mobile-bottom-nav')?.addEventListener('click', handleMobileNavClick);
        
        // Determine initial active nav state based on URL
        const path = window.location.pathname;
        if (path.includes('products.html')) setActiveMobileNav('products');
        else if (path.includes('wedding.html')) setActiveMobileNav('wedding');
        else if (path.includes('print-order.html')) setActiveMobileNav('products'); // Treat as product context
        else setActiveMobileNav('home');
        
        
        // Attach universal handlers to forms in index.html (if they exist on this page)
        $('#quote-form').on('submit', handleQuoteSubmission);
        $('#contact-form-whatsapp').on('submit', handleContactSubmission);
    });

    function initializePrintOrderForm() {
        // Set the unique order ID
        var orderIdInput = $('#orderId');
        if (orderIdInput.length) {
            orderIdInput.val(generateOrderId());
        }
        
        // Note: updatePrice and other print-order specific functions were left in print-order.html 
        // as they rely on local variables and elements specific to that file.
    }


    // 2. Handler for the Get Custom Quote Form (index.html)
    function handleQuoteSubmission(e) {
        e.preventDefault();
        
        // Generate universal ID for tracking
        var orderId = generateOrderId();
        
        var name = $('#quote-name').val();
        var phone = $('#quote-phone').val();
        var product = $('#quote-product').val();
        var quantity = $('#quote-quantity').val();
        var details = $('#quote-details').val();
        
        var whatsappMessage = `*NEW ARHAM QUOTE REQUEST (WEB)*\n`;
        whatsappMessage += `*Order ID:* ${orderId}\n`;
        whatsappMessage += `*Customer:* ${name}\n`;
        whatsappMessage += `*Phone (Contact):* ${phone}\n`;
        whatsappMessage += `*Product Type:* ${product}\n`;
        whatsappMessage += `*Quantity/Area:* ${quantity}\n`;
        whatsappMessage += `*Specifications:* ${details}`;
        
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

        $('#quote-form').trigger('reset');
    }
    
    // 3. Handler for the Contact Form (index.html)
    function handleContactSubmission(e) {
        e.preventDefault();
        
        var name = $('#contact-name').val();
        var subject = $('#contact-subject').val();
        var message = $('#contact-message').val();

        var whatsappMessage = `*NEW ARHAM CONTACT MESSAGE (WEB)*\n`;
        whatsappMessage += `*Sender:* ${name}\n`;
        whatsappMessage += `*Subject:* ${subject}\n`;
        whatsappMessage += `*Message:* ${message}`;
        
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

        $('#contact-form-whatsapp').trigger('reset');
    }

})(jQuery);