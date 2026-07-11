import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'login',
  eyebrow: 'Account',
  title: 'Login',
  intro: 'Access your listings, saved offers, and messages.',
  content: `
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-5">
        <form class="bg-white border rounded-3 p-4">
          <div class="mb-3">
            <label class="form-label" for="email">Email</label>
            <input class="form-control" id="email" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="btn btn-primary w-100" type="submit">Login</button>
          <p class="text-center text-secondary small mt-3 mb-0">
            New to NOTOLX? <a href="/register.html">Create an account</a>
          </p>
        </form>
      </div>
    </div>
  `
});
