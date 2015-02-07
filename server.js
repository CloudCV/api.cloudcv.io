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
  , winston = require('winston')
  , validator = require('validator')
  ;

var app = express();

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'info-file',
            filename: './logs/api.cloudcv.io.info.log',
            level: 'info'
        }),
        new (winston.transports.File)({
          name: 'error-file',
          filename: './logs/api.cloudcv.io.error.log',
          level: 'error'
        })
    ]
});

var multerOptions = {
    inMemory:true, 
    limits: { 
        fileSize: 8 * 1048576, 
        files: 1
    }
}
// Configuration
app.set('port', process.env.PORT || 3000);
app.set('title', 'api.cloudcv.io');

//app.use(express.favicon());
//app.use(express.logger('dev'));

app.use(methodOverride());
app.use(multer(multerOptions));
app.use(cookieParser('optional secret string'));

//var env = process.env.NODE_ENV || 'development';
app.use(errorhandler());  

function MapAnalyzeResult(analyzeResult) {
    var returnRes = {
        aspect: analyzeResult.aspectRatio,
        size: { width:0, height:0},
        dominantColors: []
    };

    for (var i = 0; i < analyzeResult.dominantColors.length; i++)
    {
        var c = analyzeResult.dominantColors[i];

        returnRes.dominantColors.push({
            red: c.average[0],
            green: c.average[1],
            blue: c.average[2],
            html: c.html
        });
    }

    return returnRes;
}


app.get('/v1/image/analyze/:image', function (req, res) {

    var sendErrorResponse = function (code, message) {
        res.statusCode = code;
        res.setHeader("Content-Type", "application/txt");
        res.write(message);
        res.end();
    };

    if (!req.params.image) {
        return sendErrorResponse(404, 'Missing required parameter');
    }

    var externalImageURL = decodeURIComponent(req.params.image);

    if (!validator.isURL(externalImageURL)) {
        logger.warn('Given request is not an URL %s', externalImageURL);
        return sendErrorResponse(404, 'Missing required parameter');
    }

    logger.info('GET %s', externalImageURL);

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

            logger.info('Loaded file from %s of %d bytes', externalImageURL, image.length);

            cv.analyzeImage(image, callback);
        }
        ], 
        function (err, result) {
            if (err) {
                logger.error(err);
                sendErrorResponse(500, JSON.stringify(err));
            }
            else if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(MapAnalyzeResult(result)));
                res.end();
            } 
            else {
                res.end();
            }
        }
    );
});

app.post('/v1/image/analyze/', function (req, res) {

    var sendErrorResponse = function (code, message) {
        res.statusCode = code;
        res.setHeader("Content-Type", "application/txt");
        res.write(message);
        res.end();
    };

    if (req.files && req.files.image) {
        var uploadedImage = req.files.image.buffer;
    }
    else {
        return sendErrorResponse(400, "Missing image data");
    }

    async.waterfall([
        function (callback){
            cv.analyzeImage(uploadedImage, callback); 
        }
        ], 
        function (err, result) {

            if (uploadedImagePath)
                fs.unlink(uploadedImagePath);

            if (err) {
                logger.error(err);
                sendErrorResponse(500, JSON.stringify(err));
            }
            else if (result) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(MapAnalyzeResult(result)));
                res.end();
            }
        }
    );

});

http.createServer(app).listen(app.get('port'), function(){
  console.log("api.cloudcv.io server listening on port " + app.get('port'));
});