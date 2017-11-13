/*
 * Project configuration
 * =====================
 */

'use strict';


// Where this project source code lives.
var SRC = 'src';

// Where final distribution files will be copied.
var DIST = 'dist';

// Where compiled scripts will be placed.
var BUILD = 'build';

// Where static assets (textures, fonts, sprites, sounds etc.) live.
var STATIC = 'static';

// Which Phaser build was selected to develop the game.
var PHASER = 'node_modules/phaser/build/custom/phaser-arcade-physics.js';

var bootgrid_js = 'node_modules/jquery-bootgrid/dist/jquery.bootgrid.min.js';
var bootgrid_css = 'node_modules/jquery-bootgrid/dist/jquery.bootgrid.min.css';
module.exports = {

  // Build output directories.
  dirs: {
    build: BUILD,
    dist: DIST
  },

  // File paths and glob patterns.
  files: {
    // Finds this project static assets to be copied for distribution.
    assets: STATIC + '/**',

    // Finds the scripts to be compiled.
    scripts: SRC + '/**/*.js', 

    // The selected Phaser script.
    phaser: PHASER,

    bootgrid_js,

    bootgrid_css


  },

  // The Browserify settings.
  bundle: {
    debug: true,
    standalone: 'app',
    entries: [
      'src/index.js'
    ],
    transform: [
      'babelify'
    ]
  },

  server: {

    // The BrowserSync settings.
    serveStatic: [
      STATIC,
      BUILD,
      { route: '/phaser.js', dir: PHASER }
    ],
    proxy: "localhost:30010"



  }

};
