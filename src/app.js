/*
 * The `app` module
 * ============================================================================
 *
 * The module providing the main routine of the game application launch.
 */

// Import all declared states as an object.
import * as states from './app/states';

import $ from "jquery";
import List from 'list.js';
import Dropzone from "dropzone";

export function initSettings() {


   var clearErrors = () => {
      $('#errorMessagesDiv').hide();
      $('#errorMessages').empty();
   };
   var addError = (text) => {
      $('#errorMessagesDiv').show();
      $('#errorMessages').append("<li>" + text + '</li>');
   };

   var wordListOptions = {
      valueNames: [
         { name: 'image', attr: 'src' },
         { name: 'dataID', attr: 'data-id' },
         'word'

      ],
      item: '<div class="col-md-4 previewItemPadding wordTarget">' +
         '<div class="img-wrap">' +
         '<span class="close">&times;</span>' +
         '<img class="image tinyImage dataID" src="placeholder" data-id="placeholder"/>' +
         '</div>' +
         '<p class="word"></p>' +
         '</div>'
   };


   var wordAssociateToImageListOptions = {
      valueNames: [
         { name: 'image', attr: 'src' },
         { name: 'imageNameHolder', attr: 'data-id' },
         { name: 'wordGuess', attr: 'value' }
      ],
      item: '<div class="col-md-4 previewItemPadding uploadedImageTarget">' +
         '<div class="img-wrap">' +
         '<span class="close">&times;</span>' +
         '<img class="image tinyImage imageNameHolder" src="placeholder" data-id="placeholder"/>' +
         '</div>' +
         '<div>' +
         '<input type="text" class="clearfix wordUploadInputText wordGuess" value="placeholder" >' +
         '</div>' +
         '</div>'
   };

   var readImageAndThenDo = (file, callback) => {
      var useBlob = true;
      // Create a new FileReader instance
      // https://developer.mozilla.org/en/docs/Web/API/FileReader
      var reader = new FileReader();

      // Once a file is successfully readed:
      reader.addEventListener("load", function() {

         // At this point `reader.result` contains already the Base64 Data-URL
         // and we've could immediately show an image using
         // `elPreview.insertAdjacentHTML("beforeend", "<img src='"+ reader.result +"'>");`
         // But we want to get that image's width and height px values!
         // Since the File Object does not hold the size of an image
         // we need to create a new image and assign it's src, so when
         // the image is loaded we can calculate it's width and height:
         var image = new Image();
         image.addEventListener("load", function() {
            callback(image);
            if (useBlob) {
               // Free some memory for optimal performance
               window.URL.revokeObjectURL(image.src);
            }
         });

         image.src = useBlob ? window.URL.createObjectURL(file) : reader.result;

      });

      // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
      reader.readAsDataURL(file);
   }

   $('#step2').hide();
   Dropzone.options.mydz = {
      paramName: "file", // The name that will be used to transfer the file
      maxFilesize: 256, // Really big - it gets resized on the user browser anyway
      previewTemplate: document.querySelector('#dzTemplate').innerHTML,
      dictDefaultMessage: 'CLICK OR DRAG FILES HERE TO UPLOAD YOUR IMAGES',
      acceptedFiles: 'image/*',
      maxWidth: 600,
      maxHeight: 1000,

      transformFile: function(file, done) {
         if (!file.type.match(/image.*/)) {
            return done(file);
         }


         var resizeIfNeeded = (img) => {

            var needToResize = false;
            if (this.options.maxWidth < img.width || this.options.maxHeight < img.height) {
               needToResize = true;
            }

            if (!needToResize) {
               return done(file);
            }



            var resizeOnXDimension = () => {
               var aspectRatio =  img.height / img.width;
               var newWidth = this.options.maxWidth;
               var newHeight = Math.round(newWidth * aspectRatio);

               console.log('scaling on X, from ' + img.width + 'x' + img.height + ' to ' + newWidth + 'x' + newHeight);
               this.resizeImage(file, newWidth, newHeight, this.options.resizeMethod, done);
            };


            var resizeOnYDimension = () => {
               var aspectRatio =   img.width / img.height; 
               var newHeight = this.options.maxHeight;
               var newWidth = Math.round(newHeight * aspectRatio);
               console.log('scaling on Y, from ' + img.width + 'x' + img.height + ' to ' + newWidth + 'x' + newHeight);
               this.resizeImage(file, newWidth, newHeight, this.options.resizeMethod, done);
            };

            var distanceX = img.width - this.options.maxWidth;
            var distanceY = img.height - this.options.maxHeight;
            if (distanceX > distanceY) {
               return resizeOnXDimension();
            } else {
               return resizeOnYDimension();
            }
         }


         readImageAndThenDo(file, resizeIfNeeded);


      },
      init: function() {
         this.on('success', (file, response) => {
            window.wordAssociateToImageList.add({ 'image': response.imageUrl, 'imageNameHolder': response.imageId, 'wordGuess': response.wordGuess });
            console.log(response);
            console.log('finished')
         });

         this.on('error', (file, errorMessage) => {
            addError(file.name + ' : ' + errorMessage);
         });

         this.on('queuecomplete', () => {



            //Did any images make it through?
            if (window.wordAssociateToImageList.size() == 0) {
               return; //No work to do
            }

            $('#step2').show();

            //Add restricted input
            $('.wordGuess').keypress(function(e) {

               var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
               if (/[a-zA-Z]/.test(str)) {
                  return true;
               }

               e.preventDefault();
               return false;
            });

            //Setup remove button for each
            $('.uploadedImageTarget .img-wrap .close').on('click', function() {
               var id = $(this).closest('.img-wrap').find('img').data('id');
               window.wordAssociateToImageList.remove('imageNameHolder', id);
               console.log("clicked");
            });

         });

         //Setup save button handler
         $('#saveWordsButton').on('click', function() {
            clearErrors();
            var entries = $('.uploadedImageTarget').map(function() {
               var word = $(this).find('.wordUploadInputText').val().toUpperCase();
               var imageId = $(this).find('.imageNameHolder').data('id');
               var obj = { word: word, imageId: imageId };
               return obj;
            });

            $.ajax({
               url: 'api/words/add',
               type: 'POST',
               contentType: 'application/json; charset=utf-8',
               dataType: 'text',
               data: JSON.stringify({
                  namespace: window.location.hash.split('#')[1],
                  words: $.makeArray(entries)
               }),
               success: () => {
                  //clear and update
                  window.wordAssociateToImageList.clear();
                  window.wordList.clear();
                  window.loadSettings();

               },
               error: addError
            })

         });
      }

   };



   var closeHandler = () => {
      clearErrors();


      //Pass the word list back to the game
      var ret = window.wordList.items.map(function(item) {
         var entry = item.values();
         return {
            word: entry.word,
            imageUrl: entry.image
         };
      });

      window.dispatchEvent(new CustomEvent('overlayClosed', { detail: ret }));
      console.log('closing..');
   };

   $('#settings-overlay').on('dialogclose', closeHandler);
   $('#settings-overlay').on('cancel', closeHandler);

   $('.closeDialog').on('click', function() {
      $('#settings-overlay').get(0).close();
      closeHandler();


   });


   window.wordList = new List('word-list', wordListOptions);

   window.wordAssociateToImageList = new List('word-associate-to-image-list', wordAssociateToImageListOptions)

   var loadSettingsOnSuccess = function(data) {
      if (window.wordAssociateToImageList.size() == 0) {
         $('#step2').hide();
      }

      for (var i in data) {
         var ent = { image: data[i].image, word: data[i].word, dataID: data[i]['id'] };
         console.log(ent);
         window.wordList.add(ent);
      }
      window.wordList.sort('word', { order: "asc" })
      $('.wordTarget .img-wrap .close').on('click', function() {
         console.log('closing wordTarget');
         var id = $(this).closest('.img-wrap').find('img').data('id');
         $.ajax({
            url: 'api/words/remove',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'text',
            data: JSON.stringify({
               id: id
            }),
            success: () => {
               window.wordList.remove('dataID', id);
               window.wordList.sort('word', { order: "asc" })
            },
            error: addError
         })
      });

   };


   window.loadSettings = () => {
      $.ajax({
         url: 'api/words/' + window.location.hash.split('#')[1],
         type: 'get',
         success: loadSettingsOnSuccess,
         error: addError
      });
   };

}


export function init() {
   const game = new Phaser.Game(window.width, window.height, Phaser.AUTO);

   // Dynamically add all required game states.
   Object.keys(states).forEach((key) => game.state.add(key, states[key]));

   game.state.start('Boot');

   initSettings();

   return game;
}
