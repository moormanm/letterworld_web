import $ from "jquery";

export default class CustomWordService {

   randomString(length, chars) {
      var result = '';
      for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
   }

   setRandomHash() {
      window.location.hash = this.randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
   }


   async enforceValidNamespaceinHash() {

      var me = this;
      //Is hash set?
      if (window.location.hash) {
         console.log('calling api');
         var p1 = $.ajax({
            url: 'api/isvalidnamespace/' + window.location.hash.split('#')[1],
            type: 'get',
            success: console.log('user id is valid'),
            error: me.setRandomHash
         });
         await p1;
      } else {
         me.setRandomHash();
      }
   }


   async getCustomWordsFromServer() {
      var results; 
      var p1 = $.ajax({
         url: 'api/words/' + window.location.hash.split('#')[1],
         type: 'get',
         success: (data) => { results = data },
         error: console.err
      });
      await p1;

      var words = [];
      for (var i in results) {
         var ent = { imageUrl: results[i].image, word: results[i].word };
         console.log(ent);
         words.push(ent);
      }
      console.log('finished customs');
      return words;
   }



}
