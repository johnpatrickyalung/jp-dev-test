function normalizeSellingPlanId(id) {
  if (!id) return '';
  const value = String(id).trim();
  const match = value.match(/(\d+)$/);
  return match ? match[1] : value;
}

function isSubscriptionBannerReady(banner) {
  return banner && typeof banner.syncSellingPlanToForm === 'function';
}

function isBundlePickerReady(picker) {
  return picker && typeof picker.updateAddToCartPrices === 'function';
}

function getDisplayPrice(input, subscriptionActive) {
  if (!input) return '';
  return subscriptionActive && input.dataset.subscriptionPrice
    ? input.dataset.subscriptionPrice
    : input.dataset.price;
}

function updateAddToCartPricesFallback(sectionId, input, subscriptionActive) {
  if (!input) return;

  const addToCart = document.querySelector(`product-add-to-cart[data-section="${sectionId}"]`);
  if (!addToCart) return;

  const priceEl = addToCart.querySelector('[data-atc-price]');
  const compareEl = addToCart.querySelector('[data-atc-compare]');
  const price = getDisplayPrice(input, subscriptionActive);

  if (priceEl) priceEl.textContent = price;
  if (compareEl) {
    if (input.dataset.compareAt) {
      compareEl.textContent = input.dataset.compareAt;
      compareEl.hidden = false;
    } else {
      compareEl.textContent = '';
      compareEl.hidden = true;
    }
  }
}

