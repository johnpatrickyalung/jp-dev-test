
if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      if (!this.form) return;

      const variantInput = this.form.querySelector('[name="id"]');
      if (variantInput) variantInput.disabled = false;

      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if (!this.submitButton) return;

      this.submitButton.removeAttribute('aria-disabled');

      if (document.querySelector('cart-drawer')) {
        this.submitButton.setAttribute('aria-haspopup', 'dialog');
      }

      this.hideErrors = this.dataset.hideErrors === 'true';
    }

    syncFormState() {
      const sectionId = this.closest('product-add-to-cart')?.dataset.section;
      if (!sectionId) return;

      const picker = document.querySelector(`bundle-variant-picker[data-section="${sectionId}"]`);
      const checked = picker?.querySelector('.product-bundle-picker__input:checked');

      if (checked && typeof picker.applyVariant === 'function') {
        picker.applyVariant(checked, false);
      }

      const banner = document.querySelector(`subscription-banner[data-section="${sectionId}"]`);
      if (typeof banner?.syncSellingPlanToForm === 'function') {
        banner.syncSellingPlanToForm(false);
      }
    }

    getSellingPlanId() {
      const sectionId = this.closest('product-add-to-cart')?.dataset.section;
      const banner = sectionId
        ? document.querySelector(`subscription-banner[data-section="${sectionId}"]`)
        : document.querySelector('subscription-banner');

      if (typeof banner?.getCurrentSellingPlanId === 'function') {
        return banner.getCurrentSellingPlanId();
      }

      return this.form.querySelector('[name="selling_plan"]')?.value || '';
    }

    getCartAddBody(sellingPlanId) {
      const variantId = Number(this.form.querySelector('[name="id"]')?.value);
      const quantity = Number(this.form.querySelector('[name="quantity"]')?.value || 1);
      const item = { id: variantId, quantity };

      if (sellingPlanId) {
        item.selling_plan = Number(sellingPlanId);
      }

      const body = { items: [item] };

      if (this.cart && typeof this.cart.getSectionsToRender === 'function') {
        body.sections = this.cart.getSectionsToRender().map((section) => section.id);
        body.sections_url = window.location.pathname;
      }

      return body;
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (!this.form || !this.submitButton) return;
      if (this.submitButton.disabled) return;
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.syncFormState();

      const variantInput = this.form.querySelector('[name="id"]');
      const variantId = variantInput?.value;

      if (!variantId || variantInput?.disabled) {
        this.handleErrorMessage('Please select a product option.');
        return;
      }

      if (typeof fetchConfig !== 'function' || typeof routes === 'undefined') {
        this.form.submit();
        return;
      }

      this.handleErrorMessage();
      this.error = false;

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');

      const spinner = this.querySelector('.loading-overlay__spinner');
      if (spinner) spinner.classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';

      const sellingPlanId = this.getSellingPlanId();
      config.body = JSON.stringify(this.getCartAddBody(sellingPlanId));

      if (this.cart && typeof this.cart.setActiveElement === 'function') {
        this.cart.setActiveElement(document.activeElement);
      }

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: String(this.form.querySelector('[name="id"]')?.value),
                errors: response.description,
                message: response.message,
              });
            }

            this.handleErrorMessage(response.description || response.message || 'Unable to add to cart.');
            this.error = true;
            return;
          }

          if (Array.isArray(response.items) && response.items.length === 0) {
            this.handleErrorMessage(
              'This subscription plan is not available for the selected option. Uncheck subscription or verify Easy Subscriptions is linked to all variants.'
            );
            this.error = true;
            return;
          }

          if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'product-form',
              productVariantId: String(this.form.querySelector('[name="id"]')?.value),
            });
          }

          try {
            if (typeof this.cart.renderContents === 'function') {
              this.cart.renderContents(response);
            } else {
              window.location = window.routes.cart_url;
            }
          } catch (renderError) {
            console.error(renderError);
            window.location = window.routes.cart_url;
          }
        })
        .catch((error) => {
          console.error(error);
          this.handleErrorMessage('Unable to add to cart. Please try again.');
          this.error = true;
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');

          if (this.cart?.classList?.contains('is-empty')) {
            this.cart.classList.remove('is-empty');
          }

          this.submitButton.removeAttribute('aria-disabled');

          if (spinner) spinner.classList.add('hidden');
        });
    }

    handleErrorMessage(errorMessage = false) {
      if (this.hideErrors) return;

      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
