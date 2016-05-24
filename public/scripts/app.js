'use strict';

// Declare app level module which depends on views, and components
angular.module("masteryApp",[
  'ngRoute',
  'mgcrea.ngStrap',
  'masteryControllers',
  'masteryFilters'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/video/:video', {
    templateUrl: 'partials/video.html',
    controller: 'VideoCtrl'
  }).
  when('/dashboard/:user?', {
    templateUrl: 'partials/dashboard.html',
    controller: 'DashboardCtrl'
  }).
  when('/assignment/:assignment', {
    templateUrl: 'partials/assignment.html',
    controller: 'AssignmentCtrl'
  }).
  when('/upload/:user/:assignment', {
    templateUrl: 'partials/upload.html',
    controller: 'UploadCtrl'
  }).
  otherwise({redirectTo: '/dashboard/'});
}]);
