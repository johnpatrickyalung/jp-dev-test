class ProductIngredientsModal extends HTMLElement {
  constructor() {
    super();
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onHashChange = this.onHashChange.bind(this);
  }

  connectedCallback() {
    this.dialog = this.querySelector('[data-ingredients-modal-dialog]');
    if (!this.dialog) return;

    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('hashchange', this.onHashChange);

    this.querySelectorAll('[data-ingredients-modal-close]').forEach((element) => {
      element.addEventListener('click', () => this.close());
    });

    if (window.location.hash === '#ingredient') {
      this.open(false);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('hashchange', this.onHashChange);
  }

  onDocumentClick(event) {
    const trigger = event.target.closest('a[href="#ingredient"]');

    if (trigger) {
      event.preventDefault();
      this.open();
      return;
    }

    if (this.contains(event.target) && event.target.hasAttribute('data-ingredients-modal-close')) {
      this.close();
    }
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() === 'ESCAPE' && this.isOpen()) {
      this.close();
    }
  }

  onHashChange() {
    if (window.location.hash === '#ingredient') {
      this.open(false);
      return;
    }

    if (this.isOpen()) {
      this.close(false);
    }
  }

  isOpen() {
    return this.classList.contains('is-open');
  }

  open(updateHash = true) {
    if (this.isOpen()) return;

    this.classList.add('is-open');
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');

    if (updateHash && window.location.hash !== '#ingredient') {
      history.pushState(null, '', '#ingredient');
    }

    if (typeof trapFocus === 'function') {
      trapFocus(this.dialog, this.querySelector('[data-ingredients-modal-close]'));
    }
  }

  close(updateHash = true) {
    if (!this.isOpen()) return;

    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');

    if (updateHash && window.location.hash === '#ingredient') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }

    if (typeof removeTrapFocus === 'function') {
      removeTrapFocus(document.querySelector('a[href="#ingredient"]'));
    }
  }
}

if (!customElements.get('product-ingredients-modal')) {
  customElements.define('product-ingredients-modal', ProductIngredientsModal);
}
