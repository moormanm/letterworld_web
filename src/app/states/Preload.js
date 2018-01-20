/*
 * Preload state
 * ============================================================================
 *
 * This state comprises two purposes: Take care of loading the remaining
 * assets used within your game, including graphics and sound effects, while
 * displaying a busy splash screen, showing how much progress were made
 * during the asset load.
 */

import assets from '../data/assets';
import $ from "jquery";


import CustomWordService from '../customwordservice';


// To make matters easier, I prepared a SplashScreen class, responsible for
// displaying the decorated splash screen graphic, and the progress bar.
import SplashScreen from '../objects/SplashScreen';

// A helper function to extract how many sound effects need to be decoded
// before loading the next game state.
function getSoundsToDecode(packName) {
   return assets[packName]
      .filter(({ type }) => type === 'audio' || type === 'audiosprite')
      .map(({ key }) => key);
}


export default class Preload extends Phaser.State {

   init(packName = 'game') {
      this.packName = packName;

      this.soundsToDecode = getSoundsToDecode(packName);
   }


   async preload() {
      let customWordService = new CustomWordService();
      this.showSplashScreen();
      this.loadAssets();

      this.customWords = [];

      await customWordService.enforceValidNamespaceinHash();
      
      this.customWords = await customWordService.getCustomWordsFromServer();

      var me = this;
      var p1;


      //Get the builtins
      p1 = $.ajax({
         url: 'api/words/builtins',
         type: 'get',
         success: (data) => { me.builtins = data },
         error: console.err
      });

      await p1;

      console.log('loading main game');
      console.log(this.customWords);
      this.state.start('Game', true, false, [this.builtins, this.customWords, 'hi']);

   }

   update() {

   }

   // --------------------------------------------------------------------------

   showSplashScreen() {
      new SplashScreen(this.game);

   }

   loadAssets() {
      this.load.pack(this.packName, null, assets);

      if (!this.allSoundsDecoded) {
         this.sound.onSoundDecode.add((key) => this.dequeueDecodedSound(key));
      }
   }

   dequeueDecodedSound(key) {
      const position = this.soundsToDecode.indexOf(key);

      if (position > -1) {
         this.soundsToDecode.splice(position, 1);
      }
   }

   // --------------------------------------------------------------------------

   get allSoundsDecoded() {
      return this.soundsToDecode.length === 0;
   }

}
