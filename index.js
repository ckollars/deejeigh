// Currently developing this app from this one file while I learn
// then I'll slowly structure it into correct files and directories

// Settings
const Config = require('./config.json');
const ApiServer = require('apiserver');
const SpotifyWebApi = require('spotify-web-api-node');

const server = new ApiServer({ port: 8000 });
server.use(ApiServer.payloadParser());

server.addModule('1', 'slack_interface', {

});

server.router.addRoutes([
  ['/foo', '1/fooModule#foo'],
]);

server.listen()
console.info 'Server running. Yay!'

// credentials are optional
const spotifyApi = new SpotifyWebApi({
  clientId: Config.spotify.clientId,
  clientSecret: Config.spotify.clientSecret,
});

spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE')
  .then((data) => {
    console.log('Artist albums', data.body);
  }, (err) => {
    console.error(err);
  });
