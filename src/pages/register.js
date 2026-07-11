import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'register',
  eyebrow: 'Account',
  title: 'Create account',
  intro: 'Start selling, buying, and managing your marketplace profile.',
  content: `
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <form class="bg-white border rounded-3 p-4">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="name">Name</label>
              <input class="form-control" id="name" name="name" type="text" autocomplete="name" required />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="phone">Phone</label>
              <input class="form-control" id="phone" name="phone" type="tel" autocomplete="tel" />
            </div>
            <div class="col-12">
              <label class="form-label" for="email">Email</label>
              <input class="form-control" id="email" name="email" type="email" autocomplete="email" required />
            </div>
            <div class="col-12">
              <label class="form-label" for="password">Password</label>
              <input class="form-control" id="password" name="password" type="password" autocomplete="new-password" required />
            </div>
          </div>
          <button class="btn btn-primary w-100 mt-4" type="submit">Register</button>
        </form>
      </div>
    </div>
  `
});
