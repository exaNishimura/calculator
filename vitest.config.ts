/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'game02-life-allocation',
      env: {
        VITE_ADMIN_PASSCODE: 'test-admin-pass',
        VITE_DATA_SOURCE: 'local',
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_ANON_KEY: '',
      },
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
      clearMocks: true,
      restoreMocks: true,
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
);
