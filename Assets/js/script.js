'use strict';

/*
  --------------------------------------------------
  # ANONYMOUS E-COMMERCE THEME BASE JAVASCRIPT
  (Used for mobile menus, overlays, and accordion features)
  --------------------------------------------------
*/

// modal variables (if used)
const modal = document.querySelector('[data-modal]');
const modalCloseBtn = document.querySelector('[data-modal-close]');
const modalCloseOverlay = document.querySelector('[data-modal-overlay]');

const modalCloseFunc = function () { 
  if (modal) modal.classList.add('closed'); 
}

if (modalCloseOverlay) modalCloseOverlay.addEventListener('click', modalCloseFunc);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', modalCloseFunc);


// mobile menu variables
const mobileMenuOpenBtn = document.querySelectorAll('[data-mobile-menu-open-btn]');
const mobileMenu = document.querySelectorAll('[data-mobile-menu]');
const mobileMenuCloseBtn = document.querySelectorAll('[data-mobile-menu-close-btn]');
const overlay = document.querySelector('[data-overlay]');

for (let i = 0; i < mobileMenuOpenBtn.length; i++) {

  // mobile menu function
  const mobileMenuCloseFunc = function () {
    mobileMenu[i].classList.remove('active');
    overlay.classList.remove('active');
  }

  mobileMenuOpenBtn[i].addEventListener('click', function () {
    mobileMenu[i].classList.add('active');
    overlay.classList.add('active');
  });

  mobileMenuCloseBtn[i].addEventListener('click', mobileMenuCloseFunc);
  overlay.addEventListener('click', mobileMenuCloseFunc);

}


// accordion variables
const accordionBtn = document.querySelectorAll('[data-accordion-btn]');
const accordion = document.querySelectorAll('[data-accordion]');

for (let i = 0; i < accordionBtn.length; i++) {

  accordionBtn[i].addEventListener('click', function () {

    const clickedBtn = this.nextElementSibling.classList.contains('active');

    for (let j = 0; j < accordion.length; j++) {

      if (clickedBtn) break;

      if (accordion[j].classList.contains('active')) {

        accordion[j].classList.remove('active');
        accordionBtn[j].classList.remove('active');

      }

    }

    this.nextElementSibling.classList.toggle('active');
    this.classList.toggle('active');

  });

}


/*
  --------------------------------------------------
  # ARHAM PRINTERS PRICE CALCULATOR LOGIC
  (Combined from original embedded script)
  --------------------------------------------------
*/

// Printing categories data
const categories = {
  "Printing": {
    "Business Cards": {
      "Standard Business Card": {
        basePrice: 500,
        unit: "per 100 cards",
        priceTiers: [
          { min: 1, max: 100, price: 500 },
          { min: 101, max: 500, price: 450 },
          { min: 501, max: 1000, price: 400 }
        ]
      },
      "Premium Business Card": {
        basePrice: 800,
        unit: "per 100 cards",
        priceTiers: [
          { min: 1, max: 100, price: 800 },
          { min: 101, max: 500, price: 700 },
          { min: 501, max: 1000, price: 600 }
        ]
      }
    },
    "Flyers": {
      "A4 Flyer": {
        basePrice: 300,
        unit: "per 100 flyers",
        priceTiers: [
          { min: 1, max: 100, price: 300 },
          { min: 101, max: 500, price: 250 },
          { min: 501, max: 1000, price: 200 }
        ]
      },
      "A5 Flyer": {
        basePrice: 200,
        unit: "per 100 flyers",
        priceTiers: [
          { min: 1, max: 100, price: 200 },
          { min: 101, max: 500, price: 180 },
          { min: 501, max: 1000, price: 150 }
        ]
      }
    }
  },
  "Photocopy": {
    "Black & White": {
      "A4 B&W": {
        basePrice: 5,
        unit: "per page",
        priceTiers: [
          { min: 1, max: 10, price: 5 },
          { min: 11, max: 50, price: 4 },
          { min: 51, max: 100, price: 3.5 }
        ]
      },
      "A3 B&W": {
        basePrice: 10,
        unit: "per page",
        priceTiers: [
          { min: 1, max: 10, price: 10 },
          { min: 11, max: 50, price: 9 },
          { min: 51, max: 100, price: 8 }
        ]
      }
    },
    "Color": {
      "A4 Color": {
        basePrice: 20,
        unit: "per page",
        priceTiers: [
          { min: 1, max: 10, price: 20 },
          { min: 11, max: 50, price: 18 },
          { min: 51, max: 100, price: 15 }
        ]
      },
      "A3 Color": {
        basePrice: 40,
        unit: "per page",
        priceTiers: [
          { min: 1, max: 10, price: 40 },
          { min: 11, max: 50, price: 35 },
          { min: 51, max: 100, price: 30 }
        ]
      }
    }
  }
};

