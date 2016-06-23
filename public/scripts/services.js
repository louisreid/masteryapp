var masteryServices = angular.module('masteryServices', []);

masteryServices.service('loadVideos', function($http, extractID) {
  return function(video, callback, isID) {

    var videoIDList = "";

    angular.forEach(video, function(videoID) {
      if (isID === false) {
        videoID = extractID(videoID);
      }
      videoIDList = videoIDList + "," + videoID;
    });
    console.log(videoIDList);

    $http.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: 'snippet',
        id: videoIDList,
        key: 'AIzaSyArvVCR-ijSJqvFtDE2Z7z5DGC1W9c_7U8'
      }
    }).then(callback);

  };

});

masteryServices.service('addVideo', function($http) {

  return function(username, videoList){
    var APIurl = "https://sheetsu.com/apis/v1.0/ea0f0bff4949/username/" + username;
    $http.put(APIurl, {"id":"1", "username": username, "videos": videoList});
  };

});

masteryServices.service('extractID', function() {
  return function(videoID) {
    videoID = videoID.split('v=')[1];
    var ampersandPosition = videoID.indexOf('&');
    if (ampersandPosition !== -1) {
      videoID = videoID.substring(0, ampersandPosition);
    }
    return videoID;
  };
});

masteryServices.service('loadUserData', function($http) {
  // Load from json file
  return function(username, response) {
    console.log(username);
    var APIurl = "https://sheetsu.com/apis/v1.0/ea0f0bff4949/username/" + username;
    $http.get(APIurl)
      .then(response);
  };
});
