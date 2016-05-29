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
var videoThumb = require('video-thumb');
var session = require('client-sessions');
var passwordHash = require('password-hash');
var havenondemand = require('havenondemand');
var config = require('./config.json');

var app = express();
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET || "secret",
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

var s3 = new aws.S3({params: {Bucket: 'mastery-app'}});

var dynamoAssignments = new aws.DynamoDB({params: {TableName: 'mastery-assignments'}});
var dynamoUsers = new aws.DynamoDB({params: {TableName: 'mastery-users'}});
var dynamoVideos = new aws.DynamoDB({params: {TableName: 'mastery-videos'}});

var hodClient = new havenondemand.HODClient(process.env.HOD_API_KEY);

app.post('/login', function(req, res) {
  var user = req.body.user;
  dynamoUsers.getItem({"Key": {"id": {"S": user}}}, function (err, data) {
    console.log("dynamoUsers.getItem", err, data);
    if (err) {
      res.redirect(req.body.errorRedirect || "/login.html");
    } else if (data &&
               data.Item &&
               data.Item.digest &&
               passwordHash.verify(req.body.password, data.Item.digest.S)) {
      req.session.user = user;
      req.session.role = data.Item.userRole || "student";
      res.redirect(req.body.redirect || "/index.html");
    } else {
      res.redirect(req.body.errorRedirect || "/login.html");
    }
  });
});

app.post('/signup', function(req, res) {
  var user = req.body.user;
  var name = req.body.name;
  var digest = passwordHash.generate(req.body.password);
  dynamoUsers.updateItem({"Key": {"id": {"S": user}},
                          "ConditionExpression": "attribute_not_exists(id)",
                          "UpdateExpression": "SET digest = :digest, userRole = :userRole, displayName = :displayName, score = :score",
                          "ExpressionAttributeValues": {":digest": {"S": digest},
                                                        ":userRole": {"S": "student"},
                                                        ":displayName": {"S": name},
                                                        ":score": {"N": "0"}}},
    function (err, data) {
      console.log("dynamoUsers.updateItem", err, data);
      if (err) {
        res.redirect(req.body.errorRedirect || "/login.html");
      } else {
        req.session.user = user;
        req.session.role = "student";
        res.redirect(req.body.redirect || "/index.html");
      }
    });
});

app.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect(req.params.redirect || "/login.html");
});

app.get('/user/:user?', function(req, res) {
  var user = req.params.user || req.session.user;
  if ((user == req.session.user) ||
      (req.session.role == "teacher"))
  {
    dynamoUsers.getItem({"Key": {"id": {"S": user}}}, function (err, data) {
      console.log("dynamoUsers.getItem", err, data);
      if (err) {
        res.end(err.code);
      } else if (!data.Item) {
        res.end();
      } else {
        var videos = data.Item.videos ? data.Item.videos.SS : [];
        var promotedVideos = data.Item.promotedVideos ? data.Item.promotedVideos.SS : [];
        var passedVideos = data.Item.passedVideos ? data.Item.passedVideos.SS : [];
        var markedVideos = data.Item.markedVideos ? data.Item.markedVideos.SS : [];
        var returnedVideos = data.Item.returnedVideos ? data.Item.returnedVideos.SS : [];
  
        var aggregatedVideos = videos.map(function(e) {
          return {"id": e,
                  "promoted": (promotedVideos.indexOf(e) != -1),
                  "passed": (passedVideos.indexOf(e) != -1),
                  "marked": (markedVideos.indexOf(e) != -1),
                  "returned": (returnedVideos.indexOf(e) != -1)};
        });
  
        var obj = {"id": user,
                   "role": (data.Item.userRole) ? data.Item.userRole.S : "student",
                   "name": (data.Item.displayName) ? data.Item.displayName.S : "",
                   "score": (data.Item.score) ? Number(data.Item.score.N) : 0,
                   "assignments": (data.Item.assignments) ? data.Item.assignments.SS : [],
                   "videos": aggregatedVideos};
        res.json(obj);
      }
    });
  } else {
    res.status(403).end();
  }
});

app.put('/user/:user', function(req, res) {
  if (req.session.role == "admin") {
    var user = req.params.user;
    var digest = passwordHash.generate(req.body.password || "secret");
    var role = req.body.role || "student";
    var name = req.body.name || "";
    var score = req.body.score || 0;
    dynamoUsers.updateItem({"Key": {"id": {"S": user}},
                            "UpdateExpression": "SET digest = :digest, userRole = :userRole, displayName = :displayName, score = :score",
                            "ExpressionAttributeValues": {":digest": {"S": digest},
                                                          ":userRole": {"S": role},
                                                          ":displayName": {"S": name},
                                                          ":score": {"N": "" + score}}},
      function (err, data) {
        console.log("dynamoUsers.updateItem", err, data);
        res.end();
      });
  } else {
    res.status(403).end();
  }
});

