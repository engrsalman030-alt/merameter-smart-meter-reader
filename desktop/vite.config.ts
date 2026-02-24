import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: './',
    root: path.join(__dirname, 'src/renderer'),
    publicDir: path.join(__dirname, 'public'),
    build: {
        outDir: path.join(__dirname, 'dist/renderer'),
        emptyOutDir: true,
        rollupOptions: {
            input: path.join(__dirname, 'src/renderer/index.html'),
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/renderer'),
            '@common': path.resolve(__dirname, 'src/common'),
        },
    },
    server: {
        port: 5173,
    },
});
