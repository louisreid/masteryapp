var masteryServices = angular.module('masteryServices', []);


masteryServices.service('extractID', function() {
  return function(videos, isID) {
    var videoIDList = "";
    angular.forEach(videos, function(video) {
      if (isID === false) {
        video = video.split('v=')[1];
        var ampersandPosition = video.indexOf('&');
        if (ampersandPosition !== -1) {
          video = video.substring(0, ampersandPosition);
        }
      }
      if (videos.length > 1) {
        videoIDList = videoIDList + video + ",";
      } else {
        videoIDList = video;
      }
    });
    return videoIDList;

  };
});

masteryServices.service('saveData', function() {

  return function(username, videoList) {
    console.log("Save is coming for " + username + videoList);
    // var APIurl = "https://sheetsu.com/apis/v1.0/ea0f0bff4949/username/" + username;
    // $http.put(APIurl, { "id": "1", "username": username, "videos": videoList });
  };
});

masteryServices.service('loadData', function($http) {
  return function(username, response) {
    var APIurl = 'mock/mock.json';
    // var APIurl = "https://sheetsu.com/apis/v1.0/ea0f0bff4949/username/" + username;
    $http.get(APIurl)
      .then(response);
  };
});

masteryServices.service('loadUsers', function($http) {
  return function(response) {
    var APIurl = 'mock/users.json';
    // var APIurl = "https://sheetsu.com/apis/v1.0/ea0f0bff4949/username/" + username;
    $http.get(APIurl)
      .then(response);
  };
});

masteryServices.service('loadVideos', function($http, extractID) {
  return function(videos, callback, isID) {

    $http.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: 'snippet',
        id: extractID(videos, isID),
        key: 'AIzaSyArvVCR-ijSJqvFtDE2Z7z5DGC1W9c_7U8'
      }
    }).then(callback);

  };

});


masteryServices.service('refreshVideos', function(loadVideos) {
  return function(videos) {
    var videoIDs = [];
    angular.forEach(videos, function(video) {
      videoIDs.push(video.id);
    });

    loadVideos(videoIDs, function(response) {
      angular.forEach(response.data.items, function(video, key) {
        videos[key].YTObject = video;
      });
    }, true);

  };
});
