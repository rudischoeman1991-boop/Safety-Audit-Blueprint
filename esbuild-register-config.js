const register = require('esbuild-register');

// Configure esbuild to handle ESM-like syntax in CommonJS modules
register({
  target: 'node20',
  format: 'cjs',
  external: ['vite.config*']
});

module.exports = register;
