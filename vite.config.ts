import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

export default defineConfig({
  base: isGitHubPages ? '/ciphercase/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
});
