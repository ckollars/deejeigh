// Currently developing this app from this one file while I learn
// then I'll slowly structure it into correct files and directories

const ApiServer = require('apiserver');
// const SpotifyWebApi = require('spotify-web-api-node');
// const Config = require('./config.json');
const SlackInterface = require('./app/slack_interface/SlackInterface')();
const server = new ApiServer({ port: 8000 });

server.use(ApiServer.payloadParser());
server.addModule('1', 'slack_interface', SlackInterface);

server.router.addRoutes([
  ['/handle', '1/slack_interface#handle'],
]);

server.listen();
console.log('Server running. Yay!');
