var masteryControllers = angular.module('masteryControllers', []);

masteryControllers.controller('VideoCtrl', ['$scope', '$routeParams', '$http',
  function ($scope, $routeParams, $http) {
    $scope.video = $routeParams.video;
    $http.get('video/' + $routeParams.video + '/data').success(function(data) {
      console.log(data);
      $scope.notes = data.notes;
      $http.get('assignment/' + data.assignment).success(function(data) {
        console.log(data);
        $scope.assignment = data;
      });
      $http.get('user/' + data.user).success(function(data) {
        console.log(data);
        $scope.user = data;
      });
    });
  }]);

masteryControllers.controller('PhoneDetailCtrl', ['$scope', '$routeParams',
  function($scope, $routeParams) {
    $scope.phoneId = $routeParams.phoneId;
  }]);
