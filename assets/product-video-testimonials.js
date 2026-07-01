class ProductVideoTestimonials extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
  }

  connectedCallback() {
    this.initWhenReady();
  }

  disconnectedCallback() {
    this.swiper?.destroy(true, true);
    this.swiper = null;
  }

  initWhenReady() {
    if (typeof Swiper === 'undefined') {
      setTimeout(() => this.initWhenReady(), 50);
      return;
    }

    const swiperEl = this.querySelector('[data-video-testimonials-swiper]');
    if (!swiperEl || this.swiper) return;

    const slideGap =
      parseFloat(getComputedStyle(this).getPropertyValue('--vt-slide-gap')) || 11;

    requestAnimationFrame(() => {
      if (this.swiper || !swiperEl.isConnected) return;

      this.swiper = new Swiper(swiperEl, {
        spaceBetween: slideGap,
        slidesPerView: 2.5,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        resizeObserver: true,
        navigation: {
          nextEl: this.querySelector('.product-video-testimonials__nav--next'),
          prevEl: this.querySelector('.product-video-testimonials__nav--prev'),
        },
        pagination: {
          el: this.querySelector('.product-video-testimonials__pagination'),
          clickable: true,
        },
        on: {
          init: (swiper) => {
            this.classList.add('is-ready');
            swiper.update();
          },
        },
      });
    });
  }
}

if (!customElements.get('product-video-testimonials')) {
  customElements.define('product-video-testimonials', ProductVideoTestimonials);
}
