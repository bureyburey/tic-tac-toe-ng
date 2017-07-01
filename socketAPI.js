var socket_io = require('socket.io');
var io = socket_io();
var socketAPI = {};

socketAPI.io = io;

var clients = {}

io.on('connection', function (socket) {
    
    clients[socket.id] = socket;
    console.log(socket.id + ' is now connected');
    socket.on('user-joined', function (user) {
        // add new user
        io.emit('add-user', {
            message: 'add user',
            id:socket.id,
            user: user
        });
    });

    socket.on('disconnect', function () {
        console.log(socket.id + ' have disconnected!');
        io.emit('remove-user', {
            message: 'remove-user',
            id:socket.id
        });
        delete clients[socket.id];
    });


    socket.on('request-userlist', function () {
        // request list of currently logged users
        io.emit('send-userlist', {
            message: 'send-userlist'
        });
    });

    socket.on('user-typing', function (data) {
        // request list of currently logged users
        io.emit('show-typing', {
            message: 'show-typing',
            username:data.username,
            body:data.body
        });
    });

    socket.on('response-userlist', function (userlist) {
        io.emit('get-userlist', {
            message: 'get-userlist',
            userlist: userlist
        });
    });

    socket.on('request-reset', function (req) {
        io.emit('confirm-reset', {
            message: 'confirm-reset',
            req: req
        });
    });

    socket.on('reset-board', function (selectedBoardSize) {
        io.emit('start-game', {
            message: 'start-game',
            selectedBoardSize: selectedBoardSize
        });
    });

    socket.on('update-board', function (data) {
        io.emit('make-move', {
            message: 'make-move',
            moveInfo: data
        });
    });

    socket.on('post-message', function (data) {
        io.emit('add-message', {
            message: 'add-message',
            msgInfo: data
        });
    });

});

module.exports = socketAPI;