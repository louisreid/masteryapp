'use strict';

// Declare app level module which depends on views, and components
angular.module("masteryLoginApp",[
  'ngRoute',
  'masteryLoginControllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/login', {
    templateUrl: 'partials/login.html',
    controller: 'LoginCtrl'
  }).
  when('/signup', {
    templateUrl: 'partials/signup.html',
    controller: 'SignupCtrl'
  }).
  otherwise({redirectTo: '/login'});
}]);