if (!customElements.get('bundle-variant-picker')) {
  class BundleVariantPicker extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.section;
      this.inputs = this.querySelectorAll('.product-bundle-picker__input');

      this.inputs.forEach((input) => {
        input.addEventListener('change', () => this.onVariantChange(input));
      });

      this.initWhenReady();
    }

    initWhenReady() {
      this.form = document.getElementById(`product-form-${this.sectionId}`);
      this.addToCart = document.querySelector(`product-add-to-cart[data-section="${this.sectionId}"]`);
      this.subscriptionBanner = document.querySelector(`subscription-banner[data-section="${this.sectionId}"]`);

      if (!this.form) {
        requestAnimationFrame(() => this.initWhenReady());
        return;
      }

      const checked = this.querySelector('.product-bundle-picker__input:checked');
      if (checked) {
        this.syncSelectedState(checked);
        this.applyVariant(checked, false);
      } else if (this.inputs.length) {
        const firstAvailable = Array.from(this.inputs).find((input) => !input.disabled) || this.inputs[0];
        firstAvailable.checked = true;
        this.syncSelectedState(firstAvailable);
        this.applyVariant(firstAvailable, false);
      }
    }

    onVariantChange(input) {
      this.syncSelectedState(input);
      this.applyVariant(input, true);
    }

    syncSelectedState(input) {
      this.querySelectorAll('.product-bundle-picker__option').forEach((option) => {
        option.classList.remove('is-selected');
      });
      input.closest('.product-bundle-picker__option')?.classList.add('is-selected');
    }

    syncSubscriptionPlan(input) {
      if (!this.subscriptionBanner) return;

      const inputPlanId = normalizeSellingPlanId(input.dataset.sellingPlanId);
      const hasSellingPlan = input.dataset.hasSellingPlan === 'true' && inputPlanId;

      this.subscriptionBanner.dataset.sellingPlanId = hasSellingPlan ? inputPlanId : '';

      if (isSubscriptionBannerReady(this.subscriptionBanner)) {
        this.subscriptionBanner.syncSellingPlanToForm(false);
        return;
      }

      const checkbox = this.subscriptionBanner.querySelector('.product-subscription-banner__checkbox');
      const sellingPlanInput = this.form?.querySelector('[name="selling_plan"]');

      if (!sellingPlanInput) return;

      sellingPlanInput.value = checkbox?.checked && hasSellingPlan ? inputPlanId : '';
    }

    applyVariant(input, updateUrl) {
      if (!input || input.disabled) return;

      const variantId = input.value;
      const variantInput = this.form?.querySelector('[name="id"]');
      if (variantInput) {
        variantInput.disabled = false;
        variantInput.value = variantId;
      }

      this.syncSubscriptionPlan(input);
      this.updateAddToCartPrices(input);
      this.updateBundlePickerPrices();
      this.updateSubmitButton(input);
      this.updateInfoListStock(input.value);

      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variantId);
        window.history.replaceState({}, '', url.toString());
      }
    }

    updateSubmitButton(input) {
      const submitButton = this.form?.querySelector('[type="submit"]');
      if (!submitButton) return;

      submitButton.toggleAttribute('disabled', input.disabled);
    }

    getVariantData() {
      const json = this.querySelector('script[type="application/json"]');
      if (!json) return [];
      try {
        return JSON.parse(json.textContent);
      } catch (error) {
        return [];
      }
    }

    updateInfoListStock(variantId) {
      const infoList = document.querySelector('.product-info-list');
      if (!infoList || infoList.dataset.useInventory !== 'true') return;

      const variant = this.getVariantData().find((item) => String(item.id) === String(variantId));
      if (!variant) return;

      const stockIcon = infoList.querySelector('[data-info-stock-icon] .product-info-list__stock-dot');
      const stockText = infoList.querySelector('[data-info-stock-text]');
      if (!stockText) return;

      const inStockLabel = infoList.dataset.inStockLabel || 'In Stock';
      const outOfStockLabel = infoList.dataset.outOfStockLabel || 'Out of stock';
      const deliveryText = infoList.dataset.deliveryText || '';

      if (stockIcon) {
        stockIcon.classList.toggle('product-info-list__stock-dot--in-stock', variant.available);
        stockIcon.classList.toggle('product-info-list__stock-dot--out-of-stock', !variant.available);
      }

      if (variant.available) {
        stockText.innerHTML = `<strong>${inStockLabel}</strong>${deliveryText ? ` <span class="product-info-list__separator"> | </span>${deliveryText}` : ''}`;
      } else {
        stockText.innerHTML = `<strong>${outOfStockLabel}</strong>`;
      }
    }

    getDisplayPerBottle(input, subscriptionActive) {
      if (!input) return '';
      return subscriptionActive && input.dataset.perBottleSubscription
        ? input.dataset.perBottleSubscription
        : input.dataset.perBottle;
    }

    isSubscriptionActive() {
      if (isSubscriptionBannerReady(this.subscriptionBanner)) {
        return Boolean(this.subscriptionBanner.isSubscriptionActive());
      }

      const checkbox = this.subscriptionBanner?.querySelector('.product-subscription-banner__checkbox');
      const planId = normalizeSellingPlanId(this.subscriptionBanner?.dataset.sellingPlanId);
      return Boolean(checkbox?.checked && planId);
    }

    updateBundlePickerPrices(subscriptionActive = this.isSubscriptionActive()) {
      this.querySelectorAll('.product-bundle-picker__input').forEach((input) => {
        const option = input.closest('.product-bundle-picker__option');
        if (!option) return;

        const priceEl = option.querySelector('[data-bundle-price]');
        const perBottleEl = option.querySelector('[data-bundle-per-bottle-price]');
        const saveBadge = option.querySelector('[data-bundle-save-badge]');

        if (priceEl) {
          priceEl.textContent = getDisplayPrice(input, subscriptionActive);
        }

        if (perBottleEl) {
          const perBottle = this.getDisplayPerBottle(input, subscriptionActive);
          if (perBottle) perBottleEl.textContent = perBottle;
        }

        if (saveBadge) {
          const saveLabel = subscriptionActive
            ? saveBadge.dataset.saveSubscription
            : saveBadge.dataset.saveOneTime;
          if (saveLabel) saveBadge.textContent = saveLabel;
        }
      });
    }

    updateAddToCartPrices(input) {
      if (!this.addToCart) return;

      const subscriptionActive = this.isSubscriptionActive();
      updateAddToCartPricesFallback(this.sectionId, input, subscriptionActive);
    }
  }

  customElements.define('bundle-variant-picker', BundleVariantPicker);
}

