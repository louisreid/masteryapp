var masteryDirectives = angular.module('masteryDirectives', []);

masteryDirectives.directive('videoList', function(){
	return {
		templateUrl: 'templates/video-list.html',
		controller: 'videoListCtrl',
		replace: true
	};
});

masteryDirectives.directive('submitVideo', function(){
	return {
		templateUrl: 'templates/submit-video.html',
		controller: 'submitVideoCtrl',
		replace: true
	};
});