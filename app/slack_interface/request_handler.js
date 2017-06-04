var PlaylistHandler, SlackInterfaceRequestHandler, TrackHandler;

PlaylistHandler = require('./playlistHandler');

TrackHandler = require('./trackHandler');

SlackInterfaceRequestHandler = (function() {
  function SlackInterfaceRequestHandler(auth, spotify, volume) {
    this.auth = auth;
    this.spotify = spotify;
    this.volume = volume;
    this.playlistHandler = new PlaylistHandler(spotify);
    this.trackHandler = new TrackHandler(spotify);
    this.endpoints = {
      handle: {
        post: (function(_this) {
          return function(request, response) {
            request.resume();
            request.once("end", function() {
              var reply_data;
              if (!_this.auth.validate(request, response)) {
                return;
              }
              reply_data = {
                ok: true
              };
              if (_this.auth.user_name === 'slackbot') {
                return;
              }
              reply_data['text'] = (function() {
                switch (this.auth.command.toLowerCase()) {
                  case 'pause':
                    return this.trackHandler.handlePause();
                  case 'stop':
                    return this.trackHandler.handleStop();
                  case 'skip':
                    return this.trackHandler.handleSkip(this.auth.user_name);
                  case 'play':
                    return this.trackHandler.handlePlay(this.auth.args[0]);
                  case 'status':
                    return this.trackHandler.handleStatus();
                  case 'queue':
                    return this.trackHandler.handleQueue(this.auth.args[0]);
                  case 'shuffle':
                    return this.trackHandler.handleShuffle();
                  case 'mute':
                    return this.handleMute();
                  case 'vol':
                    return this.handleVol();
                  case 'help':
                    return this.handleHelp();
                  case 'voteban':
                    return this.handleVoteBan();
                  case 'banned':
                    return this.handleBanned();
                  case 'list':
                    switch (this.auth.args[0]) {
                      case 'add':
                        return this.playlistHandler.handleAddList(this.auth.args[1], this.auth.args[2]);
                      case 'remove':
                        return this.playlistHandler.handleRemoveList(this.auth.args[1]);
                      case 'rename':
                        return this.playlistHandler.handleRenameList(this.auth.args[1], this.auth.args[2]);
                      case void 0:
                        return this.playlistHandler.handleList();
                      default:
                        return this.playlistHandler.handlePlayPlaylist(this.auth.args[0]);
                    }
                    break;
                }
              }).call(_this);
              response.serveJSON(reply_data);
            });
          };
        })(this)
      }
    };
  }

  SlackInterfaceRequestHandler.prototype.handleMute = function() {
    return this.volume.set(0);
  };

  SlackInterfaceRequestHandler.prototype.handleVol = function() {
    if (this.auth.args[0] != null) {
      switch (this.auth.args[0]) {
        case "up":
          return this.volume.up();
        case "down":
          return this.volume.down();
        default:
          return this.volume.set(this.auth.args[0]);
      }
    } else {
      return "Current Volume: *" + this.volume.current_step + "*";
    }
  };

  SlackInterfaceRequestHandler.prototype.handleHelp = function() {
    var response;
    return response = "You seem lost. Here is a list of commands that are available to you:\n*Commands*\n> `play [Spotify URI]` - Starts/resumes playback\n> `play [Spotify URI]` - Immediately switches to the linked track.\n> `pause` - Pauses playback at the current time.\n> `stop` - Stops playback and resets to the beginning of the current track.\n> `skip` - Skips (or shuffles) to the next track in the playlist.\n> `shuffle` - Toggles shuffle on or off.\n> `vol [up|down]` Turns the volume either up/down one notch.\n> `vol [0..10]` Adjust volume directory to a step between `0` and `10`.\n> `mute` - Same as `vol 0`.\n> `unmute` - Same as `vol 0`.\n> `status` - Shows the currently playing song, playlist and whether you're shuffling or not.\n> `voteban` - Cast a vote to have the current track banned\n> `banned` - See tracks that are currently banned\n> `help` - Shows a list of commands with a short explanation.\n\n*Queue*\n> `queue [Spotify URI]` - Add a song to the queue\n> `queue` - See the tracks currently in the queue\n\n*Playlists*\n> `list add <name> <Spotify URI>` - Adds a list that can later be accessed under <name>.\n> `list remove <name>` - Removes the specified list.\n> `list rename <old name> <new name>` - Renames the specified list.\n> `list <name>` - Selects the specified list and starts playback.";
  };

  SlackInterfaceRequestHandler.prototype.handleVoteBan = function() {
    var status, track_name;
    track_name = this.spotify.state.track.name;
    if (status = this.spotify.banCurrentSong(this.auth.user)) {
      if (status === 'banned') {
        this.spotify.skip();
      }
      return track_name + " is now " + status;
    } else {
      return track_name + " has *already* been banned";
    }
  };

  SlackInterfaceRequestHandler.prototype.handleBanned = function() {
    return ":rotating_light: BANNED TRACKS :rotating_light: \n" + (this.spotify.bannedSongs().join("\n"));
  };

  return SlackInterfaceRequestHandler;

})();

module.exports = function(auth, spotify, volume) {
  var handler;
  handler = new SlackInterfaceRequestHandler(auth, spotify, volume);
  return handler.endpoints;
};

// ---
// generated by coffee-script 1.9.2
