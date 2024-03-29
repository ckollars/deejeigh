var BaseHandler, TrackHandler,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseHandler = require('./baseHandler');

TrackHandler = (function(superClass) {
  extend(TrackHandler, superClass);

  function TrackHandler() {
    return TrackHandler.__super__.constructor.apply(this, arguments);
  }

  TrackHandler.prototype.handlePause = function() {
    return this.spotify.pause();
  };

  TrackHandler.prototype.handleStop = function() {
    return this.spotify.stop();
  };

  TrackHandler.prototype.handleSkip = function(requestor) {
    var message;
    message = this.spotify.skip(requestor);
    if (typeof message === 'string') {
      return message;
    }
  };

  TrackHandler.prototype.handlePlay = function(uri) {
    if (this.invalid(uri)) {
      return "Please use a Spotify URI";
    }
    if ((uri != null) && this.spotify.queue.length() > 0) {
      return "Please use the queue.";
    } else if (uri != null) {
      return this.spotify.play(uri);
    } else {
      return this.spotify.play();
    }
  };

  TrackHandler.prototype.handleStatus = function() {
    var artist, playlist, playlistOrderPhrase, song;
    song = this.spotify.state.track.name;
    artist = this.spotify.state.track.artists;
    playlist = this.spotify.state.playlist.name;
    playlistOrderPhrase = this.spotify.state.shuffle ? " and it is being shuffled" : "";
    if (this.spotify.is_paused()) {
      return "Playback is currently *paused* on a song titled *" + song + "* from *" + artist + "*.\nYour currently selected playlist is named *" + playlist + "*" + playlistOrderPhrase + ".\nResume playback with `play`.";
    } else if (!this.spotify.is_playing()) {
      return "Playback is currently *stopped*. You can `play` or choose a `list`.";
    } else {
      return "You are currently letting your ears feast on the beautiful tunes titled *" + song + "* from *" + artist + "*.\nYour currently selected playlist is named *" + playlist + "*" + playlistOrderPhrase + ".";
    }
  };

  TrackHandler.prototype.handleQueue = function(uri) {
    var queued_tracks, response;
    if (this.invalid(uri)) {
      return "Please use a Spotify URI";
    }
    if (uri !== void 0) {
      this.spotify.pushQueue(uri);
      return 'OK';
    } else {
      queued_tracks = this.spotify.showQueue();
      response = ":musical_note: Queued Tracks :musical_note:\n";
      queued_tracks.forEach(function(track, index) {
        response += (index + 1) + ". " + track.name;
        response += "*" + track.artists[0].name + "*";
        return response += "[" + track.album.name + "]\n";
      });
      return response;
    }
  };

  TrackHandler.prototype.handleShuffle = function() {
    this.spotify.toggle_shuffle();
    if (this.spotify.state.shuffle) {
      return "ERRYDAY I'M SHUFFLING.";
    } else {
      return "I am no longer shuffling. Thanks for ruining my fun.";
    }
  };

  TrackHandler.prototype.invalid = function(uri) {
    return /http/.test(uri);
  };

  return TrackHandler;

})(BaseHandler);

module.exports = TrackHandler;

// ---
// generated by coffee-script 1.9.2
