class ProductAccordion extends HTMLElement {
  connectedCallback() {
    this.trigger = this.querySelector('[data-accordion-trigger]');
    this.panel = this.querySelector('[data-accordion-panel]');

    if (!this.trigger || !this.panel) return;

    this.onTriggerClick = () => this.toggle();
    this.trigger.addEventListener('click', this.onTriggerClick);
  }

  disconnectedCallback() {
    this.trigger?.removeEventListener('click', this.onTriggerClick);
  }

  toggle() {
    const willOpen = !this.classList.contains('is-open');

    this.classList.toggle('is-open', willOpen);
    this.trigger.setAttribute('aria-expanded', String(willOpen));
    this.panel.inert = !willOpen;
  }
}

if (!customElements.get('product-accordion')) {
  customElements.define('product-accordion', ProductAccordion);
}
