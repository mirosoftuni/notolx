import { renderPage } from '../shared/page.js';
import { register } from '../services/authService.js';
import {
  createFormController,
  getAuthErrorMessage,
  isValidEmail
} from '../shared/formController.js';
import { getCurrentLanguage, t } from '../shared/i18n.js';

renderPage({
  activePage: 'register',
  eyebrow: t('auth.account'),
  title: t('register.title'),
  intro: t('register.intro'),
  contentClass: 'auth-layout d-flex align-items-center',
  content: `
    <div class="row justify-content-center w-100">
      <div class="col-md-8 col-lg-6">
        <form class="auth-card" id="registerForm" novalidate>
          <h2 class="h4 fw-bold mb-1">${t('register.heading')}</h2>
          <p class="text-secondary mb-4">${t('register.helper')}</p>
          <div class="alert" data-form-message hidden></div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="name">${t('form.name')}</label>
              <input class="form-control" id="name" name="name" type="text" autocomplete="name" minlength="2" required />
              <div class="invalid-feedback" data-field-error="name"></div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="phone">${t('form.phone')}</label>
              <input class="form-control" id="phone" name="phone" type="tel" autocomplete="tel" />
              <div class="invalid-feedback" data-field-error="phone"></div>
            </div>
            <div class="col-12">
              <label class="form-label" for="email">${t('form.email')}</label>
              <input class="form-control" id="email" name="email" type="email" autocomplete="email" required />
              <div class="invalid-feedback" data-field-error="email"></div>
            </div>
            <div class="col-12">
              <label class="form-label" for="password">${t('form.password')}</label>
              <input class="form-control" id="password" name="password" type="password" autocomplete="new-password" minlength="6" required />
              <div class="invalid-feedback" data-field-error="password"></div>
            </div>
          </div>
          <button class="btn btn-primary w-100 mt-4" type="submit">${t('register.submit')}</button>
          <p class="text-center text-secondary small mt-3 mb-0">
            ${t('register.hasAccount')} <a href="/login.html">${t('register.login')}</a>
          </p>
        </form>
      </div>
    </div>
  `
});

const registerController = createFormController('#registerForm');

function validateRegister(values) {
  const errors = {};

  if (!values.name) {
    errors.name = t('validation.nameRequired');
  } else if (values.name.length < 2) {
    errors.name = t('validation.nameMin');
  }

  if (values.phone && values.phone.length < 6) {
    errors.phone = t('validation.phone');
  }

  if (!values.email) {
    errors.email = t('validation.emailRequired');
  } else if (!isValidEmail(values.email)) {
    errors.email = t('validation.emailInvalid');
  }

  if (!values.password) {
    errors.password = t('validation.passwordRequired');
  } else if (values.password.length < 6) {
    errors.password = t('validation.passwordMin');
  }

  return errors;
}

registerController.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerController.clearMessage();

  const values = registerController.values();
  const errors = validateRegister(values);

  if (Object.keys(errors).length > 0) {
    registerController.setErrors(errors);
    return;
  }

  registerController.clearErrors();
  registerController.setLoading(true, t('register.loading'));

  try {
    const { data, error } = await register({
      email: values.email,
      password: values.password,
      displayName: values.name,
      fullName: values.name,
      phone: values.phone,
      preferredLanguage: getCurrentLanguage()
    });

    if (error) {
      registerController.showMessage(getAuthErrorMessage(error, t('register.failed')));
      return;
    }

    if (data.session) {
      window.location.assign('/profile.html');
      return;
    }

    registerController.showMessage(t('register.success'), 'success');
    registerController.form.reset();
  } catch (error) {
    registerController.showMessage(getAuthErrorMessage(error, t('register.problem')));
  } finally {
    registerController.setLoading(false);
  }
});
