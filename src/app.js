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
         '<input type="text" class="clearfix wordUploadInputText wordGuess" value="placeholder">' +
         '</div>' +
         '</div>'
   };


   $('#step2').hide();
   Dropzone.options.mydz = {
      paramName: "file", // The name that will be used to transfer the file
      maxFilesize: 1, // MB
      previewTemplate: "<div></div>",
      dictDefaultMessage: 'CLICK HERE TO UPLOAD YOUR IMAGES',
      acceptedFiles: 'image/*',
      resizeWidth: 800,

      transformFiles: function transformFile(file, done) {
         if (
            file.type.match(/image.*/) &&
            this.options.resizeWidth > file.width
         ) {
            return this.resizeImage(file, this.options.resizeWidth, this.options.resizeHeight, this.options.resizeMethod, done);
         } else {
            return done(file);
         }
      },
      init: function() {
         this.on('success', (file, response) => {
            wordAssociateToImageList.add({ 'image': response.imageUrl, 'imageNameHolder': response.imageId, 'wordGuess': response.wordGuess });
            console.log(response);
            console.log('finished')
         });

         this.on('queuecomplete', () => {
            console.log('HELLO THERE');


            $('#step2').show();


            //Setup remove button for each
            $('.uploadedImageTarget .img-wrap .close').on('click', function() {
               var id = $(this).closest('.img-wrap').find('img').data('id');
               wordAssociateToImageList.remove('imageNameHolder', id);
               console.log("clicked");
            });

         });

         //Setup save button handler
         $('#saveWordsButton').on('click', function() {

            var entries = $('.uploadedImageTarget').map(function(idx, value) {
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
               error: console.error
            })

         });
      }

   };







   var closeHandler = () => {
      window.dispatchEvent(new CustomEvent('overlayClosed', { detail: 'myParams here' }));
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
            error: console.error
         })
      });

   };


   window.loadSettings = () => {
      $.ajax({
         url: 'api/words/' + window.location.hash.split('#')[1],
         type: 'get',
         success: loadSettingsOnSuccess,
         error: console.err
      });
   };

}


export function init() {
   const game = new Phaser.Game(640, 480, Phaser.AUTO);

   // Dynamically add all required game states.
   Object.keys(states).forEach((key) => game.state.add(key, states[key]));

   game.state.start('Boot');

   initSettings();

   return game;
}
