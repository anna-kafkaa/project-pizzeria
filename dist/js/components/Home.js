// components/Home.js
import { select, templates } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initCarousel();
  }

  render(element) {
    const thisHome = this;
    const generatedHTML = templates.home();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  initCarousel() {
    const thisHome = this;
    const carousel = thisHome.dom.wrapper.querySelector('.js-carousel');

    if (carousel) {
      // Flickity załadowane globalnie, więc dostępne przez `Flickity`
      new Flickity(carousel, {
        wrapAround: true,
        autoPlay: 3000,
        cellAlign: 'center',
        contain: true,
        pageDots: true,
      });
    }
  }
}

export default Home;