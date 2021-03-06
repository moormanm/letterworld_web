'use strict';
import express from 'express';
import Promise from 'bluebird';
import db from 'sqlite';
import gTTS from 'gtts'

var async = require('async');
var morgan = require('morgan')
var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');

var builtins = [];

var walkSync = function(dir, filelist) {
   var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
   filelist = filelist || [];
   files.forEach(function(file) {
      if (fs.statSync(dir + file).isDirectory()) {
         filelist = walkSync(dir + file + '/', filelist);
      } else {
         filelist.push(file);
      }
   });
   return filelist;
};


// App
const app = express();

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))


var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
   extended: true
}));

const fileUpload = require('express-fileupload');
app.use(fileUpload());
var shortid = require('shortid');


gTTS.prototype.getPayload = function(part, idx) {
   var self = this;
   console.log('lollerskates!!');
   return {
      'ie': 'UTF-8',
      'q': part,
      'tl': self.lang,
      'ttsspeed': 0.3,
      'total': self.text_parts.length,
      'idx': idx,
      'client': 'tw-ob',
      'textlen': part.length,
      'tk': self.token(part)
   };
}


var namespaceIsValid = function(namespace) {
   if (namespace == undefined) {
      throw 'namespace element not defined';
   }
   if (/[^A-Z0-9a-z]+/.test(namespace)) {
      throw 'namespace is not valid';
   }
   return true;
}



var wordIsValid = function(word) {
   if (!/[A-Z]+/.test(word)) {
      throw 'Word is not valid';
   }
}

var soundPath = function(word) {
   return 'soundStore/' + word.toLowerCase() + '.mp3';
}
var imageIdToImageUrl = function(imageId) {
   return 'imgStore/' + imageId;
};

var downloadSoundIfNeeded = function(word, callback) {
   existence(
      soundPath(word),
      () => { if (callback) callback(null, null); },
      () => { startAudioDownload(word, callback) }
   );
};

var existence = function(path, existsCallback, doesntExistCallback) {
   fs.stat(path, function(err, stats) {

      //Check if error defined and the error code is "not exists"
      if (err && err.code == 'ENOENT') {
         doesntExistCallback();
      } else {
         existsCallback();
      }
   });
}


var startAudioDownload = function(word, callback) {
   var gtts = new gTTS(word, 'en');
   var soundFile = soundPath(word);
   gtts.save(soundFile, function(err, result) {
      if (err) {
         console.log('error in download: ' + err)
      } else {
         console.log('Success! Open file ' + soundFile);
      }
      if (callback) {
         callback(err, null);
      }
   });
}


var acceptableExts = ['.jpg', '.jpeg', '.png'];


var makeBuiltinWordsArray = function() {
   var ret = []
   var allFiles = walkSync('builtins/');
   for (let f of allFiles) {

      if (f.lastIndexOf('.') == -1) {
         continue;
      }

      var ext = f.substring(f.lastIndexOf('.'));

      if (!acceptableExts.some((v) => { return ext.indexOf(v) >= 0 })) {
         continue;
      }

      var word = f.substring(0, f.lastIndexOf('.'))

      ret.push({
         word: word,
         key: word,
         url: 'builtins/' + f

      });
   }
   return ret;

};






var port = process.env.PORT || 30010; // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

router.get('/words/builtins', function(req, res) {
   return res.json(builtins);
});


router.get('/words/:userid', async(req, res, next) => {

   try {
      const [wordData] = await Promise.all([
         db.all('SELECT * FROM WORDS WHERE NAMESPACE = ?', req.params.userid)

      ]);

      var ret = wordData.map(function(entry) {
         var entryMod = entry;
         entryMod.image = imageIdToImageUrl(entry.image);
         return entryMod;
      });


      console.log(ret);
      res.json(ret);
   } catch (err) {
      console.log(err);
      next(err);
   }

});

router.post('/words/remove', async(req, res, next) => {

   var id = req.body.id;
   console.log('removing ' + id);
   try {
      const [userData] = await Promise.all([
         db.run('DELETE FROM WORDS WHERE ID=?', id)
      ]);



      res.json({});
   } catch (err) {
      console.log(err);
      next(err);
   }

});

router.get('/isvalidnamespace/:namespace', (req, res) => {
   namespaceIsValid(req.params.namespace);
   res.json({});
});


router.post('/words/add', async(req, res, next) => {

   var namespace = req.body.namespace;
   var words = req.body.words;
   try {
      namespaceIsValid(namespace);

      words.map(function(entry) {
         wordIsValid(entry.word);
      });



      var promises;
      promises = words.map(function(entry) {
         //Delete any existing word for this namespace
         return db.run('DELETE FROM WORDS WHERE NAMESPACE = ? AND WORD = ?', namespace, entry.word);
      });

      await Promise.all(promises);

      promises = words.map(function(entry) {
         //Add word
         return db.run('INSERT INTO WORDS VALUES(null, ?, ?, ?)', namespace, entry.word, entry.imageId);
      });

      await Promise.all(promises);


      words.map(function(entry) {
         downloadSoundIfNeeded(entry.word);
      });

      res.send('Success');

   } catch (err) {
      console.log(err);
      next(err);
   }

});

router.post('/images/upload', function(req, res) {
   if (!req.files) {
      return res.status(400).send('No files were uploaded.');
   }



   let file = req.files.file;

   var imageId = shortid.generate();
   imageId += '.' + file.name.split('.').pop();

   var wordGuess = file.name.split('.')[0];
   wordGuess = wordGuess.replace(/[^a-zA-Z]/g, '');

   var imageUrl = imageIdToImageUrl(imageId);

   file.mv(imageUrl, function(err) {
      if (err) {
         return res.status(500).send(err);
      }
      res.send({
         imageId: imageId,
         imageUrl: imageUrl,
         wordGuess: wordGuess
      });
   });



});

var wordsHtmlTemplate;

app.get('/words.html', function(req, res) {

   res.send(wordsHtmlTemplate({ words: builtins }));
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use(express.static('dist'));
app.use('/imgStore', express.static('imgStore'));
app.use('/builtins', express.static('builtins'));
app.use('/soundStore', express.static('soundStore'));



var initMethod = async function() {
   await db.open('./database.sqlite');
   builtins = makeBuiltinWordsArray();
   var customs = await db.all('SELECT DISTINCT WORD FROM WORDS');
   //Download all audio that's needed
   async.eachSeries(builtins, function iteratee(item, callback) {
      downloadSoundIfNeeded(item.word, callback);
   });

   //Download all audio that's needed for customs
   async.eachSeries(customs, function iteratee(item, callback) {
      downloadSoundIfNeeded(item.word, callback);
   });


  
   fs.readFile('templates/words.html', 'utf-8', function(error, source) {
      wordsHtmlTemplate = handlebars.compile(source);
   });


};


// START THE SERVER
// =============================================================================
Promise.resolve()
   .then(initMethod())
   .finally(() => {
      app.listen(port);
      console.log('Listening on port ' + port);
   });
