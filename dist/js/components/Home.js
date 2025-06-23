import { templates, select, classNames } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initActions();
    thisHome.initCarousel();
  }

  render(element) {
    const thisHome = this;

    const generatedHTML = templates.home();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;

    thisHome.dom.orderBox = thisHome.dom.wrapper.querySelector('.home__order');
    thisHome.dom.bookBox = thisHome.dom.wrapper.querySelector('.home__booking');

  }

  initActions() {
    const thisHome = this;

    thisHome.dom.orderBox.addEventListener('click', () => {
      window.location.hash = '#/order';
    });

    thisHome.dom.bookBox.addEventListener('click', () => {
      window.location.hash = '#/booking';
    });
  }

  initCarousel() {
    const thisHome = this;

    const carousel = thisHome.dom.wrapper.querySelector('.carousel');

    // TinySlider lub Flickity – przykład z Flickity:
    new Flickity(carousel, {
      cellAlign: 'left',
      contain: true,
      autoPlay: 3000,
      wrapAround: true,
    });
  }
}

export default Home;