app.get('/assignment/:assignment', function(req, res) {
  if (req.session.user) {
    var assignment = req.params.assignment;
    dynamoAssignments.getItem({"Key": {"id": {"S": assignment}}}, function (err, data) {
      console.log("dynamoAssignments.getItem", err, data);
      if (err) {
        res.end(err.code);
      } else if (!data.Item) {
        res.end();
      } else {
        var videos = data.Item.videos ? data.Item.videos.SS : [];
        var promotedVideos = data.Item.promotedVideos ? data.Item.promotedVideos.SS : [];
        var markedVideos = data.Item.markedVideos ? data.Item.markedVideos.SS : [];
        var passedVideos = data.Item.passedVideos ? data.Item.passedVideos.SS : [];
        var returnedVideos = data.Item.returnedVideos ? data.Item.returnedVideos.SS : [];
  
        var aggregatedVideos = videos.map(function(e) {
          return {"id": e,
                  "promoted": (promotedVideos.indexOf(e) != -1),
                  "marked": (markedVideos.indexOf(e) != -1),
                  "passed": (passedVideos.indexOf(e) != -1),
                  "returned": (returnedVideos.indexOf(e) != -1)};
        });
  
        var obj = {"id": assignment,
                   "summary": (data.Item.summary) ? data.Item.summary.S : "",
                   "detail": (data.Item.detail) ? data.Item.detail.S : "",
                   "setDate": (data.Item.setDate) ? Number(data.Item.setDate.N) : 0,
                   "dueDate": (data.Item.dueDate) ? Number(data.Item.dueDate.N) : 0,
                   "videos": aggregatedVideos};
        res.json(obj);
      }
    });
  } else {
    res.status(403).end();
  }
});

app.put('/assignment/:assignment', function(req, res) {
  if (req.session.role == "teacher") {
    var assignment = req.params.assignment;
    var summary = req.body.summary ? req.body.summary : "";
    var detail = req.body.detail ? req.body.detail : "";
    var setDate = req.body.setDate ? req.body.setDate : new Date().getTime();
    var dueDate = req.body.dueDate ? req.body.dueDate : new Date().getTime() + 3 * 24 * 60 * 60 * 1000;
    var users = req.body.users ? req.body.users : []; // TODO: Shouldn't really be part of a PUT - not actually part of the resource.
    dynamoAssignments.updateItem({"Key": {"id": {"S": assignment}},
                                  "UpdateExpression": "SET summary = :summary, detail = :detail, setDate = :setDate, dueDate = :dueDate",
                                  "ExpressionAttributeValues": {":summary": {"S": summary},
                                                                ":detail": {"S": detail},
                                                                ":setDate": {"N": "" + setDate},
                                                                ":dueDate": {"N": "" + dueDate}}},
      function (err, data) {
        console.log("dynamoAssignments.updateItem", err, data);
        res.end();
      });
    async.each(users, function(user, callback) {
      dynamoUsers.updateItem({"Key": {"id": {"S": user}},
                              "UpdateExpression": "ADD assignments :assignment",
                              "ExpressionAttributeValues": {":assignment": {"SS": [assignment]}}},
        callback);
    }, function (err) {
      console.log("async.each(dynamoUsers.updateItem) failed", err);
    });
  } else {
    res.status(403).end();
  }
});

app.get('/video/:video/data', function(req, res) {
  if (req.session.user) {
    var video = req.params.video;
    dynamoVideos.getItem({"Key": {"id": {"S": video}}}, function (err, data) {
      console.log("dynamoVideos.getItem", err, data);
      if (err) {
        res.end(err.code);
      } else if (!data.Item) {
        res.end();
      } else if ((data.Item.user &&
                  (data.Item.user.S == req.session.user)) ||
                 (req.session.role == "teacher")) {
        var obj = {"assignment": (data.Item.assignment) ? data.Item.assignment.S : "",
                   "user": (data.Item.user) ? data.Item.user.S : "",
                   "promoted": (data.Item.promoted) ? Boolean(data.Item.promoted.BOOL) : false,
                   "marked": (data.Item.marked) ? Boolean(data.Item.marked.BOOL) : false,
                   "passed": (data.Item.passed) ? Boolean(data.Item.passed.BOOL) : false,
                   "returned": (data.Item.returned) ? Boolean(data.Item.returned.BOOL) : false,
                   "notes": (data.Item.notes) ? data.Item.notes.SS.map(function(x) {return JSON.parse(x);}) : []};
        if (data.Item.transcript) {
          obj.transcript = JSON.parse(data.Item.transcript.S);
        }
        res.json(obj);
      } else {
        res.status(403).end();
      }
    });
  } else {
    res.status(403).end();
  }
});

