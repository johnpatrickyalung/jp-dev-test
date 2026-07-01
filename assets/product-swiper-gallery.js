class ProductSwiperGallery extends HTMLElement {
  constructor() {
    super();
    this.mainSwiper = null;
    this.thumbsSwiper = null;
  }

  connectedCallback() {
    this.initWhenReady();
  }

  disconnectedCallback() {
    this.mainSwiper?.destroy(true, true);
    this.thumbsSwiper?.destroy(true, true);
  }

  initWhenReady() {
    if (typeof Swiper === 'undefined') {
      setTimeout(() => this.initWhenReady(), 50);
      return;
    }

    const thumbsEl = this.querySelector('[data-swiper-thumbs]');
    const mainEl = this.querySelector('[data-swiper-main]');

    if (!thumbsEl || !mainEl || this.mainSwiper) return;

    const thumbsGap =
      parseFloat(getComputedStyle(this).getPropertyValue('--product-swiper-thumbs-gap')) || 15.25;

    this.thumbsSwiper = new Swiper(thumbsEl, {
      spaceBetween: thumbsGap,
      direction: 'vertical',
      slidesPerView: 5,
      freeMode: true,
      watchSlidesProgress: true,
    });

    this.mainSwiper = new Swiper(mainEl, {
      spaceBetween: 0,
      navigation: {
        nextEl: this.querySelector('.product-swiper-main__button--next'),
        prevEl: this.querySelector('.product-swiper-main__button--prev'),
      },
      thumbs: {
        swiper: this.thumbsSwiper,
      },
    });
  }
}

if (!customElements.get('product-swiper-gallery')) {
  customElements.define('product-swiper-gallery', ProductSwiperGallery);
}
