import { renderPage } from '../shared/page.js';
import { register } from '../services/authService.js';
import {
  createFormController,
  getAuthErrorMessage,
  isValidEmail
} from '../shared/formController.js';

renderPage({
  activePage: 'register',
  eyebrow: 'Account',
  title: 'Регистрация',
  intro: 'Създайте профил, за да публикувате обяви и да запазвате предложения.',
  contentClass: 'auth-layout d-flex align-items-center',
  content: `
    <div class="row justify-content-center w-100">
      <div class="col-md-8 col-lg-6">
        <form class="auth-card" id="registerForm" novalidate>
          <h2 class="h4 fw-bold mb-1">Присъединете се към NOTOLX</h2>
          <p class="text-secondary mb-4">Попълнете основните данни за вашия профил.</p>
          <div class="alert" data-form-message hidden></div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="name">Име</label>
              <input class="form-control" id="name" name="name" type="text" autocomplete="name" minlength="2" required />
              <div class="invalid-feedback" data-field-error="name"></div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="phone">Телефон</label>
              <input class="form-control" id="phone" name="phone" type="tel" autocomplete="tel" />
              <div class="invalid-feedback" data-field-error="phone"></div>
            </div>
            <div class="col-12">
              <label class="form-label" for="email">Имейл</label>
              <input class="form-control" id="email" name="email" type="email" autocomplete="email" required />
              <div class="invalid-feedback" data-field-error="email"></div>
            </div>
            <div class="col-12">
              <label class="form-label" for="password">Парола</label>
              <input class="form-control" id="password" name="password" type="password" autocomplete="new-password" minlength="6" required />
              <div class="invalid-feedback" data-field-error="password"></div>
            </div>
          </div>
          <button class="btn btn-primary w-100 mt-4" type="submit">Регистрация</button>
          <p class="text-center text-secondary small mt-3 mb-0">
            Вече имате профил? <a href="/login.html">Влезте</a>
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
    errors.name = 'Въведете име.';
  } else if (values.name.length < 2) {
    errors.name = 'Името трябва да е поне 2 символа.';
  }

  if (values.phone && values.phone.length < 6) {
    errors.phone = 'Въведете валиден телефон или оставете полето празно.';
  }

  if (!values.email) {
    errors.email = 'Въведете имейл адрес.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Въведете валиден имейл адрес.';
  }

  if (!values.password) {
    errors.password = 'Въведете парола.';
  } else if (values.password.length < 6) {
    errors.password = 'Паролата трябва да е поне 6 символа.';
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
  registerController.setLoading(true, 'Регистрация...');

  try {
    const { data, error } = await register({
      email: values.email,
      password: values.password,
      displayName: values.name,
      fullName: values.name,
      phone: values.phone
    });

    if (error) {
      registerController.showMessage(
        getAuthErrorMessage(error, 'Регистрацията не беше успешна. Опитайте отново.')
      );
      return;
    }

    if (data.session) {
      window.location.assign('/profile.html');
      return;
    }

    registerController.showMessage(
      'Регистрацията е успешна. Проверете имейла си, за да потвърдите профила.',
      'success'
    );
    registerController.form.reset();
  } catch (error) {
    registerController.showMessage(
      getAuthErrorMessage(error, 'Възникна проблем при регистрация. Опитайте отново.')
    );
  } finally {
    registerController.setLoading(false);
  }
});
