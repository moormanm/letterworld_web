import CustomWordService from '../customwordservice';
export default class Game extends Phaser.State {
   init(initArgs) {

      var builtinsArray, customsArray;
      builtinsArray = initArgs[0];
      customsArray = initArgs[1];
      this.builtIns = {};
      for (let entry of builtinsArray) {
         this.builtIns[entry['word']] = entry;
      }
      this.customWords = {};
      this.cacheEntryLookup = {};
      this.setCustomWords(customsArray);
      var me = this;

      var customWordService = new CustomWordService();
      window.onhashchange = async function() {
         customWordService.enforceValidNamespaceinHash();
         var words = await customWordService.getCustomWordsFromServer();
         me.setCustomWords(words);
      };
   }


   create() {



      this.game.load.onFileComplete.add(this.loadCompleteEvent, this);
      this.input.onDown.add(this.gofull, this);
      this.game.scale.onSizeChange.add(this.onSizeChange, this);

      this.overlayButton = this.game.add.button(this.game.width - 100, 100, 'overlay-button', this.overlayButtonHandler, this, 1, 0, 2);



      this.loadedSounds = {};



      var style = {
         font: '65px Arial',
         fill: 'white',
         align: 'center',
         boundsAlignH: 'center',
         boundsAlignV: 'middle'
      };

      this.text = this.game.add.text(0, 0, '', style);
      this.letterworld = this.game.add.text(0, 0, '', style);
      this.letterworld.text = 'LETTER WORLD';

      var backspace = this.game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
      var f2 = this.game.input.keyboard.addKey(Phaser.Keyboard.F2);
      backspace.onDown.add(function() {
         this.keyPress(Phaser.Keyboard.BACKSPACE);
      }, this);

      f2.onDown.add(function() {
          if(this.autoPilotIsRunning) {
             this.autoPilotIsRunning = false;
          }
          else {
             this.startAutoPilot();
          }
          
      }, this);

      this.game.input.keyboard.clearCaptures();
      this.enableKeyCapture = function(val) {
         if (!val) {
            this.game.input.keyboard.onPressCallback = null;

         } else {
            //  Capture all key presses
            this.game.input.keyboard.addCallbacks(this, null, null, this.keyPress);



         }

      };
      this.enableKeyCapture(true);

      //Get a timeout event every second
      this.game.time.events.loop(Phaser.Timer.SECOND, this.runTimeoutEvents, this);

      this.lastKeyPressedTime = 0;
      this.lastImageMatchedTime = 0;
      this.autoPilotIsRunning = false;

      this.onSizeChange();


      this.showLetterWorld(true);

      this.playThisSoundWhenDoneLoading = null;
      this.showThisImageWhenDoneLoading = null;
      this.allowMatching = true;


   }


   errorSadFace(xhr, status, error) {
      console.error(status + error);
   }



   update() {



   }

