import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'create',
  eyebrow: 'Sell',
  title: 'Create listing',
  intro: 'Add the core details buyers need before publishing.',
  content: `
    <form class="bg-white border rounded-3 p-4">
      <div class="row g-3">
        <div class="col-lg-8">
          <label class="form-label" for="title">Title</label>
          <input class="form-control" id="title" name="title" type="text" required />
        </div>
        <div class="col-sm-6 col-lg-2">
          <label class="form-label" for="price">Price</label>
          <input class="form-control" id="price" name="price" type="number" min="0" required />
        </div>
        <div class="col-sm-6 col-lg-2">
          <label class="form-label" for="currency">Currency</label>
          <select class="form-select" id="currency" name="currency">
            <option>BGN</option>
            <option>EUR</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="category">Category</label>
          <select class="form-select" id="category" name="category">
            <option>Electronics</option>
            <option>Vehicles</option>
            <option>Home</option>
            <option>Jobs</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="location">Location</label>
          <input class="form-control" id="location" name="location" type="text" />
        </div>
        <div class="col-12">
          <label class="form-label" for="description">Description</label>
          <textarea class="form-control" id="description" name="description" rows="5"></textarea>
        </div>
      </div>
      <button class="btn btn-primary mt-4" type="submit">Save listing</button>
    </form>
  `
});
