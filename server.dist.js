'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sqlite = require('sqlite');

var _sqlite2 = _interopRequireDefault(_sqlite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// App
const app = (0, _express2.default)();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
   extended: true
}));

const fileUpload = require('express-fileupload');
app.use(fileUpload());
var shortid = require('shortid');

var namespaceIsValid = function (namespace) {
   if (namespace == undefined) {
      throw 'namespace element not defined';
   }
};

var wordEntriesAreValid = function (words) {
   if (words == undefined) {
      throw 'words element not defined';
   }
};

var imageIdToImageUrl = function (imageId) {
   return 'imgStore/' + imageId;
};

var port = process.env.PORT || 30010; // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = _express2.default.Router(); // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/words/:userid', async (req, res, next) => {

   try {
      const [wordData] = await _bluebird2.default.all([_sqlite2.default.all('SELECT * FROM WORDS WHERE NAMESPACE = ?', req.params.userid)]);

      var ret = wordData.map(function (entry) {
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

router.post('/words/remove', async (req, res, next) => {

   var id = req.body.id;
   console.log('removing ' + id);
   try {
      const [userData] = await _bluebird2.default.all([_sqlite2.default.run('DELETE FROM WORDS WHERE ID=?', id)]);

      res.json({});
   } catch (err) {
      console.log(err);
      next(err);
   }
});

router.post('/words/add', async (req, res, next) => {

   var namespace = req.body.namespace;
   var words = req.body.words;
   try {
      namespaceIsValid(namespace);
      wordEntriesAreValid(words);
      console.log(words);
      var promises;
      promises = words.map(function (entry) {
         //Delete any existing word for this namespace
         return _sqlite2.default.run('DELETE FROM WORDS WHERE NAMESPACE = ? AND WORD = ?', namespace, entry.word);
      });

      await _bluebird2.default.all(promises);

      promises = words.map(function (entry) {
         //Add word
         return _sqlite2.default.run('INSERT INTO WORDS VALUES(null, ?, ?, ?)', namespace, entry.word, entry.imageId);
      });

      await _bluebird2.default.all(promises);

      res.send('Success');
   } catch (err) {
      console.log(err);
      next(err);
   }
});

router.post('/images/upload', function (req, res) {
   if (!req.files) {
      return res.status(400).send('No files were uploaded.');
   }

   let file = req.files.file;

   var imageId = shortid.generate();
   imageId += '.' + file.name.split('.').pop();

   var wordGuess = file.name.split('.')[0];

   var imageUrl = imageIdToImageUrl(imageId);

   file.mv(imageUrl, function (err) {
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

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use(_express2.default.static('dist'));
app.use('/imgStore', _express2.default.static('imgStore'));

// START THE SERVER
// =============================================================================

_bluebird2.default.resolve()
// First, try connect to the database 
.then(() => _sqlite2.default.open('./database.sqlite', { Promise: _bluebird2.default })).catch(err => console.error(err.stack))
// Finally, launch Node.js app 
.finally(() => {
   app.listen(port);
   console.log('Listening on port ' + port);
});

