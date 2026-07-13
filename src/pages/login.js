import { renderPage } from '../shared/page.js';
import { isAdmin, login } from '../services/authService.js';
import {
  createFormController,
  getAuthErrorMessage,
  getSafeRedirect,
  isValidEmail
} from '../shared/formController.js';
import { t } from '../shared/i18n.js';

renderPage({
  activePage: 'login',
  eyebrow: t('auth.account'),
  title: t('login.title'),
  intro: t('login.intro'),
  contentClass: 'auth-layout d-flex align-items-center',
  content: `
    <div class="row justify-content-center w-100">
      <div class="col-md-8 col-lg-5">
        <form class="auth-card" id="loginForm" novalidate>
          <h2 class="h4 fw-bold mb-1">${t('login.welcome')}</h2>
          <p class="text-secondary mb-4">${t('login.helper')}</p>
          <div class="alert" data-form-message hidden></div>
          <div class="mb-3">
            <label class="form-label" for="email">${t('form.email')}</label>
            <input class="form-control" id="email" name="email" type="email" autocomplete="email" required />
            <div class="invalid-feedback" data-field-error="email"></div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">${t('form.password')}</label>
            <input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required />
            <div class="invalid-feedback" data-field-error="password"></div>
          </div>
          <button class="btn btn-primary w-100" type="submit">${t('login.submit')}</button>
          <p class="text-center text-secondary small mt-3 mb-0">
            ${t('login.noAccount')} <a href="/register.html">${t('login.createAccount')}</a>
          </p>
        </form>
      </div>
    </div>
  `
});

const loginController = createFormController('#loginForm');

function hasExplicitRedirect() {
  const params = new URLSearchParams(window.location.search);
  return params.has('redirect') || params.has('redirectTo') || params.has('next');
}

function validateLogin(values) {
  const errors = {};

  if (!values.email) {
    errors.email = t('validation.emailRequired');
  } else if (!isValidEmail(values.email)) {
    errors.email = t('validation.emailInvalid');
  }

  if (!values.password) {
    errors.password = t('validation.passwordRequired');
  }

  return errors;
}

loginController.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginController.clearMessage();

  const values = loginController.values();
  const errors = validateLogin(values);

  if (Object.keys(errors).length > 0) {
    loginController.setErrors(errors);
    return;
  }

  loginController.clearErrors();
  loginController.setLoading(true, t('login.loading'));

  try {
    const { data, error } = await login({
      email: values.email,
      password: values.password
    });

    if (error) {
      loginController.showMessage(getAuthErrorMessage(error, t('login.failed')));
      return;
    }

    if (hasExplicitRedirect()) {
      window.location.assign(getSafeRedirect('/profile.html'));
      return;
    }

    const adminResult = await isAdmin(data.user?.id);
    window.location.assign(adminResult.isAdmin ? '/admin.html' : '/profile.html');
  } catch (error) {
    loginController.showMessage(getAuthErrorMessage(error, t('login.problem')));
  } finally {
    loginController.setLoading(false);
  }
});
