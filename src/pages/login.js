import { renderPage } from '../shared/page.js';
import { login } from '../services/authService.js';
import {
  createFormController,
  getAuthErrorMessage,
  getSafeRedirect,
  isValidEmail
} from '../shared/formController.js';

renderPage({
  activePage: 'login',
  eyebrow: 'Account',
  title: 'Вход',
  intro: 'Влезте, за да управлявате обявите, профила и любимите си предложения.',
  contentClass: 'auth-layout d-flex align-items-center',
  content: `
    <div class="row justify-content-center w-100">
      <div class="col-md-8 col-lg-5">
        <form class="auth-card" id="loginForm" novalidate>
          <h2 class="h4 fw-bold mb-1">Добре дошли отново</h2>
          <p class="text-secondary mb-4">Въведете данните си за достъп.</p>
          <div class="alert" data-form-message hidden></div>
          <div class="mb-3">
            <label class="form-label" for="email">Имейл</label>
            <input class="form-control" id="email" name="email" type="email" autocomplete="email" required />
            <div class="invalid-feedback" data-field-error="email"></div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">Парола</label>
            <input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required />
            <div class="invalid-feedback" data-field-error="password"></div>
          </div>
          <button class="btn btn-primary w-100" type="submit">Вход</button>
          <p class="text-center text-secondary small mt-3 mb-0">
            Нямате профил? <a href="/register.html">Създайте регистрация</a>
          </p>
        </form>
      </div>
    </div>
  `
});

const loginController = createFormController('#loginForm');

function validateLogin(values) {
  const errors = {};

  if (!values.email) {
    errors.email = 'Въведете имейл адрес.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Въведете валиден имейл адрес.';
  }

  if (!values.password) {
    errors.password = 'Въведете парола.';
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
  loginController.setLoading(true, 'Влизане...');

  try {
    const { error } = await login({
      email: values.email,
      password: values.password
    });

    if (error) {
      loginController.showMessage(
        getAuthErrorMessage(error, 'Неуспешен вход. Проверете данните и опитайте отново.')
      );
      return;
    }

    window.location.assign(getSafeRedirect('/profile.html'));
  } catch (error) {
    loginController.showMessage(
      getAuthErrorMessage(error, 'Възникна проблем при вход. Опитайте отново.')
    );
  } finally {
    loginController.setLoading(false);
  }
});
