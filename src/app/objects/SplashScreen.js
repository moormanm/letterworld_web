/*
 * SplashScreen
 * ============================================================================
 *
 * Shows a busy, decorated image, containing a widget displaying the resource
 * loading progress rate.
 */


class SplashScreen extends Phaser.Group {

   constructor(game) {
      super(game);


      var sprite = game.add.sprite(game.width/2  , game.height/2 - 128, 'placeholder-asdf');
      sprite.animations.add('walk');
      sprite.animations.play('walk', 10, true);

      var style = {
         font: '24px Arial',
         fill: 'white',
         align: 'center',
         boundsAlignH: 'center',
         boundsAlignV: 'middle'
      };
      var text = this.game.add.text(sprite.x + sprite.width / 2, sprite.y + sprite.height, 'LETTER WORLD IS LOADING', style); +

      this.add(sprite);
      this.add(text);
      

   }

}


export default SplashScreen;
