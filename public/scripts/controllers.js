var masteryControllers = angular.module('masteryControllers', []);

masteryControllers.controller('submitVideoCtrl', function(
  $rootScope,
  $scope,
  loadVideos,
  loadUsers,
  loadData,
  saveData,
  extractID,
  refreshVideos
) {
  $scope.previewVideo = function() {
    loadVideos([$scope.videoURL], function(response) {
      $scope.currentVideo = response.data.items[0].snippet;
    }, false);
    $scope.chosenVideoURL = $scope.videoURL;
  };

  $scope.submitVideo = function() {
    $scope.userData.videos.push({
      id: extractID([$scope.chosenVideoURL], false),
      teacher: $scope.chosenTeacher,
      comments: []
    });
    // Before the save is made we need to go through and take the YTObject from each array item
    // saveData($scope.username, $scope.userData.videos);
    refreshVideos($scope.userData.videos);
    $scope.currentVideo = "";
  };


});

masteryControllers.controller('videoListCtrl', function(
  $rootScope,
  $scope,
  loadVideos,
  loadUsers,
  loadData,
  saveData,
  extractID,
  refreshVideos
) {

  $scope.removeVideo = function(index) {
    console.log("Removing video " + index);
  };

  $scope.toggleVideo = function(index, expanded) {
    if (expanded === true) {
      // Current time 
      var checkAPI = setInterval(function() {
        if (youTubeAPIReady === true) {
          clearInterval(checkAPI);
          $scope.userData.videos[index].player = new YT.Player('playerVideo' + index, {
            height: '300',
            width: '480',
            videoId: $scope.userData.videos[index].id,
            events: {
              'onStateChange': function(event) {
                var myTimer;
                if (event.data === 1) { // playing
                  myTimer = setInterval(function() {
                    var currentTime = $scope.userData.videos[index].player.getCurrentTime();
                    $scope.userData.videos[index].currentTime = currentTime;
                    document.getElementById("player" + index + "Time").innerHTML = Math.round(currentTime) + 's';
                  }, 1000);
                } else { // not playing
                  clearInterval(myTimer);
                }
              }
            }
          });
        }
      }, 100);
    } else {
      $scope.userData.videos[index].player.pauseVideo();
    }
  };

  $scope.submitComment = function(index) {
    $scope.userData.videos[index].comments.push({
      time: Math.round($scope.userData.videos[index].currentTime),
      comment: $scope.userData.videos[index].commentText
    });
    $scope.commentText = "";
  };

  $scope.seekTo = function(time, index) {
    $scope.userData.videos[index].player.seekTo(time, true);
    $scope.userData.videos[index].player.pauseVideo();
  };

  $rootScope.username = "louis";

  var tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var youTubeAPIReady = false;
  window.onYouTubeIframeAPIReady = function() {
    youTubeAPIReady = true;
  };

  loadData($scope.username, function(response) {
    $scope.userData = response.data[0];
    refreshVideos($scope.userData.videos);
  });

  loadUsers(function(response) {
    $scope.users = response.data;
  });


  //
  // Emoticons, work in progress
  //
  window.onload = function() {
    twemoji.size = '16x16';
    twemoji.parse(document.body);
  };

});






















// masteryControllers.controller('VideoCtrl', ['$scope', '$route', '$routeParams', '$http',
//   function($scope, $route, $routeParams, $http) {
//     $scope.video = $routeParams.video;
//     $scope.timestamp = 0;
//     $http.get('video/' + $routeParams.video + '/data').success(function(data) {
//       console.log(data);
//       $scope.promoted = data.promoted;
//       $scope.marked = data.marked;
//       $scope.passed = data.passed;
//       $scope.returned = data.returned;
//       $scope.notes = data.notes;
//       $scope.transcript = data.transcript || [];
//       $http.get('assignment/' + data.assignment).success(function(data) {
//         console.log(data);
//         $scope.assignment = data;
//       });
//       $http.get('user/' + data.user).success(function(data) {
//         console.log(data);
//         $scope.user = data;
//       });
//     });

