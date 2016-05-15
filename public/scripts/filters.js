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
filter('filterVideosToUser', function() {
  return function(items, user) {
    var filtered = [];
    if (user != null) {
      angular.forEach(items, function(item) {
        if (user.videos.find(function(other) {return item.id == other.id;})) {
          filtered.push(item);
        }
      });
    }
    return filtered;
  };
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
}).
filter('sortVideos', function() {
  return function(items) {
    items = items || [];
    var sorted = items.slice();
    sorted.sort(function(other) {
      if ((!this.marked) && (other.marked)) { return -1; }
      else if ((this.marked) && (!other.marked)) { return 1; }
      else if ((this.promoted) && (!other.promoted)) { return -1; }
      else if ((!this.promoted) && (other.promoted)) { return 1; }
      else if ((this.passed) && (!other.passed)) { return -1; }
      else if ((!this.passed) && (other.passed)) { return 1; }
      else if ((this.returned) && (!other.returned)) { return -1; }
      else if ((!this.returned) && (other.returned)) { return 1; }
      else { return 0; }
    });
    return sorted;
  };
});
