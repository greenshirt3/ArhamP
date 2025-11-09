(function ($) {
    "use strict";

    // --- EXISTING ARHAM PRINTERS SITE LOGIC ---

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
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.nav-bar').addClass('sticky-top shadow-sm');
        } else {
            $('.nav-bar').removeClass('sticky-top shadow-sm');
        }
    });


    // Hero Header carousel
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
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:2
            },
            1200:{
                items:3
            }
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
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            },
            1200:{
                items:4
            }
        }
    });



    // Product Quantity
    $('.quantity button').on('click', function () {
        var button = $(this);
        var oldValue = button.parent().parent().find('input').val();
        if (button.hasClass('btn-plus')) {
            var newVal = parseFloat(oldValue) + 1;
        } else {
            if (oldValue > 0) {
                var newVal = parseFloat(oldValue) - 1;
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


    // --- NEW PRINT ORDER LOGIC ---
    
    const WHATSAPP_NUMBER = '923006238233'; // Your WhatsApp Number (NO plus or spaces)

    // Wait for the document to be fully ready
    $(document).ready(function() {
        // Check if the current page is the print order form by looking for the form ID
        if ($('#printOrderForm').length) {
            initializePrintOrderForm();
        }
    });

    function initializePrintOrderForm() {
        // Set the current year in the footer
        var currentYearElement = $('#currentYear');
        if (currentYearElement.length) {
            currentYearElement.text(new Date().getFullYear());
        }

        // Set the unique order ID
        var orderIdInput = $('#orderId');
        if (orderIdInput.length) {
            orderIdInput.val(generateOrderId());
        }
        
        // Calculate and display initial price
        updatePrice();
        
        // Attach listener to update price whenever an option changes
        $('#printOrderForm').on('change', updatePrice);
    }

    // Function to generate a unique, user-facing order ID
    function generateOrderId() {
        var timestamp = new Date().getTime().toString().slice(-6);
        var random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return 'P-' + timestamp + '-' + random;
    }

    // Function to update the estimated price based on selections
    function updatePrice() {
        // This is a client-side PLACEHOLDER for visual feedback only.
        
        var quantityInput = $('#quantity');
        if (!quantityInput.length) return;

        var quantity = parseInt(quantityInput.val()) || 1;
        var size = $('input[name="size"]:checked').val() || 'A4';
        var color = $('input[name="color"]:checked').val() || 'B&W';
        
        // Base rate logic (simplified for placeholder)
        var baseRate = (size === 'A4') ? 0.15 : 0.35; // Base price per sheet
        if (color === 'Colour') {
            baseRate *= 3; // Color costs more
        }
        
        var fixedFee = 2.50; // Standard service fee
        var calculatedPrice = (baseRate * quantity) + fixedFee; 
        
        var totalPriceElement = $('#totalPrice');
        if (totalPriceElement.length) {
            totalPriceElement.text('£' + calculatedPrice.toFixed(2));
        }
    }

    // --- WhatsApp Submission Handler ---
    window.handlePrintOrderSubmission = function(e) {
        e.preventDefault();

        // 1. Collect all data
        var orderId = $('#orderId').val();
        var customerName = $('#customerName').val();
        var customerEmail = $('#customerEmail').val() || 'N/A';
        var totalPrice = $('#totalPrice').text();

        var printDetails = {
            'ID': orderId,
            'Name': customerName,
            'Email': customerEmail,
            'Colour': $('input[name="color"]:checked').val(),
            'Siding': $('input[name="siding"]:checked').val(),
            'Size': $('input[name="size"]:checked').val(),
            'Paper Type': $('#paperType').val(),
            'Quantity': $('#quantity').val(),
            'Binding': $('#binding').val(),
            'Lamination': $('input[name="lamination"]:checked').val()
        };

        // 2. Construct the WhatsApp Message
        var message = `*NEW ARHAM PRINT ORDER (WEB)* 🚀\n`;
        message += `-------------------------------------------\n`;
        message += `*Order ID:* ${printDetails.ID}\n`;
        message += `*Customer:* ${printDetails.Name}\n`;
        message += `*Email:* ${printDetails.Email}\n`;
        message += `-------------------------------------------\n`;
        message += `*ORDER DETAILS:*\n`;
        message += `\n*Colour:* ${printDetails.Colour}`;
        message += `\n*Siding:* ${printDetails.Siding}`;
        message += `\n*Size:* ${printDetails.Size}`;
        message += `\n*Paper:* ${printDetails['Paper Type']}`;
        message += `\n*Quantity:* ${printDetails.Quantity} copies`;
        message += `\n*Binding:* ${printDetails.Binding}`;
        message += `\n*Lamination:* ${printDetails.Lamination}`;
        message += `\n\n*EST. PRICE:* ${totalPrice}`;
        message += `\n-------------------------------------------\n`;
        message += `*ACTION REQUIRED:* Please reply to this message with your DOCUMENT/PHOTO FILES attached immediately to confirm and proceed with printing!`;


        // 3. Encode and Redirect
        var whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');
    }

})(jQuery);
