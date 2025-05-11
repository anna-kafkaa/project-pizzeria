/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: "#template-menu-product",
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  
   // ✅ Klasa Product
  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();   
      thisProduct.processOrder();   

      console.log('new Product:', thisProduct);
  }

  renderInMenu() {
    const thisProduct = this;
      // 1. Wygeneruj HTML produktu
      const generatedHTML = templates.menuProduct(thisProduct.data);

      // 2. Zamień HTML na element DOM
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      // 3. Dodaj produkt do kontenera
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);
    }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
  }

  initAccordion() {
    const thisProduct = this;

    thisProduct.accordionTrigger.addEventListener('click', function(event) {
      event.preventDefault();

      const activeProduct = document.querySelector(select.all.menuProductsActive);

      if (activeProduct && activeProduct !== thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }

      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm() {
  const thisProduct = this;

  thisProduct.form.addEventListener('submit', function(event){
    event.preventDefault();
    thisProduct.processOrder();
  });

  for(let input of thisProduct.formInputs){
    input.addEventListener('change', function(){
      thisProduct.processOrder();
    });
  }

  thisProduct.cartButton.addEventListener('click', function(event){
    event.preventDefault();
    thisProduct.processOrder();
  });
}

  processOrder() {
    const thisProduct = this;

    console.log('processOrder triggered for', thisProduct.id);
  }
}

  // ✅ Obiekt app
  const app = {
    initData: function(){
      const thisApp = this;

      thisApp.data = dataSource;
    },

    initMenu: function(){
      const thisApp = this;

      console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    init: function(){
      const thisApp = this;

      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();   // najpierw dane
      thisApp.initMenu();   // potem tworzymy produkty
    },
  };

  app.init();
}
