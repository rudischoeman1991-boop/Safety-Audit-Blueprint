#!/usr/bin/env node
require('dotenv').config();

// Configure esbuild-register to exclude vite config files  
process.env.ESBUILD_REGISTER_EXTERNAL = 'vite.config*';

// Require esbuild-register with proper config
const register = require('esbuild-register');

// Now load the server
require('./server/index.ts');
