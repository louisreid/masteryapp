var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var multer  = require('multer');
var async = require('async');
var aws = require('aws-sdk');
var tmp = require('tmp');
var uuid = require('node-uuid');
var fs = require("fs");
var path = require("path");
var faststart = require('faststart');
var stringify = require('node-stringify');
var config = require('./config.json');

var app = express();
app.use(morgan("combined"));
app.use(bodyParser.json());

var s3 = new aws.S3({params: {Bucket: 'mastery-app'}});
/*
s3.listObjects({}, function(err, data) {
  if (err) {
    console.log("Error uploading data: ", err);
  } else {
    console.log("Successfully uploaded data to myBucket/myKey", data);
  }
});
*/

var dynamoTopics = new aws.DynamoDB({params: {TableName: 'mastery-topics'}});
var dynamoUsers = new aws.DynamoDB({params: {TableName: 'mastery-users'}});
var dynamoVideos = new aws.DynamoDB({params: {TableName: 'mastery-videos'}});

app.get('/user/:user', function(req, res) {
  var user = req.params.user;
  dynamoUsers.getItem({"Key": {"id": {"S": user}}}, function (err, data) {
    console.log("dynamoUsers.getItem", err, data);
    res.json(data);
  });
});

app.get('/topic/:topic', function(req, res) {
  var topic = req.params.topic;
  dynamoTopics.getItem({"Key": {"id": {"S": topic}}}, function (err, data) {
    console.log("dynamoTopics.getItem", err, data);
    res.json(data);
  });
});

app.get('/video/:video/note', function(req, res) {
  var video = req.params.video;
  dynamoVideos.getItem({"Key": {"id": {"S": video}}}, function (err, data) {
    console.log("dynamoVideos.getItem", err, data);
    res.json(data);
  });
});

app.put('/video/:video/note', function(req, res) {
  var video = req.params.video;
  var note = JSON.stringify(req.body);
  dynamoVideos.updateItem(
  {"Key": {"id": {"S": video}},
   "UpdateExpression": "ADD notes :note",
   "ExpressionAttributeValues": {":note": {"SS": [note]}}},
  function (err, data) {
    console.log("dynamoVideos.updateItem", err, data);
    res.end();
  });
});

app.get('/video/:video', function(req, res) {
  var video = req.params.video;
  s3.headObject({Key: video}, function(err, data) {
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
    
      s3.getObject({Key: video, Range: req.headers.range}).createReadStream().pipe(res);
    }
  });
});

app.put('/video', function(req, res) {
  console.log("PUT", req.url);
  var topic = req.query.topic;
  var user = req.query.user;
  var video = uuid.v4();
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

app.post('/video', multer({dest: tmp.dirSync().name}).single('file'), function(req, res) {
  console.log("POST", req.url);
  var topic = req.query.topic;
  var user = req.query.user;
  var video = uuid.v4();
  tmp.file(function(err, path, fd, cleanup) {
    faststart.createReadStream(req.file.path).pipe(fs.createWriteStream(path)).on('finish', function() {
      console.log("converted");
      var body = fs.createReadStream(path);
      s3.upload({Key: video, Body: body}, function(err, data) {
        console.log("uploaded", err, data);
dynamoTopics.updateItem(
{"Key": {"id": {"S": topic}},
 "UpdateExpression": "ADD videos :video",
 "ExpressionAttributeValues": {":video": {"SS": [video]}}},
function (err, data) {
  console.log("dynamoTopics.updateItem", err, data);
});
dynamoUsers.updateItem(
{"Key": {"id": {"S": user}},
 "UpdateExpression": "ADD videos :video",
 "ExpressionAttributeValues": {":video": {"SS": [video]}}},
function (err, data) {
  console.log("dynamoUsers.updateItem", err, data);
});
dynamoVideos.putItem(
{"Item": {"id": {"S": video}}},
function (err, data) {
  console.log("dynamoVideos.putItem", err, data);
});
        res.end();
        cleanup();
      });
    });
  });
});




app.use('/', express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));


var port = process.env.PORT || 80;
app.listen(port, function (err) {
  console.log("Listening on port", port);
});
