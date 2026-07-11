import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(rootDir, 'index.html'),
        login: resolve(rootDir, 'login.html'),
        register: resolve(rootDir, 'register.html'),
        listing: resolve(rootDir, 'listing.html'),
        listingForm: resolve(rootDir, 'listing-form.html'),
        profile: resolve(rootDir, 'profile.html'),
        admin: resolve(rootDir, 'admin.html')
      }
    }
  },
  server: {
    port: 5173
  }
});
