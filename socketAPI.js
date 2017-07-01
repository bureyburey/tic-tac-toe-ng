var socket_io = require('socket.io');
var io = socket_io();
var socketAPI = {};

socketAPI.io = io;

io.on('connection', function (socket) {
    console.log('new connection');

    socket.on('user-joined', function (user) {
        io.emit('add-user', {
            message: 'add user',
            user: user
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