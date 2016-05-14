angular.module('masteryFilters', []).
filter('timestamp', function() {
  return function(number) {
    return (number == null)
        ? number
        : Math.floor(number / 60) + ":" + ((number % 60 > 9) ? (number % 60) : '0' + (number % 60));
  };
}).
filter('videoUrl', function() {
  return function(id) {
    return "video/" + id;
  }
});
