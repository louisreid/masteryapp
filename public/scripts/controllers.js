var masteryControllers = angular.module('masteryControllers', []);

masteryControllers.controller('VideoCtrl', ['$scope', '$routeParams', '$http',
  function ($scope, $routeParams, $http) {
    $http.get('video/' + $routeParams.video + '/note').success(function(data) {
      console.log(data);
      $scope.notes = data.notes;
    });

    $scope.video = $routeParams.video;
  }]);

masteryControllers.controller('PhoneDetailCtrl', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    $scope.phoneId = $routeParams.phoneId;
  }]);