// --- Event Listeners for Calculator Fields ---

document.addEventListener('DOMContentLoaded', function() {
    const mainCategorySelect = document.getElementById('mainCategory');
    const subCategorySelect = document.getElementById('subCategory');
    const itemNameSelect = document.getElementById('itemName');

    // Initialize Main Category Listener
    if (mainCategorySelect) {
        mainCategorySelect.addEventListener('change', function() {
            const mainCategory = this.value;
            subCategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
            
            if (mainCategory && categories[mainCategory]) {
                for (const subcategory in categories[mainCategory]) {
                    const option = document.createElement('option');
                    option.value = subcategory;
                    option.textContent = subcategory;
                    subCategorySelect.appendChild(option);
                }
            }
            itemNameSelect.innerHTML = '<option value="">Select Item</option>';
        });
    }

    // Initialize Subcategory Listener
    if (subCategorySelect) {
        subCategorySelect.addEventListener('change', function() {
            const mainCategory = mainCategorySelect.value;
            const subCategory = this.value;
            itemNameSelect.innerHTML = '<option value="">Select Item</option>';
            
            if (mainCategory && subCategory && categories[mainCategory] && categories[mainCategory][subCategory]) {
                for (const item in categories[mainCategory][subCategory]) {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    itemNameSelect.appendChild(option);
                }
            }
        });
    }
});


// --- Calculator Core Functions (now Global) ---

window.calculatePrice = function() {
  const mainCategory = document.getElementById('mainCategory').value;
  const subCategory = document.getElementById('subCategory').value;
  const itemName = document.getElementById('itemName').value;
  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  const designCharges = parseFloat(document.getElementById('designCharges').value) || 0;
  
  if (!mainCategory || !subCategory || !itemName) {
    alert('Please select a category, subcategory, and item.');
    return;
  }
  
  if (!categories[mainCategory] || !categories[mainCategory][subCategory] || 
      !categories[mainCategory][subCategory][itemName]) {
    alert('Selected item not found.');
    return;
  }
  
  const item = categories[mainCategory][subCategory][itemName];
  let unitPrice = item.basePrice;
  
  // Check if quantity falls within any price tier
  if (item.priceTiers && item.priceTiers.length > 0) {
    for (const tier of item.priceTiers) {
      if (quantity >= tier.min && quantity <= tier.max) {
        unitPrice = tier.price;
        break;
      }
    }
  }
  
  const itemCost = unitPrice * quantity;
  const total = itemCost + designCharges;
  
  // Display result
  const resultContent = document.getElementById('resultContent');
  resultContent.innerHTML = `
    <p><strong>Item:</strong> ${itemName}</p>
    <p><strong>Quantity:</strong> ${quantity} ${item.unit}</p>
    <p><strong>Unit Price:</strong> Rs. ${unitPrice.toFixed(2)}</p>
    <p><strong>Design Charges:</strong> Rs. ${designCharges.toFixed(2)}</p>
    <p><strong>Total Price:</strong> Rs. ${total.toFixed(2)}</p>
  `;
  
  document.getElementById('calculatorResult').style.display = 'block';
}

window.clearCalculator = function() {
  document.getElementById('mainCategory').value = '';
  document.getElementById('subCategory').innerHTML = '<option value="">Select Subcategory</option>';
  document.getElementById('itemName').innerHTML = '<option value="">Select Item</option>';
  document.getElementById('quantity').value = 1;
  document.getElementById('designCharges').value = 0;
  document.getElementById('calculatorResult').style.display = 'none';

  // Trigger change event to clear subcategory (if necessary, though logic handles it)
  document.getElementById('mainCategory').dispatchEvent(new Event('change'));
}
