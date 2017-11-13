   /*
    * Game state
    * ============================================================================
    *
    * A sample Game state, displaying the Phaser logo.
    */
   import assetslazy from '../data/assetslazy';
   import $ from "jquery";
   export default class Game extends Phaser.State {



      create() {


         this.game.load.onFileComplete.add(this.loadCompleteEvent, this);
         this.input.onDown.add(this.gofull, this);
         this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
         this.game.scale.parentIsWindow = true;
         this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
         this.game.scale.onSizeChange.add(this.onSizeChange, this);
         this.builtIns = {};
         this.overlayButton = this.game.add.button(this.game.width - 100, 100, 'overlay-button', this.overlayButtonHandler, this, 1, 0, 2);


         for (let entry of assetslazy.images) {
            this.builtIns[entry['key']] = entry;
         }

         this.soundEntries = {};
         this.loadedSounds = {};
         for (let entry of assetslazy.sounds) {
            this.soundEntries[entry['key']] = entry;
         }


         var style = {
            font: '65px Arial',
            fill: 'white',
            align: 'center',
            boundsAlignH: 'center',
            boundsAlignV: 'middle'
         };

         this.text = this.game.add.text(0, 0, '', style);
         this.letterworld = this.game.add.text(0, 0, '', style);


         this.enableKeyCapture = function(val) {
            if (!val) {
               this.game.input.keyboard.reset(true);
               this.game.input.keyboard.clearCaptures();
               
               this.game.input.keyboard.onPressCallback = null;
            } else {
               //  Capture all key presses
               this.game.input.keyboard.addCallbacks(this, null, null, this.keyPress);
               var backspace = this.game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
               backspace.onDown.add(function() { this.keyPress(Phaser.Keyboard.BACKSPACE); }, this);
            }

         };
         this.enableKeyCapture(true);

         //Get a timeout event every second
         this.game.time.events.loop(Phaser.Timer.SECOND, this.runTimeoutEvents, this);

         this.lastKeyPressedTime = 0;
         this.lastImageMatchedTime = 0;

         this.showLetterWorld(true);

         this.setupUserData();
      }

      setupUserData() {
         //Is hash set?
         if (window.location.hash) {
            console.log('calling api');
            $.ajax({
               url: 'api/words/' + window.location.hash.split('#')[1],
               type: 'get',
               success: this.consumeUserDataFromServer,
               error: this.errorSadFace
            })
         } else {
            window.location.hash = this.randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
         }



      }

      errorSadFace(xhr, status, error) {
         console.error(status + error);
      }

      consumeUserDataFromServer(data) {
         console.log(data);
      }

      randomString(length, chars) {
         var result = '';
         for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
         return result;
      }

      update() {





      }

      runTimeoutEvents() {
         var currentTime = this.game.time.totalElapsedSeconds();

         var textTimeout = 7;
         if (this.matchedImage) {
            textTimeout = 15;
         }
         if (this.text.text != '' && currentTime > (this.lastKeyPressedTime + textTimeout)) {
            this.text.text = '';
            this.clearMatchedImage();
         }


         var splashScreenTimeout = 15;
         if (!this.letterWorldIsShowing() && currentTime > (this.getLastGameEventTime() + splashScreenTimeout)) {
            this.showLetterWorld(true);
         }


      }

      letterWorldIsShowing() {
         return this.splashScreenIsUp;
      }

      showLetterWorld(val) {
         this._letterworldIsShowing = val;
         if (val) {
            this.letterworld.text = 'LETTER WORLD';
         } else {
            this.letterworld.text = '';
         }
      }

      overlayButtonHandler() {
         console.log('doin it');

         var me = this;
         this.enableKeyCapture(false);
         window.wordList.clear();
         window.loadSettings();

         window.dispatchEvent(new CustomEvent('showOverlay', { detail: 'myParams here' }));
         window.addEventListener('overlayClosed', function(e) {
            me.enableKeyCapture(true);
            console.log('closed it');
         });

      }

      getLastGameEventTime() {
         return Math.max(
            this.lastKeyPressedTime,
            this.lastImageMatchedTime

         );
      }

      clearMatchedImage() {
         if (this.matchedImage) {
            this.matchedImage.destroy();
            this.matchedImage = null;
         }
      }


      setMatchedImage(cacheKey) {
         this.clearMatchedImage();

         //is it loaded yet?
         if (!this.cache.checkKey(Phaser.Cache.IMAGE, cacheKey)) {
            this.setMatchedImage('placeholder-asdf');
            this.loadMatchedImage(cacheKey);
            return;
         }

         this.matchedImage = this.game.add.sprite(80, 80, cacheKey);
         this.lastImageMatchedTime = this.game.time.totalElapsedSeconds();
      }

      debug(text) {
         var xd = 350;
         var yd = 0;
         var yi = 32;
         this.game.debug.text(text, xd, yd += yi);

      }


      gofull() {
         var mouse = this.game.input.mousePointer;
         if (this.overlayButton.getBounds().contains(mouse.x, mouse.y)) {
            return;
         }

         if (this.scale.isFullScreen) {


         } else {
            this.scale.startFullScreen(true); //true=antialiasing ON, false=antialiasing off
         }

      }

      onSizeChange() {
         this.overlayButton.x = this.game.width - 100;
         this.overlayButton.y = 20;
         this.text.setTextBounds(0, 0, this.game.width, this.game.height);
         this.letterworld.setTextBounds(0, 0, this.game.width, this.game.height);
      }

      keyPress(char) {

         this.showLetterWorld(false);

         char = String(char);

         //backspace
         if (char == 8 && this.text.text) {
            this.text.text = this.text.text.substring(0, this.text.text.length - 1);
         }

         //Take input
         if (char.match(/[a-z]/i)) {
            this.text.text += char.toUpperCase();
         }


         this.lastKeyPressedTime = this.game.time.totalElapsedSeconds();

         //Check for matching image
         var key = this.text.text.toLowerCase();
         var entry = this.getPossibleImage(key);
         if (entry != null) {
            this.setMatchedImage(key);
            var soundKey = key + '-audio';
            var soundEntry = this.soundEntries[soundKey];
            if (soundEntry != null) {
               this.playSound(soundKey);
            }
         } else {
            this.clearMatchedImage();
         }


      }


      loadMatchedImage(cacheKey) {
         console.log('key is ' + cacheKey);
         var entry = this.getPossibleImage(cacheKey);
         this.game.load.image(entry.key, entry.url);
         console.log('starting load for ' + entry);
         this.game.load.start();

      }

      playSound(cacheKey) {
         console.log('playing ' + cacheKey);
         //is it loaded yet?
         if (!this.cache.checkKey(Phaser.Cache.SOUND, cacheKey)) {
            console.log('sound not yet loaded, trying to load it');
            var entry = this.soundEntries[cacheKey];
            this.game.load.audio(cacheKey, entry.url);
            this.game.load.start();
            return;
         }

         var sound = this.loadedSounds[cacheKey];


         if (sound.isDecoded) {
            console.log('playing sound');
            sound.play();
         }


      }

      loadCompleteEvent(progress, cacheKey, success) {
         console.log('loaded ' + cacheKey);
         //Is it an image?
         var imageEntry = this.getPossibleImage ( cacheKey );
         if (imageEntry != null) {
            this.setMatchedImage(cacheKey);
         } else {
            //sound
            console.log('loading sound');
            this.loadedSounds[cacheKey] = this.game.add.audio(cacheKey);
            console.log(this.loadedSounds[cacheKey]);
            this.game.sound.setDecodedCallback([this.loadedSounds[cacheKey]], () => this.playSound(cacheKey), this);
         }
      }

      getPossibleImage( word ) {
         var ret = this.builtIns[word];
         if(ret) {
            return ret;
         }


      } 
   }
