var BaseHandler, PlaylistHandler,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BaseHandler = require('./baseHandler');

PlaylistHandler = (function(superClass) {
  extend(PlaylistHandler, superClass);

  function PlaylistHandler() {
    return PlaylistHandler.__super__.constructor.apply(this, arguments);
  }

  PlaylistHandler.prototype.handleAddList = function(name, uri) {
    this.spotify.add_playlist(name, uri);
    return "Playlist Added";
  };

  PlaylistHandler.prototype.handleRemoveList = function(name) {
    this.spotify.remove_playlist(name);
    return "Playlist Removed";
  };

  PlaylistHandler.prototype.handleRenameList = function(old_name, new_name) {
    this.spotify.rename_playlist(old_name, new_name);
    return "Playlist Renamed to " + new_name;
  };

  PlaylistHandler.prototype.handlePlayPlaylist = function(name) {
    this.spotify.set_playlist(name);
    return "Playing " + name;
  };

  PlaylistHandler.prototype.handleList = function() {
    var key, res;
    res = 'Currently available playlists:';
    for (key in this.spotify.playlists) {
      res += "\n*" + key + "* (" + this.spotify.playlists[key] + ")";
    }
    return res;
  };

  return PlaylistHandler;

})(BaseHandler);

module.exports = PlaylistHandler;

// ---
// generated by coffee-script 1.9.2
