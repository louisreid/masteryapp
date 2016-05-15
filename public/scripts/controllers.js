var masteryControllers = angular.module('masteryControllers', []);

masteryControllers.controller('VideoCtrl', ['$scope', '$route', '$routeParams', '$http',
  function ($scope, $route, $routeParams, $http) {
    $scope.video = $routeParams.video;
    $scope.timestamp = 0;
    $http.get('video/' + $routeParams.video + '/data').success(function(data) {
      console.log(data);
      $scope.promoted = data.promoted;
      $scope.marked = data.marked;
      $scope.passed = data.passed;
      $scope.returned = data.returned;
      $scope.notes = data.notes;
      $scope.transcript = data.transcript || [];
      $http.get('assignment/' + data.assignment).success(function(data) {
        console.log(data);
        $scope.assignment = data;
      });
      $http.get('user/' + data.user).success(function(data) {
        console.log(data);
        $scope.user = data;
      });
    });

    $scope.skipTo = function() {
      $scope.timestamp = this.note.timestamp;
    };
    $scope.skipToChunk = function() {
      $scope.timestamp = this.chunk.timestamp;
    };
    $scope.switchTo = function() {
      $route.updateParams({video: this.video.id});
    };
    $scope.timestampInChunk = function() {
      var nextChunkTimestamp = ($scope.transcript.length > this.$index + 1) ? $scope.transcript[this.$index + 1].timestamp : 1.0/0.0;
      var endChunkTimestamp = Math.min(this.chunk.timestamp + 1, nextChunkTimestamp);
      return (($scope.timestamp >= this.chunk.timestamp) && ($scope.timestamp < endChunkTimestamp));
    };
    $scope.addNote = function() {
      var note = {"timestamp": $scope.timestamp, "note": $scope.noteText};
      $http.put('video/' + $scope.video + "/note", JSON.stringify(note), {headers: {"Content-Type": "application/json"}}).success(function(data) {
        $scope.notes.push(note);
      });
      $scope.noteText = "";
    };
    $scope.addSticker = function(sticker) {
      var note = {"timestamp": $scope.timestamp, "sticker": sticker};
      if ($scope.noteText) {
        note.note = $scope.noteText;
      }
      $http.put('video/' + $scope.video + "/note", JSON.stringify(note), {headers: {"Content-Type": "application/json"}}).success(function(data) {
        $scope.notes.push(note);
      });
      $scope.noteText = "";
    };
    $scope.promoteVideo = function() {
      $http.post('video/' + $scope.video, JSON.stringify({promoted: true}), {headers: {"Content-Type": "application/json"}}).success(function(data) {
        $scope.promoted = true;
      });
    };
    $scope.passVideo = function() {
      $http.post('video/' + $scope.video, JSON.stringify({marked: true, passed: true}), {headers: {"Content-Type": "application/json"}}).success(function(data) {
        $scope.marked = true;
        $scope.passed = true;
      });
    };
    $scope.failVideo = function() {
      $http.post('video/' + $scope.video, JSON.stringify({marked: true, passed: false}), {headers: {"Content-Type": "application/json"}}).success(function(data) {
        $scope.marked = true;
        $scope.passed = false;
      });
    };
    $scope.returnVideo = function() {
      $http.post('video/' + $scope.video, JSON.stringify({returned: true}), {headers: {"Content-Type": "application/json"}}).success(function(data) {
        $scope.returned = false;
      });
    };
  }]);

masteryControllers.controller('DashboardCtrl', ['$scope', '$location', '$routeParams', '$http',
  function ($scope, $location, $routeParams, $http) {
    $scope.userId = $routeParams.user;
    $http.get('user/' + $scope.userId).success(function(userData) {
      console.log(userData);
      async.map(userData.assignments || [], function(assignmentId, callback) {
        $http.get('assignment/' + assignmentId).success(function(data) {
          console.log(data);
          callback(null, data);
        });
      }, function (err, data) {
        $scope.user = userData;
        $scope.assignments = data;
      });
    });

    $scope.switchToAssignment = function() {
      $location.path("/assignment/" + this.assignment.id);
    };
    $scope.switchToVideo = function() {
      $location.path("/video/" + this.video.id);
    };
  }]);

masteryControllers.controller('AssignmentCtrl', ['$scope', '$location', '$routeParams', '$http',
  function ($scope, $location, $routeParams, $http) {
    $scope.assignmentId = $routeParams.assignment;
    $http.get('assignment/' + $scope.assignmentId).success(function(data) {
      console.log(data);
      $scope.assignment = data;
    });

    $scope.switchTo = function() {
      $location.path("/video/" + this.video.id);
    };
  }]);

masteryControllers.directive("timeUpdate", function() {
  return {
    require: "ngModel",
    link: function(scope, el, attrs, ngModel) {
      el[0].ontimeupdate = function() {
        ngModel.$setViewValue(Math.floor(el[0].currentTime));
      }

      ngModel.$render = function() {
        el[0].currentTime = ngModel.$viewValue;
      }
    }
  }
});


