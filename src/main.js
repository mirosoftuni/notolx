import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/main.css';
import { isSupabaseConfigured } from './lib/supabase.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="min-vh-100 bg-body-tertiary">
    <nav class="navbar navbar-expand-lg bg-white border-bottom">
      <div class="container">
        <a class="navbar-brand fw-bold" href="/">NOTOLX</a>
        <span class="badge text-bg-primary">Vite + Supabase</span>
      </div>
    </nav>

    <section class="container py-5">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <p class="text-uppercase text-primary fw-semibold mb-2">Marketplace starter</p>
          <h1 class="display-5 fw-bold mb-3">Build NOTOLX with vanilla JavaScript.</h1>
          <p class="lead text-secondary mb-4">
            This project is ready for HTML, CSS, JavaScript, Bootstrap, Vite, and Supabase.
          </p>
          <div class="d-flex flex-wrap gap-2">
            <a class="btn btn-primary btn-lg" href="https://vite.dev" target="_blank" rel="noreferrer">
              Vite Docs
            </a>
            <a class="btn btn-outline-secondary btn-lg" href="https://supabase.com/docs" target="_blank" rel="noreferrer">
              Supabase Docs
            </a>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="status-panel bg-white border rounded-3 p-4 shadow-sm">
            <h2 class="h5 fw-semibold mb-3">Project status</h2>
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between px-0">
                <span>Vite</span>
                <span class="text-success fw-semibold">Ready</span>
              </li>
              <li class="list-group-item d-flex justify-content-between px-0">
                <span>Bootstrap</span>
                <span class="text-success fw-semibold">Loaded</span>
              </li>
              <li class="list-group-item d-flex justify-content-between px-0">
                <span>Supabase env</span>
                <span class="${isSupabaseConfigured ? 'text-success' : 'text-warning'} fw-semibold">
                  ${isSupabaseConfigured ? 'Configured' : 'Pending'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </main>
`;
