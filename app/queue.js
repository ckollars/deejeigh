
const Queue = (() => {
  function Queue() {
    this.data = [];
  }

  Queue.prototype.show = function () {
    return this.data;
  };

  Queue.prototype.pop = function () {
    return this.data.shift();
  };

  Queue.prototype.length = function () {
    return this.data.length;
  };

  Queue.prototype.push = function (track) {
    if (this.data.length > 10 || this.trackIsInQueue(track)) {
      return false;
    }
    return this.data.push(track);
  };

  Queue.prototype.trackIsInQueue = function(track) {
    return this.data.filter(function (obj) {
      return obj.link === track.link;
    }).length > 0;
  };

  return Queue;

})();

module.exports = Queue;
