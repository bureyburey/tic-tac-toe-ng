var app = angular.module('TicTacToe', ['ui.router']);


app.factory('socket', function ($rootScope) {
    /**
     * socket factory wrapper
     * handles 'on' and 'emit' socket events
     */
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

app.factory('tictactoe', function ($rootScope) {
    var obj = {};

    obj.resetGame = function (rowSize) {
        obj.rowSize = rowSize;
        obj.gameBoard = (new Array(obj.rowSize * obj.rowSize)).fill('-');
        obj.turn = 'o';
        obj.winner = null;
        obj.winCode = '';
    }

    obj.checkWin = function (player) {
        var count = 0;
        var SIZE = obj.rowSize; // board is SIZE * SIZE
        // check rows
        for (let i = 0; i < SIZE * SIZE; i++) {
            // encountered player piece --> increase counter
            if (obj.gameBoard[i] === player)
                count++;
            else // SIZE is broken --> reset the counter
                count = 0;
            // if the counter has sufficient SIZE, return the player as the winner
            if (count === SIZE) {
                // obj.winCode = 'row ' + count-SIZE + ' ' + count;
                return player; // player won
            }
            // reached the end of a row (last column) --> reset the counter
            if (i % SIZE === SIZE - 1) {
                count = 0;
            }
        }
        // check columns
        for (let i = 0, col = 0; i < SIZE * SIZE; i++) {
            // encountered player piece --> increase counter
            if (obj.gameBoard[col + (i % SIZE) * SIZE] === player)
                count++;
            else // SIZE is broken --> reset the counter
                count = 0;
            // if the counter has sufficient SIZE, return the player as the winner
            if (count === SIZE) {
                return player; // player won
            }
            // reached the end of a column (last row) --> reset the counter
            if (i % SIZE === SIZE - 1) {
                count = 0;
                // only increase col variable after the first iteration (the above 'if' is invoked at i==0)
                if (i > 0)
                    col++;
            }
        }
        // check Left To Right diagonals from top to bottom (main diagonals)
        for (let i = 0; i < SIZE * SIZE; i++) {
            // for each iteration of i, reset the counter
            count = 0;
            // start at i and iterate to the last index
            // increment j with SIZE+1
            // (+SIZE will result in getting the next row, +1 will result in one index to the right)
            for (let j = i; j < SIZE * SIZE; j += SIZE + 1) {
                // count player pieces
                if (obj.gameBoard[j] === player)
                    count++;
                else // reset the counter if the SIZE is broken
                    count = 0;
                // check if the count SIZE is sufficient for a win
                if (count === SIZE)
                    return player;
                // if j is out of bound of the array index
                // or reached the right border (j % SIZE == SIZE-1), break the loop
                if (j >= SIZE * SIZE || j % SIZE === SIZE - 1)
                    break;
            }
        }
        // check Left To Right diagonals from bottom to top (secondary diagonals)
        // start at the end of the board (last index) and go backward until reaching 0
        for (let i = SIZE * SIZE - 1; i >= 0; i--) {
            // for each iteration of i, reset the counter
            count = 0;
            // start at i and iterate to the last index
            // decrement j with SIZE-1
            // (-SIZE will result in getting the previous row, -1 will result in one index to the left)
            for (let j = i; j > 0; j -= (SIZE - 1)) {
                // count player pieces
                if (obj.gameBoard[j] === player)
                    count++;
                else // reset the counter if the SIZE is broken
                    count = 0;
                // check if the count SIZE is sufficient for a win
                if (count === SIZE)
                    return player;
                // if j is out of bound of the array index
                // or reached the right border (j % SIZE == 0), break the loop
                if (j < 0 || j % SIZE === SIZE - 1)
                    break;
            }
        }
        // check draw
        for (let i = 0; i < SIZE * SIZE; i++) {
            // if encountered a blank location, return 0 meaning the game can still be played
            if (obj.gameBoard[i] !== 'o' && obj.gameBoard[i] !== 'x')
                return 0;
        }
        // none of the above returns invoked --> game ended as a draw
        return -1;
    }

    obj.updateBoard = function (loc, player) {
        if (obj.gameBoard[loc] === 'x' || obj.gameBoard[loc] === 'o' || obj.winner || obj.turn !== player) { return; }
        obj.gameBoard[loc] = player;


        if (obj.turn === 'x') { obj.turn = 'o' }
        else { obj.turn = 'x' }

        let result = obj.checkWin(player);

        if (result === player) {
            alert(player + " Won!");
            obj.winner = player;
        }
        else if (result === -1) {
            alert("Draw!");
            obj.winner = 'draw';
        }
    }
    return obj;
});

app.factory('chat', function () {
    var obj = {
        messages: []
    }
    obj.postMessage = function (data) {
        obj.messages.push({
            username: data.username,
            body: data.body,
            time: new Date()
        });
    }
    return obj;
});

app.controller('HomeCtrl', [
    '$scope',
    '$rootScope',
    'socket',
    'tictactoe',
    'chat',
    function ($scope, $rootScope, socket, tictactoe, chat) {
        $scope.tictactoe = tictactoe; // get tictactoe service
        $scope.loggedUsers = [];
        $scope.currentUser = {};
        // $scope.currentUser = $rootScope.currentUser || null;
        $scope.chat = chat;

        $scope.gameSettings = {
            // preset board size options
            boardSizes: [3, 4, 5, 6],
            selectedBoardSize: tictactoe.rowSize || null,
            gameInProgress: false
        }


        $scope.join = function () {
            $scope.currentUser.player = $scope.loggedUsers.length ? 'x' : 'o';
            // $rootScope.currentUser = $scope.currentUser;
            socket.emit('user-joined', $scope.currentUser);
        };

        $scope.requestReset = function () {
            socket.emit('request-reset', { initiatedBy: $scope.currentUser.username });
        }

        $scope.resetGame = function () {
            socket.emit('reset-board', $scope.gameSettings.selectedBoardSize);
        }

        $scope.updateBoard = function ($index) {
            socket.emit('update-board', { loc: $index, player: $scope.currentUser.player });
        }

        $scope.postMessage = function () {
            socket.emit('post-message', { username: $scope.currentUser.username, body: $scope.message.body });
        }

        socket.on('add-user', function (data) {
            // alert(JSON.stringify(data))
            if ($scope.currentUser.username) { $scope.currentUser.logged = true; }
            $scope.loggedUsers.push(data.user);
            // $scope.$apply(function () {
            // });
        });

        socket.on('confirm-reset', function (data) {
            if(data.req.initiatedBy !== $scope.currentUser.username){
                if(confirm("User " + data.req.initiatedBy + " Initiated Game Reset\nReset Game?")){
                    $scope.resetGame();
                }
            }
        });

        socket.on('start-game', function (data) {
            $scope.gameSettings.gameInProgress = true;
            $scope.gameSettings.selectedBoardSize = data.selectedBoardSize;
            $scope.tictactoe.resetGame(data.selectedBoardSize);
        });

        socket.on('make-move', function (data) {
            $scope.tictactoe.updateBoard(data.moveInfo.loc, data.moveInfo.player);
        });

        socket.on('add-message', function (data) {
            $scope.chat.postMessage(data.msgInfo);
        });

    }
]);


app.controller('AboutCtrl', [
    '$scope',
    function ($scope) {
    }
]);

app.controller('NavCtrl', [
    '$scope',
    function ($scope) {

    }
]);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'HomeCtrl'
            })
            .state('about', {
                url: '/about',
                templateUrl: '/about.html',
                controller: 'AboutCtrl'
            });

        $urlRouterProvider.otherwise('home');
    }
]);