if (!customElements.get('subscription-banner')) {
  class SubscriptionBanner extends HTMLElement {
    connectedCallback() {
      this.checkbox = this.querySelector('.product-subscription-banner__checkbox');
      this.bundlePicker = document.querySelector(`bundle-variant-picker[data-section="${this.dataset.section}"]`);

      this.checkbox?.addEventListener('change', () => this.onToggle());
      this.initWhenReady();
    }

    initWhenReady() {
      this.form = document.getElementById(`product-form-${this.dataset.section}`);

      if (!this.form) {
        requestAnimationFrame(() => this.initWhenReady());
        return;
      }

      if (this.bundlePicker && !isBundlePickerReady(this.bundlePicker)) {
        requestAnimationFrame(() => this.initWhenReady());
        return;
      }

      const checkedVariant = this.bundlePicker?.querySelector('.product-bundle-picker__input:checked');
      const variantPlanId = normalizeSellingPlanId(checkedVariant?.dataset.sellingPlanId);
      const hasSellingPlan = checkedVariant?.dataset.hasSellingPlan === 'true' && variantPlanId;
      this.dataset.sellingPlanId = hasSellingPlan ? variantPlanId : '';

      this.syncSellingPlanToForm();
    }

    getSellingPlanInput() {
      return this.form?.querySelector('[name="selling_plan"]');
    }

    isSubscriptionActive() {
      if (!this.checkbox?.checked) return false;

      const checkedVariant = this.bundlePicker?.querySelector('.product-bundle-picker__input:checked');
      const planId = normalizeSellingPlanId(checkedVariant?.dataset.sellingPlanId);

      return Boolean(checkedVariant?.dataset.hasSellingPlan === 'true' && planId);
    }

    syncSellingPlanToForm(updatePrices = true) {
      const sellingPlanInput = this.getSellingPlanInput();
      if (!sellingPlanInput) return;

      const planId = normalizeSellingPlanId(this.dataset.sellingPlanId);

      if (this.isSubscriptionActive() && planId) {
        sellingPlanInput.value = planId;
        this.dataset.sellingPlanId = planId;
      } else {
        sellingPlanInput.value = '';
      }

      if (!updatePrices) return;

      const checkedVariant = this.bundlePicker?.querySelector('.product-bundle-picker__input:checked');
      this.updateAddToCartPrices(checkedVariant);
      this.updateBundlePickerPrices();
    }

    onToggle() {
      this.syncSellingPlanToForm();
    }

    updateBundlePickerPrices() {
      if (isBundlePickerReady(this.bundlePicker)) {
        this.bundlePicker.updateBundlePickerPrices(this.isSubscriptionActive());
      }
    }

    updateAddToCartPrices(input) {
      if (!input) return;

      if (isBundlePickerReady(this.bundlePicker)) {
        this.bundlePicker.updateAddToCartPrices(input);
        return;
      }

      updateAddToCartPricesFallback(this.dataset.section, input, this.isSubscriptionActive());
    }

    getCurrentSellingPlanId() {
      if (!this.isSubscriptionActive()) return '';

      const checkedVariant = this.bundlePicker?.querySelector('.product-bundle-picker__input:checked');
      const variantPlanId = normalizeSellingPlanId(checkedVariant?.dataset.sellingPlanId);

      if (checkedVariant?.dataset.hasSellingPlan === 'true' && variantPlanId) {
        return variantPlanId;
      }

      return '';
    }
  }

  customElements.define('subscription-banner', SubscriptionBanner);
}

if (!customElements.get('product-add-to-cart')) {
  customElements.define('product-add-to-cart', class ProductAddToCart extends HTMLElement {});
}

window.getCurrentSellingPlanId = function () {
  const subscriptionBanner = document.querySelector('subscription-banner');
  if (subscriptionBanner?.getCurrentSellingPlanId) {
    return subscriptionBanner.getCurrentSellingPlanId();
  }

  const productSubscriptions = document.querySelector('product-subscriptions');
  return productSubscriptions?.getCurrentSellingPlanId?.() || '';
};
