(function () {
  function onRadioChange(event) {
    if (!this.input) return;

    const value = event.target.value;
    this.input.value = value === 'onetime' ? '' : value;
  }

  function onSelectChange(event) {
    if (!this.input) return;

    this.input.value = event.target.value;
  }

  function initialiseProductSubscriptions() {
    this.input = this.input || this.querySelector('input[name="selling_plan"]');
    this.options = this.options || this.querySelectorAll('input[name="purchase_option"]');
    this.select = this.select || this.querySelector('select[name="purchase_option_values"]');

    this.options?.forEach((option) => {
      option.addEventListener('change', (event) => onRadioChange.call(this, event));
    });

    if (this.select) {
      this.select.addEventListener('change', (event) => onSelectChange.call(this, event));
    }
  }

  function getCurrentSellingPlanId() {
    return this.input?.value || '';
  }

  class ProductSubscriptions extends HTMLElement {
    connectedCallback() {
      if (this.dataset.subscriptionsInitialised === 'true') return;
      this.dataset.subscriptionsInitialised = 'true';

      this.input = this.querySelector('input[name="selling_plan"]');
      this.options = this.querySelectorAll('input[name="purchase_option"]');
      this.select = this.querySelector('select[name="purchase_option_values"]');

      try {
        initialiseProductSubscriptions.call(this);
      } catch (error) {
        console.warn('ProductSubscriptions initialisation skipped.', error);
      }
    }

    getCurrentSellingPlanId() {
      return getCurrentSellingPlanId.call(this);
    }
  }

  ProductSubscriptions.prototype.onRadioChange = onRadioChange;
  ProductSubscriptions.prototype.onSelectChange = onSelectChange;
  ProductSubscriptions.prototype.initialise = initialiseProductSubscriptions;
  ProductSubscriptions.prototype.getCurrentSellingPlanId = getCurrentSellingPlanId;

  const existing = customElements.get('product-subscriptions');

  if (!existing) {
    customElements.define('product-subscriptions', ProductSubscriptions);
  } else {
    existing.prototype.onRadioChange = onRadioChange;
    existing.prototype.onSelectChange = onSelectChange;
    existing.prototype.initialise = initialiseProductSubscriptions;
    existing.prototype.getCurrentSellingPlanId = getCurrentSellingPlanId;

    document.querySelectorAll('product-subscriptions').forEach((element) => {
      if (element.dataset.subscriptionsInitialised === 'true') return;
      element.dataset.subscriptionsInitialised = 'true';
      element.input = element.querySelector('input[name="selling_plan"]');
      element.options = element.querySelectorAll('input[name="purchase_option"]');
      element.select = element.querySelector('select[name="purchase_option_values"]');

      try {
        initialiseProductSubscriptions.call(element);
      } catch (error) {
        console.warn('ProductSubscriptions patch skipped.', error);
      }
    });
  }

  window.ProductSubscriptions = ProductSubscriptions;

  window.getCurrentSellingPlanId = function () {
    const subscriptionBanner = document.querySelector('subscription-banner');
    if (typeof subscriptionBanner?.getCurrentSellingPlanId === 'function') {
      return subscriptionBanner.getCurrentSellingPlanId();
    }

    const productForm = document.querySelector('product-form .product-selling-plan-id, product-form [name="selling_plan"]');
    return productForm?.value || '';
  };
})();