   runTimeoutEvents() {
      var currentTime = this.game.time.totalElapsedSeconds();

      var textTimeout = 7;
      if (this.matchedImageGroup) {
         textTimeout = 15;
      }
      if (this.text.text != '' && currentTime > (this.lastKeyPressedTime + textTimeout)) {
         this.text.text = '';
         this.clearMatchedImage();
      }


      var splashScreenTimeout = 35;
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
         this.letterworld.visible = true;
      } else {
         this.letterworld.visible = false;
      }
   }

   overlayButtonHandler() {
      console.log('doin it');

      var me = this;
      this.enableKeyCapture(false);
      window.wordList.clear();
      window.loadSettings();

      window.dispatchEvent(new CustomEvent('showOverlay', {
         detail: 'myParams here'
      }));
      window.addEventListener('overlayClosed', function(e) {
         me.enableKeyCapture(true);
         var customWords = e.detail;
         me.setCustomWords(customWords);

      });

   }

   getLastGameEventTime() {
      return Math.max(
         this.lastKeyPressedTime,
         this.lastImageMatchedTime

      );
   }

   clearMatchedImage() {
      if (this.matchedImageGroup) {
         this.matchedImageGroup.destroy(true, true);
         this.matchedImageGroup = null;
      }
   }

   showLoadingSprite(val) {

      if (val) {
         this.loadingSpriteGroup = this.game.add.group();

         var sprite = this.game.add.sprite(this.game.width / 2, this.game.height / 8, 'placeholder-asdf');
         sprite.anchor.x = 0.5;
         sprite.anchor.y = 0.5;

         sprite.animations.add('walk');
         sprite.animations.play('walk', 10, true);

         var style = {
            font: '24px Arial',
            fill: 'white',
            align: 'center',
            boundsAlignH: 'center',
            boundsAlignV: 'middle'
         };
         var text = this.game.add.text(sprite.x, sprite.y + sprite.height, 'LOADING...', style);
         text.anchor.x = 0.5;
         text.anchor.y = 0.5;


         this.loadingSpriteGroup.add(text);
         this.loadingSpriteGroup.add(sprite);



      } else {
         if (this.loadingSpriteGroup) {
            this.loadingSpriteGroup.destroy(true, false);
            this.loadingSpriteGroup = null;
         }
      }
   }



   setMatchedImage(entry) {

      this.showLoadingSprite(false);
      this.clearMatchedImage();
      //Is the displayed word on screen still relevant? This can happen since there is a loading delay.
      var key = this.text.text.toLowerCase();
      if (!this.getPossibleImage(key)) {
         return;
      }



      //is it loaded yet?
      if (!this.cache.checkKey(Phaser.Cache.IMAGE, entry.key)) {
         this.showLoadingSprite(true);
         this.loadMatchedImage(entry);
         return;
      }



      var me = this;
      var topLeft = this.game.add.sprite(80, 80, entry.key);


      //var bottomLeft = this.game.add.sprite(80,  this.game.height - 80 - topLeft.height, entry.key);
      //var topRight = this.game.add.sprite(this.game.width - 80 - topLeft.width, 80, entry.key);
      //var bottomRight = this.game.add.sprite(this.game.width - 80 - topLeft.width, this.game.height - 80 - topLeft.height, entry.key);



      this.matchedImageGroup = this.game.add.group();
      this.matchedImageGroup.add(topLeft);
      //this.matchedImageGroup.add( bottomLeft );
      //this.matchedImageGroup.add(topRight);
      //this.matchedImageGroup.add( bottomRight );

      var tweenDelay = 12000;
      var tweenMoveTime = 1000;

      var tween;
      var tween2;

      //Top left tween
      tween = this.game.add.tween(topLeft);
      tween.from({
         x: 0 - topLeft.width
      }, tweenMoveTime, 'Linear', true, 0);
      tween.onComplete.add(function() {
         tween2 = me.game.add.tween(topLeft);
         tween2.to({
            x: 0 - topLeft.width
         }, tweenMoveTime, 'Linear', true, tweenDelay);
      });


      //Top right
      /*
      tween = this.game.add.tween(topRight);
      tween.from({ x: me.game.width }, tweenMoveTime, 'Linear', true, 0);
      tween.onComplete.add(function() {
         tween2 = me.game.add.tween(topRight);
         tween2.to({ x: me.game.width }, tweenMoveTime, 'Linear', true, tweenDelay);
      });
      */

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
         this.scale.stopFullScreen();

      } else {
         this.scale.startFullScreen(true); //true=antialiasing ON, false=antialiasing off
      }

   }

   onSizeChange() {
      this.overlayButton.x = this.game.width - 100;
      this.overlayButton.y = 20;
      this.text.setTextBounds(0, 0, this.game.width, this.game.height);
      this.letterworld.setTextBounds(0, 0, this.game.width, this.game.height);
      this.clearMatchedImage();
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
      if (entry != null && this.allowMatching) {
         console.log('matched');
         console.log(entry);
         this.setMatchedImage(entry);

         //Try to play the sound - it might fail if its not loaded yet but who cares
         var soundKey = key + '.mp3';
         this.playSound(soundKey);
      } else {
         this.clearMatchedImage();
      }


   }


   loadMatchedImage(entry) {

      console.log('key is ' + entry.key);

      this.game.load.image(entry.key, entry.url);
      console.log('starting load for ')
      console.log(entry);

      this.showThisImageWhenDoneLoading = entry.key;
      this.game.load.start();

   }


   playSound(cacheKey, params) {
      console.log(params);
      console.log('playing ' + cacheKey);
      //is it loaded yet?
      if (!this.cache.checkKey(Phaser.Cache.SOUND, cacheKey)) {
         console.log('sound not yet loaded, trying to load it');
         this.playThisSoundWhenDoneLoading = cacheKey;
         this.game.load.audio(cacheKey, 'soundStore/' + cacheKey);
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
      if (!success) {
         console.error("Failed to load " + cacheKey);
         return;
      }
      console.log('loaded ' + cacheKey);
      //Is it an image?
      var imageEntry = this.imageEntryFromCacheKey(cacheKey);
      if (imageEntry != null ) {
         if(this.showThisImageWhenDoneLoading == cacheKey) {
            this.setMatchedImage(imageEntry);
         }
      } else {
         //sound
         console.log('loading sound');
         this.loadedSounds[cacheKey] = this.game.add.audio(cacheKey);
         console.log(this.loadedSounds[cacheKey]);

         if(this.playThisSoundWhenDoneLoading == cacheKey) {
            this.game.sound.setDecodedCallback([this.loadedSounds[cacheKey]], (params) => this.playSound(cacheKey, params), this) ;
         }
      }
   }

   getPossibleImage(word) {

      //Is it a custom word?
      var ret = this.customWords[word];
      if (ret) {
         return ret;
      }


      //Builtin?
      ret = this.builtIns[word];
      if (ret) {
         return ret;
      }

      return null;

   }


   setCustomWords(words) {
      var newWords = {};
      var cacheEntryLookup = {};
      for (let x of words) {
         var entry = {
            key: x.imageUrl,
            url: x.imageUrl,
            word: x.word
         };
         newWords[x.word.toLowerCase()] = entry;
         cacheEntryLookup[x.imageUrl] = entry;
      }
      //Todo : diff the new words and old words, purge the deleted ones from cache
      this.customWords = newWords;
      this.cacheEntryLookup = cacheEntryLookup;

   }

  
   startAutoPilot() {
      this.autoPilotIsRunning = true;
      var me = this;
      var keys = Object.keys(this.cacheEntryLookup).concat(Object.keys( this.builtIns));
      

      var startNewWord, nextLetter, preloadword;
      nextLetter = function(word, i) {
         if(!me.autoPilotIsRunning) {
            me.allowMatching = true;
            return;
         }

         if( i == word.length - 1) {
            me.allowMatching = true;
         }
         
         me.keyPress(word.charAt(i));        
         if( i == word.length - 1) {
            window.setTimeout(startNewWord, 7000);
         }
         else {
            window.setTimeout( () => nextLetter(word, i+1), 620);
         }
      } 


      startNewWord = function() { 
         me.allowMatching = false;
         var randomIndex = Math.floor(Math.random() * keys.length);
         var word = keys[randomIndex];
         preloadword(word);
         me.text.text = '';
         nextLetter(word,0);
      };

      preloadword = function(word) {
         if (!me.cache.checkKey(Phaser.Cache.IMAGE, word)) {  
            var imgEntry = me.imageEntryFromCacheKey(word);
            me.game.load.image(imgEntry.key, imgEntry.url);
         }       
         var soundkey = word + '.mp3';
         if (!me.cache.checkKey(Phaser.Cache.SOUND, soundkey)) {
            me.game.load.audio(soundkey, 'soundStore/' + soundkey);
            
         }
         me.game.load.start();
      };

     

      startNewWord();

   }


   imageEntryFromCacheKey(cacheKey) {
      //is it a custom entry?
      var ret;
      ret = this.cacheEntryLookup[cacheKey];

      if (ret) {
         return ret;
      }

      return this.builtIns[cacheKey];

   }





}