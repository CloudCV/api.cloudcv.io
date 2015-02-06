var express  = require('express');
var http     = require('http');
var path     = require('path');
var app      = express();
var util     = require('util');
var cv       = require('cloudcv-backend');
var async    = require('async');
var request  = require('request');

// all environments
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);


app.get('/image/analyze/:image', function (req, res) {

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

app.post('/image/analyze/', function (req, res) {

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

            fs.unlink(imageToLoad);

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

module.exports = app;