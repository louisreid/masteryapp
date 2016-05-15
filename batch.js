var aws = require('aws-sdk');
var tmp = require('tmp');
var fs = require('fs');
var havenondemand = require('havenondemand');
var config = require('./config.json');

var dynamoVideos = new aws.DynamoDB({params: {TableName: 'mastery-videos'}});
var hodClient = new havenondemand.HODClient(process.env.HOD_API_KEY);
dynamoVideos.scan({}, function (err, data) {
  tmp.file(function(err, path, fd, cleanup) {
    var csv = [];
    csv.push('"assignment","user","sentiment","sticker"');
    csv.push('"STRING","STRING","NUMERIC","STRING"');
    var videos = data.Items;
    for (var ii = 0; ii < videos.length; ii++) {
      var video = videos[ii];
      if (video.notes) {
        var notes = video.notes.SS;
        for (var jj = 0; jj < notes.length; jj++) {
          var note = JSON.parse(notes[jj]);
          csv.push('"' + video.assignment.S + '","' + video.user.S + '","' + ((note.sentiment) ? note.sentiment : 0) + '","' + ((note.sticker) ? note.sticker : "") + '"');
        }
      }
    }
    var ws = fs.createWriteStream(path);
    ws.write(csv.join("\n"));
    ws.close();
    hodClient.call("anomalydetection", {file: path}, false, function(err, resp, body) {
      console.log(resp);
      cleanup();
    });
  });
});
