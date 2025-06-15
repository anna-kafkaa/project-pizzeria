import { settings, select } from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
  
  const app = {
    initData: function () {
  const thisApp = this;

  thisApp.data = {}; 

  const url = settings.db.url + '/' + settings.db.products;

  fetch(url)
    .then(function (rawResponse) {
      return rawResponse.json();
    })
    .then(function (parsedResponse) {
      console.log('parsedResponse', parsedResponse);

      // zapis danych do thisApp.data.products
      thisApp.data.products = parsedResponse;

      // uruchomienie initMenu po odebraniu danych
      thisApp.initMenu();
    });

  console.log('thisApp.data', JSON.stringify(thisApp.data)); 
},

    initMenu: function () {
      const thisApp = this;

      for (let productData of thisApp.data.products) {
        new Product(productData.id, productData);
      }
    },

    initCart: function () {
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu)
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    })
    },

    init: function () {
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();


