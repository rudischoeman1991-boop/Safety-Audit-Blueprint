#!/usr/bin/env node
require('dotenv').config();
require('esbuild-register');

// Delay vite module loading until it's actually needed
const originalRequire = require;
let viteCached = false;

// Monkey-patch require to prevent vite.config from being loaded during initial parse
const Module = require('module');
const _load = Module._load;

Module._load = function(request, parent) {
  // Only allow vite-related modules in the setupVite function context
  if (request.includes('vite.config')) {
    if (!viteCached) {
      // Lazy require after initial setup
      viteCached = true;
    }
    return _load.apply(this, arguments);
  }
  return _load.apply(this, arguments);
};

// Now load the server
require('./server/index.ts');
