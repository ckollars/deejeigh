const Config = require('../../config.json');
const Spotify = require('spotify-web-api-node');
const store = require('node-persist');
const AuthHandler = require('../auth_handler')(Config.auth);
const VolumeHandler = require('../volume_handler')();

module.exports = function () {
  // Path to Spotify's AppKey
  store.initSync();


  // const SpotifyHandler = require('../spotify_handler')({
  //   storage: store,
  //   config: Config.spotify,
  //   spotify: Spotify({
  //     appkeyFile: appkey_path
  //   })
  // });

  return require('./request_handler')(AuthHandler, SpotifyHandler, VolumeHandler);
};