//     $scope.skipTo = function() {
//       $scope.timestamp = this.note.timestamp;
//     };
//     $scope.skipToChunk = function() {
//       $scope.timestamp = this.chunk.timestamp;
//     };
//     $scope.switchTo = function() {
//       $route.updateParams({ video: this.video.id });
//     };
//     $scope.timestampInChunk = function() {
//       var nextChunkTimestamp = ($scope.transcript.length > this.$index + 1) ? $scope.transcript[this.$index + 1].timestamp : 1.0 / 0.0;
//       var endChunkTimestamp = Math.min(this.chunk.timestamp + 1, nextChunkTimestamp);
//       return (($scope.timestamp + 0.499 >= this.chunk.timestamp) && ($scope.timestamp + 0.499 < endChunkTimestamp)); // Add a little on because the currentTime seems to lag a bit
//     };
//     $scope.addNote = function() {
//       var note = { "timestamp": $scope.timestamp, "note": $scope.noteText };
//       var comments = JSON.parse(localStorage.previousComments || "[]");
//       comments = comments.filter(function(x) {
//         return x != $scope.noteText;
//       });
//       comments.splice(0, 0, $scope.noteText);
//       $scope.previousComments = comments;
//       localStorage.previousComments = JSON.stringify(comments);
//       $http.put('video/' + $scope.video + "/note", JSON.stringify(note), { headers: { "Content-Type": "application/json" } }).success(function(data) {
//         $scope.notes.push(note);
//       });
//       $scope.noteText = "";
//     };
// $scope.addSticker = function(sticker) {
//   var note = { "timestamp": $scope.timestamp, "sticker": sticker };
//   if ($scope.noteText) {
//     var comments = JSON.parse(localStorage.previousComments || "[]");
//     comments = comments.filter(function(x) {
//       return x != $scope.noteText;
//     });
//     comments.splice(0, 0, $scope.noteText);
//     $scope.previousComments = comments;
//     localStorage.previousComments = JSON.stringify(comments);
//     note.note = $scope.noteText;
//   }
//   $http.put('video/' + $scope.video + "/note", JSON.stringify(note), { headers: { "Content-Type": "application/json" } }).success(function(data) {
//     $scope.notes.push(note);
//   });
//   $scope.noteText = "";
// };
//     $scope.promoteVideo = function() {
//       $http.post('video/' + $scope.video, JSON.stringify({ promoted: true }), { headers: { "Content-Type": "application/json" } }).success(function(data) {
//         $scope.promoted = true;
//       });
//     };
//     $scope.passVideo = function() {
//       $http.post('video/' + $scope.video, JSON.stringify({ marked: true, passed: true }), { headers: { "Content-Type": "application/json" } }).success(function(data) {
//         $scope.marked = true;
//         $scope.passed = true;
//       });
//     };
//     $scope.failVideo = function() {
//       $http.post('video/' + $scope.video, JSON.stringify({ marked: true, passed: false }), { headers: { "Content-Type": "application/json" } }).success(function(data) {
//         $scope.marked = true;
//         $scope.passed = false;
//       });
//     };
//     $scope.returnVideo = function() {
//       $http.post('video/' + $scope.video, JSON.stringify({ returned: true }), { headers: { "Content-Type": "application/json" } }).success(function(data) {
//         $scope.returned = false;
//       });
//     };
//     $scope.previousComments = JSON.parse(localStorage.previousComments || "[]");
//   }
// ]);

// masteryControllers.controller('DashboardCtrl', ['$scope', '$location', '$routeParams', '$http',
//   function($scope, $location, $routeParams, $http) {
//     $scope.userId = $routeParams.user;
//     $http.get('user/' + $scope.userId).success(function(userData) {
//       console.log(userData);
//       async.map(userData.assignments || [], function(assignmentId, callback) {
//         $http.get('assignment/' + assignmentId).success(function(data) {
//           console.log(data);
//           callback(null, data);
//         });
//       }, function(err, data) {
//         $scope.user = userData;
//         $scope.assignments = data;
//       });
//     });

//     $scope.switchToAssignment = function() {
//       $location.path("/assignment/" + this.assignment.id);
//     };
//     $scope.switchToVideo = function() {
//       $location.path("/video/" + this.video.id);
//     };
//   }
// ]);

// masteryControllers.controller('AssignmentCtrl', ['$scope', '$location', '$routeParams', '$http',
//   function($scope, $location, $routeParams, $http) {
//     $scope.assignmentId = $routeParams.assignment;
//     $http.get('assignment/' + $scope.assignmentId).success(function(data) {
//       console.log(data);
//       $scope.assignment = data;
//     });

//     $scope.switchTo = function() {
//       $location.path("/video/" + this.video.id);
//     };
//   }
// ]);

// masteryControllers.controller('UploadCtrl', ['$scope', '$routeParams', '$http',
//   function($scope, $routeParams, $http) {
//     console.log($scope);
//     $scope.userId = $routeParams.user;
//     $scope.assignmentId = $routeParams.assignment;
//     document.getElementById('videoDropzoneForm').action = "/video?assignment=" + $scope.assignmentId + "&user=" + $scope.userId;
//     Dropzone._autoDiscoverFunction();
//     $http.get('assignment/' + $scope.assignmentId).success(function(assignmentData) {
//       $http.get('user/' + $scope.userId).success(function(userData) {
//         $scope.assignment = assignmentData;
//         $scope.user = userData;
//       });
//     });
//     var myDropzone = document.getElementsByClassName("dropzone")[0].dropzone;
//     myDropzone.on("complete", function(file) {
//       myDropzone.removeFile(file);
//       $http.get('assignment/' + $scope.assignmentId).success(function(assignmentData) {
//         $http.get('user/' + $scope.userId).success(function(userData) {
//           $scope.assignment = assignmentData;
//           $scope.user = userData;
//         });
//       });
//     });
//   }
// ]);

// masteryControllers.directive("timeUpdate", function() {
//   return {
//     require: "ngModel",
//     link: function(scope, el, attrs, ngModel) {
//       el[0].ontimeupdate = function() {
//         ngModel.$setViewValue(Math.floor(el[0].currentTime));
//       }

//       ngModel.$render = function() {
//         el[0].currentTime = ngModel.$viewValue;
//       }
//     }
//   }
// });
