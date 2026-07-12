import { t } from './i18n.js';

export function createFormController(formSelector) {
  const form = document.querySelector(formSelector);

  if (!form) {
    throw new Error(`Form not found: ${formSelector}`);
  }

  const submitButton = form.querySelector('[type="submit"]');
  const submitLabel = submitButton?.textContent.trim() ?? '';
  const messageEl = form.querySelector('[data-form-message]');

  function values() {
    return Object.fromEntries(
      Array.from(new FormData(form).entries()).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
      ])
    );
  }

  function clearErrors() {
    form.querySelectorAll('.is-invalid').forEach((field) => {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    });

    form.querySelectorAll('[data-field-error]').forEach((errorEl) => {
      errorEl.textContent = '';
    });
  }

  function setErrors(errors = {}) {
    clearErrors();

    Object.entries(errors).forEach(([fieldName, message]) => {
      const field = form.elements[fieldName];
      const errorEl = form.querySelector(`[data-field-error="${fieldName}"]`);

      if (field) {
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
      }

      if (errorEl) {
        errorEl.textContent = message;
      }
    });
  }

  function showMessage(message, type = 'danger') {
    if (!messageEl) {
      return;
    }

    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    messageEl.hidden = false;
  }

  function clearMessage() {
    if (!messageEl) {
      return;
    }

    messageEl.hidden = true;
    messageEl.textContent = '';
    messageEl.className = 'alert';
  }

  function setLoading(isLoading, loadingText = t('form.loading')) {
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? loadingText : submitLabel;
    }

    Array.from(form.elements).forEach((field) => {
      if (field !== submitButton) {
        field.disabled = isLoading;
      }
    });
  }

  return {
    form,
    values,
    setErrors,
    clearErrors,
    showMessage,
    clearMessage,
    setLoading
  };
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getSafeRedirect(defaultPath = '/profile.html') {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') ?? params.get('redirectTo') ?? params.get('next');

  if (!redirect) {
    return defaultPath;
  }

  try {
    const target = new URL(redirect, window.location.origin);

    if (target.origin !== window.location.origin) {
      return defaultPath;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return defaultPath;
  }
}

export function getAuthErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  const message = error.message?.toLowerCase() ?? '';

  if (message.includes('invalid login credentials')) {
    return t('auth.invalidCredentials');
  }

  if (message.includes('email not confirmed')) {
    return t('auth.emailNotConfirmed');
  }

  if (message.includes('user already registered') || message.includes('already registered')) {
    return t('auth.alreadyRegistered');
  }

  if (message.includes('password')) {
    return t('auth.passwordProblem');
  }

  if (message.includes('network') || message.includes('failed to fetch')) {
    return t('auth.network');
  }

  if (message.includes('supabase is not configured')) {
    return t('auth.missingConfig');
  }

  return fallbackMessage;
}
