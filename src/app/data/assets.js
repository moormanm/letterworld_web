/*
 * The `assets` module
 * ============================================================================
 *
 * Use this module to declare static Phaser Asset Packs, that would be loaded
 * using the `Loader#pack` API.
 *
 * Regarding how the game assets should be declared using this file, refer to
 * the sample `assetPack.json` included in the Phaser package, under
 * `node_modules/phaser/resources/` directory, for a more complete
 * reference.
 *
 */


export default {

  // - Boot Assets ------------------------------------------------------------
  boot: [{
      key: 'splash-screen',
      url: 'img/train.png',
      type: 'image'
    },
    {
      key: 'progress-bar',
      url: 'img/progress-bar.png',
      type: 'image'
    }
  ],

  // - Game assets ------------------------------------------------------------
  game: [
      {
      "key": "placeholder-asdf",
      "type": "image",
      "url": "img/train.png"
    },
    {
      key: "overlay-button",
      type: "spritesheet",
      url: "img/overlay-button.png",
      frameWidth: 80,
      frameHeight: 80,
      frameMax: 3
    }
  ]



};
