var express = require('express')
  , http = require('http')
  , async = require('async')
  , request = require('request')
  , validator = require('validator')
  , logger = require('./logger.js')
  , config = require('./config.js')
  , inspect = require('util').inspect
  ;


module.exports.plainDownloadViaHttpGet = function (url, callback) {
    
    logger.info('Downloading image from %s', url);
    
    var requestSettings = {
        method: 'GET',
        url: url,
        encoding: null
    };
    
    var payloadSize = 0;
    
    var req = request(requestSettings, function (error, response, body) {
      callback(error, body);
    }).on('data', function (chunk) {
      payloadSize += chunk.length;
      
      if (payloadSize > config.maxFileSize) {
        logger.warn('Maximum payload size exceed. Stopping download.');
        req.abort();
        callback(new Error('Maximum payload size exceed.'), null);
      }
    });
};