app.post('/video/:video', function(req, res) {
  if (req.session.role == "teacher") {
    var video = req.params.video;
    dynamoVideos.getItem({"Key": {"id": {"S": video}}}, function (err, data) {
      console.log("dynamoVideos.getItem", err, data);
      if (err) {
        res.end(err.code);
      } else if (!data.Item) {
        res.end();
      } else {
        var assignment = (data.Item.assignment) ? data.Item.assignment.S : null;
        var user = (data.Item.user) ? data.Item.user.S : null;
        var addList = [];
        var deleteList = [];
        var setList = [];
        var setValues = {};
        if (req.body.hasOwnProperty("promoted")) {
          if (req.body.promoted) {
  	  addList.push("promotedVideos :video");
          } else {
  	  deleteList.push("promotedVideos :video");
          }
          setList.push("promoted = :promoted");
          setValues[":promoted"] = {"BOOL": !!req.body.promoted};
        }
        if (req.body.hasOwnProperty("marked")) {
          if (req.body.marked) {
  	  addList.push("markedVideos :video");
          } else {
  	  deleteList.push("markedVideos :video");
          }
          setList.push("marked = :marked");
          setValues[":marked"] = {"BOOL": !!req.body.marked};
        }
        if (req.body.hasOwnProperty("passed")) {
          if (req.body.passed) {
  	  addList.push("passedVideos :video");
          } else {
  	  deleteList.push("passedVideos :video");
          }
          setList.push("passed = :passed");
          setValues[":passed"] = {"BOOL": !!req.body.passed};
        }
        if (req.body.hasOwnProperty("returned")) {
          if (req.body.returned) {
  	  addList.push("returnedVideos :video");
          } else {
  	  deleteList.push("returnedVideos :video");
          }
          setList.push("returned = :returned");
          setValues[":returned"] = {"BOOL": !!req.body.returned};
        }
        var addExpression = (addList.length > 0) ? ("ADD " + addList.join(", ")) : "";
        var deleteExpression = (deleteList.length > 0) ? ("ADD " + deleteList.join(", ")) : "";
        var addDeleteExpression = addExpression + (((addExpression != "") && (deleteExpression != "")) ? " " : "") + deleteExpression;
        console.log(addDeleteExpression);
        dynamoAssignments.updateItem({"Key": {"id": {"S": assignment}},
                                      "UpdateExpression": addDeleteExpression,
                                      "ExpressionAttributeValues": {":video": {"SS": [video]}}},
          function (err, data) {
            console.log("dynamoAssignments.updateItem", err, data);
          });
        dynamoUsers.updateItem({"Key": {"id": {"S": user}},
                                "UpdateExpression": addDeleteExpression,
                                "ExpressionAttributeValues": {":video": {"SS": [video]}}},
          function (err, data) {
            console.log("dynamoUsers.updateItem", err, data);
          });
        console.log(setList, setValues);
        dynamoVideos.updateItem({"Key": {"id": {"S": video}},
                                 "UpdateExpression": "SET " + setList.join(", "),
                                 "ExpressionAttributeValues": setValues},
          function (err, data) {
            console.log("dynamoVideos.updateItem", err, data);
          });
        res.end();
      }
    });
  } else {
    res.status(403).end();
  }
});

app.put('/video/:video/note', function(req, res) {
  if (req.session.role == "teacher") {
    var video = req.params.video;
    var note = JSON.stringify(req.body);
  
    function doUpdate(note) {
      dynamoVideos.updateItem({"Key": {"id": {"S": video}},
                               "UpdateExpression": "ADD notes :note",
                               "ExpressionAttributeValues": {":note": {"SS": [note]}}},
        function (err, data) {
          console.log("dynamoVideos.updateItem", err, data);
          res.end(err);
        });
    };
  
    if (req.body.note) {
      console.log("Doing analyzesentiment");
      hodClient.call('analyzesentiment', {text: req.body.note}, function(err, resp, body) {
        req.body.sentiment = resp.body.aggregate.score;
        note = JSON.stringify(req.body);
        doUpdate(note);
      });
    } else {
      doUpdate(note);
    }
  } else {
    res.status(403).end();
  }
});

