'use strict';

// Declare app level module which depends on views, and components
angular.module("masteryApp",[
  'ngRoute',
  'masteryControllers',
  'masteryFilters'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/video/:video', {
    templateUrl: 'partials/video.html',
    controller: 'VideoCtrl'
  }).
  when('/dashboard', {
    templateUrl: 'partials/dashboard.html',
    controller: 'DashboardCtrl'
  }).
  when('/assignments', {
    templateUrl: 'partials/assignments.html',
    controller: 'AssignmentsCtrl'
  }).
  when('/class', {
    templateUrl: 'partials/class.html',
    controller: 'ClassCtrl'
  }).
  otherwise({redirectTo: '/video/ad50db0f-6346-4866-a1cd-57fa53834f13'});
}]);
