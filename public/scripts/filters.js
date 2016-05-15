angular.module('masteryFilters', []).
filter('timestamp', function() {
  return function(number) {
    return (number == null)
        ? number
        : Math.floor(number / 60) + ":" + ((number % 60 > 9) ? (number % 60) : '0' + (number % 60));
  };
}).
filter('thumbUrl', function() {
  return function(id) {
    return "video/" + id + "/thumb.png";
  }
}).
filter('videoUrl', function() {
  return function(id) {
    return "video/" + id;
  }
}).
filter('otherUnmarkedVideos', function() {
  return function(items, video) {
    var filtered = [];
    angular.forEach(items, function(item) {
      if ((item.id != video) &&
          (!item.marked)) {
        filtered.push(item);
      }
    });
    return filtered;
  };
});
