/**
 * socket API
 */
var socket_io = require('socket.io');
var io = socket_io();
var socketAPI = {};

// io will be passed to /bin/www using module.exports
socketAPI.io = io;

var clients = {}

io.on('connection', function (socket) {
    // save current socket id
    clients[socket.id] = socket;
    console.log(socket.id + ' is now connected');
    socket.on('user-joined', function (user) {
        // add new user to connected users list
        io.emit('add-user', {
            message: 'add user',
            id: socket.id,
            user: user
        });
    });

    socket.on('disconnect', function () {
        // remove disconnected user (fired on browser refresh/close/navigation to another site)
        console.log(socket.id + ' have disconnected!');
        io.emit('remove-user', {
            message: 'remove-user',
            id: socket.id
        });
        delete clients[socket.id];
    });

    socket.on('request-userlist', function () {
        // request list of all currently logged users (from any other user who logged before tihs user)
        io.emit('send-userlist', {
            message: 'send-userlist'
        });
    });

    socket.on('response-userlist', function (userlist) {
        // send the list of logged users (in response to 'request-userlist')
        io.emit('get-userlist', {
            message: 'get-userlist',
            userlist: userlist
        });
    });

    socket.on('request-reset', function (req) {
        // request game reset (sends the request to the other user who needs to confirm it)
        io.emit('confirm-reset', {
            message: 'confirm-reset',
            req: req
        });
    });

    socket.on('reset-board', function (selectedBoardSize) {
        // reset game for all connected users (will be fired after boardd size confirmation or after 'request-reset' confirmation)
        io.emit('start-game', {
            message: 'start-game',
            selectedBoardSize: selectedBoardSize
        });
    });

    socket.on('update-board', function (data) {
        // send which next move need to be made
        io.emit('make-move', {
            message: 'make-move',
            moveInfo: data
        });
    });

    socket.on('user-typing', function (data) {
        // send information of which user is currently typing
        io.emit('show-typing', {
            message: 'show-typing',
            username: data.username,
            body: data.body
        });
    });

    socket.on('post-message', function (data) {
        // sends the new chat message data
        io.emit('add-message', {
            message: 'add-message',
            msgInfo: data
        });
    });

});

module.exports = socketAPI;