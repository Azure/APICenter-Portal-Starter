import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), basicSsl()],
  define: {
    'process.env': {},
  },
});
