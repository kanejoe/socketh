/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , sio = require('socket.io');

/**
 * App.
 */

var app = express();

/**
 * App configuration.
 */


app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
app.use(express.static(__dirname + '/public'));
app.set('port', process.env.PORT || 3000 );
app.set('views', __dirname);
app.set('view engine', 'jade');

function compile (str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
};

/**
 * App routes.
 */

app.get('/', function (req, res) {
  res.render('index', { layout: false });
});

/**
 * App listen.
 */


/**
 * start it up
 */
var port = process.env.PORT || 3000;
var server = app.listen( app.get('port'), function() {
  console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});


/**
 * Socket.IO server (single process only)
 */

var nicknames = {};
var io = sio.listen(server);

// Set our transports
/*io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 20);
});*/

io.sockets.on('connection', function (socket) {
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function (nick, fn) {
    if (nicknames[nick]) {
      fn(true);
    } else {
      fn(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});
