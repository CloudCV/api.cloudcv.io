var express = require('express')
  , http = require('http')
  , path = require('path')
  , cookieParser = require('cookie-parser')
  , errorhandler = require('errorhandler')
  , multer     = require('multer')
  , methodOverride = require('method-override')
  , async = require('async')
  , request = require('request')
  , cv = require('cloudcv-backend')
  ;

var app = express();

// Configuration
app.set('port', process.env.PORT || 3000);
app.set('title', 'api.cloudcv.io');

//app.use(express.favicon());
//app.use(express.logger('dev'));

app.use(methodOverride());
app.use(multer({ dest: './uploads/'}));
app.use(cookieParser('optional secret string'));

//var env = process.env.NODE_ENV || 'development';
app.use(errorhandler());  


app.get('/v1/image/analyze/:image', function (req, res) {

    var externalImageURL = decodeURIComponent(req.params.image);

    // Construct request data
    var requestSettings = {
        method: 'GET',
        url: externalImageURL,
        encoding: null
    };


    async.waterfall([
        function (callback){
            request(requestSettings, function (error, response, body) { callback(error, response, body); });
        },
        function (response, image, callback) {
            cv.analyzeImage(image, callback);
        }
        ], function (err, result) {
        if (err) {
            console.error(err);            
            return renderDefaultPage();
        }
        else {
            console.log(result);            
            return renderResultView(result);
        }
    });
});

app.post('/v1/image/analyze/', function (req, res) {

    if (req.files && req.files.image) {
        var uploadedImagePath = req.files.image.path;
    }
    
    async.waterfall([
        function (callback){
            fs.readFile(uploadedImagePath, callback);
        },
        function (imageData, callback) {
            cv.loadImage(imageData, callback);
        },
        function (imview, callback) {
            cv.analyzeImage(image, callback); 
        },   
        ], 
        function (err, result) {

            fs.unlink(uploadedImagePath);

            if (err) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(err));
                res.end();
            }
            else {
                console.log(result);            

                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(cachedResponse));
                res.end();
            }
        }
    );

});

http.createServer(app).listen(app.get('port'), function(){
  console.log("api.cloudcv.io server listening on port " + app.get('port'));
});