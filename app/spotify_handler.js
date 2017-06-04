var Queue, SpotifyHandler, _;

_ = require('lodash');

Queue = require('./queue');

SpotifyHandler = (function() {
  function SpotifyHandler(options) {
    var banned;
    this.spotify = options.spotify;
    this.config = options.config;
    this.storage = options.storage;
    this.queue = new Queue();
    this.queued_song_playing = false;
    if (!this.storage.getItem("banned")) {
      banned = ['spotify:track:6qR9iLM6J3u0mdGlqtldt8', 'spotify:track:2ZCTP54O2dMSbVrdsg60to'];
      this.storage.setItem("banned", banned);
    }
    if (!this.storage.getItem("ban_deck")) {
      this.storage.setItem("ban_deck", {});
    }
    this.connect_timeout = null;
    this.connected = false;
    this.playing = false;
    this.paused = false;
    this.state = {
      shuffle: true,
      track: {
        object: null,
        index: 0,
        name: null,
        artists: null
      },
      playlist: {
        name: null,
        object: null,
        shuffledTracks: null
      }
    };
    this.playlists = this.storage.getItem('playlists') || {};
    this.spotify.on({
      ready: this.spotify_connected.bind(this),
      logout: this.spotify_disconnected.bind(this)
    });
    this.spotify.player.on({
      endOfTrack: this.skip.bind(this)
    });
    this.connect();
  }

  SpotifyHandler.prototype.connect = function() {
    return this.spotify.login(this.config.username, this.config.password, false, false);
  };

  SpotifyHandler.prototype.pushQueue = function(track_uri) {
    var track;
    if (/track/.test(track_uri)) {
      track = this.spotify.createFromLink(this._sanitize_link(track_uri));
      if (!track) {
        return "Invalid track uri";
      }
      if (track.isLoaded) {
        this.queue.push(track);
      }
      return this.spotify.waitForLoaded([track], (function(_this) {
        return function(t) {
          return _this.queue.push(t);
        };
      })(this));
    }
  };

  SpotifyHandler.prototype.showQueue = function() {
    return this.queue.show();
  };

  SpotifyHandler.prototype.spotify_connected = function() {
    var last_playlist;
    this.connected = true;
    clearTimeout(this.connect_timeout);
    this.connect_timeout = null;
    if (this.state.playlist.name != null) {
      this.play();
    } else if (last_playlist = this.storage.getItem('last_playlist')) {
      this.set_playlist(last_playlist);
    } else if (this.playlists["default"] != null) {
      this.set_playlist('default');
    }
  };

  SpotifyHandler.prototype.spotify_disconnected = function() {
    this.connected = false;
    this.connect_timeout = setTimeout(((function(_this) {
      return function() {
        return _this.connect;
      };
    })(this)), 2500);
  };

  SpotifyHandler.prototype.update_playlist = function(err, playlist, tracks, position) {
    if (this.state.playlist.object != null) {
      this.state.playlist.object.off();
    }
    this.state.playlist.object = playlist;
    this.state.playlist.object.on({
      tracksAdded: this.update_playlist.bind(this),
      tracksRemoved: this.update_playlist.bind(this)
    });
    if (this.state.shuffle) {
      this._shuffle_playlist(playlist);
    }
  };

  SpotifyHandler.prototype.banCurrentSong = function(requesting_user) {
    var ban_deck, banned, track_uri, vote_count, votes;
    vote_count = 3;
    track_uri = this.state.track.object.link;
    ban_deck = this.storage.getItem('ban_deck');
    votes = ban_deck[track_uri] || [];
    votes.push(requesting_user);
    if (this.is_banned(track_uri)) {
      return false;
    }
    if (votes.length >= vote_count) {
      banned = this.storage.getItem("banned");
      banned.push(track_uri);
      this.storage.setItem("banned", banned);
      return 'banned';
    } else {
      votes = _.uniq(votes);
      ban_deck[track_uri] = votes;
      this.storage.setItem('ban_deck', ban_deck);
      return "on deck to be banned (" + votes.length + "/" + vote_count + ")";
    }
  };

  SpotifyHandler.prototype.is_banned = function(uri) {
    return this.storage.getItem("banned").indexOf(uri) > -1;
  };

  SpotifyHandler.prototype.bannedSongs = function() {
    return this.storage.getItem("banned");
  };

  SpotifyHandler.prototype.pause = function() {
    this.paused = true;
    this.spotify.player.pause();
  };

  SpotifyHandler.prototype.stop = function() {
    this.playing = false;
    this.paused = false;
    this.spotify.player.stop();
  };

  SpotifyHandler.prototype.skip = function(requesting_user) {
    if (requesting_user == null) {
      requesting_user = void 0;
    }
    if (this.queued_song_playing && !_.isUndefined(requesting_user)) {
      return this.voteSkip(requesting_user);
    } else {
      this.voteskips = [];
      if (this.queue.length() === 0) {
        this.play(this.get_next_track());
        return this.queued_song_playing = false;
      } else {
        this.play(this.queue.pop().link);
        return this.queued_song_playing = true;
      }
    }
  };

  SpotifyHandler.prototype.voteSkip = function(requesting_user) {
    var requested_skips;
    this.queued_song_playing = true;
    this.voteskips || (this.voteskips = []);
    requested_skips = _.uniq(this.voteskips.concat([requesting_user]));
    if (requested_skips.length < 3) {
      this.voteskips = requested_skips;
      return "skip requested (" + requested_skips.length + "/" + 3. + ")";
    } else {
      if (this.queue.length() > 0) {
        this.queued_song_playing = true;
        this.play(this.queue.pop().link);
      } else {
        this.queued_song_playing = false;
        this.skip();
      }
      this.voteskips = [];
      return "skip vote passed (" + requested_skips.length + "/" + 3. + ") [" + requested_skips + "]";
    }
  };

  SpotifyHandler.prototype.toggle_shuffle = function() {
    this.state.shuffle = !this.state.shuffle;
    return this.state.track.index = 0;
  };

  SpotifyHandler.prototype.is_playing = function() {
    return this.playing;
  };

  SpotifyHandler.prototype.is_paused = function() {
    return this.paused;
  };

  SpotifyHandler.prototype.play = function(track_or_link) {
    var new_track;
    if (track_or_link == null) {
      track_or_link = null;
    }
    this.paused = false;
    if (track_or_link != null) {
      if (typeof track_or_link === 'string' && /track/.test(track_or_link)) {
        new_track = this.spotify.createFromLink(this._sanitize_link(track_or_link));
        if (new_track == null) {
          return;
        }
      } else if (typeof track_or_link === 'object') {
        new_track = track_or_link;
      } else {
        return;
      }
    } else if (this.playing) {
      return this.spotify.player.resume();
    } else if (!new_track) {
      new_track = this.get_next_track();
    }
    if (this.is_banned(new_track.link)) {
      return;
    }
    if ((new_track != null) && new_track.isLoaded) {
      this._play_callback(new_track);
    } else if (new_track != null) {
      this.spotify.waitForLoaded([new_track], (function(_this) {
        return function(track) {
          return _this._play_callback(new_track);
        };
      })(this));
    }
  };

  SpotifyHandler.prototype._play_callback = function(track) {
    if (this.is_banned(this._sanitize_link(track.link))) {
      return this.skip();
    } else {
      this.state.track.object = track;
      this.state.track.name = this.state.track.object.name;
      this.state.track.artists = this.state.track.object.artists.map(function(artist) {
        return artist.name;
      }).join(", ");
      try {
        this.spotify.player.play(this.state.track.object);
        return this.playing = true;
      } catch (_error) {
        return this.skip();
      }
    }
  };

  SpotifyHandler.prototype.get_next_track = function() {
    var index;
    index = this.state.shuffle ? this._translate_shuffled_track_index(this.state.track.index++ % this.state.playlist.object.numTracks) : this.state.track.index++ % this.state.playlist.object.numTracks;
    return this.state.playlist.object.getTrack(index);
  };

  SpotifyHandler.prototype._shuffle_playlist = function(playlist) {
    return this.state.playlist.shuffledTracks = _.shuffle(playlist.getTracks());
  };

  SpotifyHandler.prototype._translate_shuffled_track_index = function(shuffledIndex) {
    var track, translatedIndex;
    track = this.state.playlist.shuffledTracks[shuffledIndex];
    translatedIndex = _.findIndex(this.state.playlist.object.getTracks(), {
      link: track.link
    });
    return translatedIndex;
  };

  SpotifyHandler.prototype.set_playlist = function(name) {
    var playlist;
    if (this.playlists[name] != null) {
      playlist = this.spotify.createFromLink(this.playlists[name]);
      if (playlist && playlist.isLoaded) {
        this._set_playlist_callback(name, playlist);
      } else if (playlist) {
        this.spotify.waitForLoaded([playlist], (function(_this) {
          return function(playlist) {
            _this._set_playlist_callback(name, playlist);
            return true;
          };
        })(this));
      }
    }
    return true;
  };

  SpotifyHandler.prototype._set_playlist_callback = function(name, playlist) {
    this.state.playlist.name = name;
    this.update_playlist(null, playlist);
    this.state.track.index = 0;
    this.play(this.get_next_track());
    this.storage.setItem('last_playlist', name);
  };

  SpotifyHandler.prototype.valid_spotify_playlist_url = function(spotify_url) {
    return (spotify_url == null) || !spotify_url.match(/spotify:user:.*:playlist:[0-9a-zA-Z]+/);
  };

  SpotifyHandler.prototype.add_playlist = function(name, spotify_url) {
    if ((name == null) || this.valid_spotify_playlist_url(spotify_url)) {
      return false;
    }
    spotify_url = this._sanitize_link(spotify_url.match(/spotify:user:.*:playlist:[0-9a-zA-Z]+/g)[0]);
    this.playlists[name] = spotify_url;
    this.storage.setItem('playlists', this.playlists);
    return true;
  };

  SpotifyHandler.prototype.remove_playlist = function(name) {
    if ((name == null) || (this.playlists[name] == null)) {
      return false;
    }
    delete this.playlists[name];
    this.storage.setItem('playlists', this.playlists);
    return true;
  };

  SpotifyHandler.prototype.rename_playlist = function(old_name, new_name) {
    if ((old_name == null) || (new_name == null) || (this.playlists[old_name] == null)) {
      return false;
    }
    this.playlists[new_name] = this.playlists[old_name];
    delete this.playlists[old_name];
    this.storage.setItem('playlists', this.playlists);
    return true;
  };

  SpotifyHandler.prototype._sanitize_link = function(link) {
    return link.replace(/[^0-9a-zA-Z:#]/g, '');
  };

  return SpotifyHandler;

})();

module.exports = function(options) {
  return new SpotifyHandler(options);
};

// ---
// generated by coffee-script 1.9.2