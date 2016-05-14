var express = require('express');
var aws = require('aws-sdk');
var tmp = require('tmp');
var faststart = require('faststart');
var config = require('./config.json');

var app = express();

var s3 = new aws.S3({params: {Bucket: 'mastery-app'}});
s3.listObjects({}, function(err, data) {
  if (err) {
    console.log("Error uploading data: ", err);
  } else {
    console.log("Successfully uploaded data to myBucket/myKey", data);
  }
});

var dynamoUsers = new aws.DynamoDB({params: {TableName: 'mastery-users'}});
dynamoUsers.getItem(
{"Key" : { "id" : { "S" : "bob" } } },
function (err, data) {
  console.log("getItem", err, data);
});




var fs = require("fs");
var path = require("path");
app.get('/video.mp4', function(req, res) {
  var key = "video.mp4";
  s3.headObject({Key: key}, function(err, data) {
    console.log("headObject:", err, data);
    if (err) {
      // TODO: Handle better!
      res.end(err);
    } else {
      var total = data.ContentLength;
  
      var range = req.headers.range;
      var start;
      var end;
      if (range) {
        var positions = range.replace(/bytes=/, "").split("-");
        var start = parseInt(positions[0], 10);
        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      } else {
        start = 0;
        end = total - 1;
      }
      var chunksize = (end - start) + 1;
    
        res.writeHead(206, {
          "Content-Range": "bytes " + start + "-" + end + "/" + total,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4"
        });
    
      s3.getObject({Key: key, Range: req.headers.range}).createReadStream().pipe(res);
    }
  });
});

app.put('/video.mp4', function(req, res) {
  var key = "video.mp4";
  console.log("PUT", req.url);
  tmp.file(function(err, path1, fd, cleanup1) {
    req.pipe(fs.createWriteStream(path1)).on('finish', function() {
      console.log("downloaded");
      tmp.file(function(err, path2, fd, cleanup2) {
        faststart.createReadStream(path1).pipe(fs.createWriteStream(path2)).on('finish', function() {
          console.log("converted");
          cleanup1();
          var body = fs.createReadStream(path2);
          s3.upload({Key: key, Body: body}, function(err, data) {
            console.log("uploaded", err, data);
            res.end();
            cleanup2();
          });
        });
      });
    });
  });
});




app.use('/', express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));


app.listen(process.env.PORT || 80);