app.get('/video/:video/thumb.png', function(req, res) {
  if (req.session.user) {
    var video = req.params.video;
    dynamoVideos.getItem({"Key": {"id": {"S": video}}}, function (err, data) {
      console.log("dynamoVideos.getItem", err, data);
      if (err) {
        res.end(err.code);
      } else if (!data.Item) {
        res.end();
      } else if ((data.Item.user &&
                  (data.Item.user.S == req.session.user)) ||
                 (req.session.role == "teacher")) {
        s3.headObject({Key: video + "-thumb"}, function(err, data) {
          console.log("headObject:", err, data);
          if (err) {
            // TODO: Handle better!
            res.end(err.code);
          } else {
            res.writeHead(200, {
              "Content-Length": data.ContentLength,
              "Content-Type": data.ContentType
            });
            s3.getObject({Key: video + "-thumb"}).createReadStream().pipe(res);
          }
        });
      } else {
        res.status(403).end();
      }
    });
  } else {
    res.status(403).end();
  }
});

app.get('/video/:video', function(req, res) {
  if (req.session.user) {
    var video = req.params.video;
    dynamoVideos.getItem({"Key": {"id": {"S": video}}}, function (err, data) {
      console.log("dynamoVideos.getItem", err, data);
      if (err) {
        res.end(err.code);
      } else if (!data.Item) {
        res.end();
      } else if ((data.Item.user &&
                  (data.Item.user.S == req.session.user)) ||
                 (req.session.role == "teacher")) {
        s3.headObject({Key: video}, function(err, data) {
          console.log("headObject:", err, data);
          if (err) {
            // TODO: Handle better!
            res.end(err.code);
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
                "Content-Type": data.ContentType
              });
          
            s3.getObject({Key: video, Range: req.headers.range}).createReadStream().pipe(res);
          }
        });
      } else {
        res.status(403).end();
      }
    });
  } else {
    res.status(403).end();
  }
});

app.post('/video', multer({dest: tmp.dirSync().name}).single('file'), function(req, res) {
  console.log("POST", req.url);
  var user = req.query.user;
  if (req.session.user == user) {
    var assignment = req.query.assignment;
    var video = uuid.v4();
    tmp.file(function(err, path1, fd, cleanup1) {
      videoThumb.extract(req.file.path, path1, '00:00:05', '320x200', function() {
        console.log('thumbnailed');
        tmp.file(function(err, path2, fd, cleanup2) {
          faststart.createReadStream(req.file.path).pipe(fs.createWriteStream(path2)).on('finish', function() {
            console.log("converted");
            var body = fs.createReadStream(path1);
            s3.upload({Key: video + "-thumb", ContentType: "image/png", Body: body}, function(err, data) {
              var body = fs.createReadStream(path2);
              s3.upload({Key: video, ContentType: req.file.mimetype, Body: body}, function(err, data) {
                console.log("uploaded", err, data);
                dynamoAssignments.updateItem({"Key": {"id": {"S": assignment}},
                                              "UpdateExpression": "ADD videos :video",
                                              "ExpressionAttributeValues": {":video": {"SS": [video]}}},
                  function (err, data) {
                    console.log("dynamoAssignments.updateItem", err, data);
                  });
                dynamoUsers.updateItem({"Key": {"id": {"S": user}},
                                        "UpdateExpression": "ADD videos :video",
                                        "ExpressionAttributeValues": {":video": {"SS": [video]}}},
                  function (err, data) {
                    console.log("dynamoUsers.updateItem", err, data);
                  });
                dynamoVideos.putItem({"Item": {"id": {"S": video}, "assignment": {"S": assignment}, "user": {"S": user}}},
                  function (err, data) {
                    console.log("dynamoVideos.putItem", err, data);
                  });
  
                hodClient.call('recognizespeech', {file: path2, interval: 1000}, true, function(err, resp, body) {
                  jobID = resp.body.jobID
                  console.log("recognizespeech returned job", jobID)
                  res.end();
                  cleanup2();
                  cleanup1();
  
                  hodClient.getJobResult(jobID, function(err, resp, body) {
                    if (err) {
                      console.log("recognizespeech failed asynchronously", err);
                    } else {
                      var doc = resp.body.actions[0].result.document.map(function(e) {
                        return {"content": e.content, "timestamp": e.offset / 1000};
                      });
                      console.log("recognizespeech transcribed to", doc);
                      dynamoVideos.updateItem({"Key": {"id": {"S": video}},
                                               "UpdateExpression": "SET transcript = :transcript",
                                               "ExpressionAttributeValues": {":transcript": {"S": JSON.stringify(doc)}}},
                        function (err, data) {
                          console.log("dynamoVideos.updateItem", err, data);
                        });
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  }
});

app.get('/', function(req, res) {
  res.redirect("/login.html");
});

app.use('/', express.static(__dirname + '/public', {index: false}));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

var port = process.env.PORT || 80;
app.listen(port, function (err) {
  console.log("Listening on port", port);
});
