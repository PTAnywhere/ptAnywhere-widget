angular.module('ptAnywhere.api.websocket')
    .factory('WebsocketApiService', ['$websocket', function($websocket) {

        var ws;
        var fn = function() {};
        var callbacks = {
            connected: fn,
            disconnected: fn,
            error: fn,
            output: fn
        };

        function listenWebsocket(websocket) {
            websocket.onOpen(callbacks.connected);
            websocket.onClose(callbacks.disconnected);
            websocket.onError(callbacks.error);
            websocket.onMessage(function(event) {
                // FIXME The following guard only exists because of the associated unit test.
                if (typeof event === 'object' && 'data' in event) {
                    var msg = JSON.parse(event.data);
                    if (msg.hasOwnProperty('prompt')) {  // At the beginning of the session
                        callbacks.output(msg.prompt);
                    } else if (msg.hasOwnProperty('out')) {
                        callbacks.output(msg.out);
                    } else if (msg.hasOwnProperty('history')) {
                        callbacks.history(msg.history);
                    }
                }
            });
        }

        return {
            /**
             *  Sets callback.
             *  @param {connectionCallback} connectedCallback - Function to be called after
             *         a successful websocket connection.
             *  @return The service modified.
             */
            onConnect: function(connectedCallback) {
                callbacks.connected = connectedCallback;
                return this;
            },
            /**
             *  Sets callback.
             *  @param {disconnectionCallback} disconnectionCallback - Function to be called after
             *      the websocket connection.
             *  @return The service modified.
             */
            onDisconnect: function(disconnectionCallback) {
                callbacks.disconnected = disconnectionCallback;
                return this;
            },
            /**
             *  Sets callback.
             *  @param {outputCallback} outputCallback - Function to be called on message
             *         reception.
             *  @return The service modified.
             */
            onOutput: function(outputCallback) {
                callbacks.output = outputCallback;
                return this;
            },
            /**
             *  Sets callback.
             *  @param {replaceCommandCallback} replaceCommandCallback - Function to be
             *         called when the current command needs to be replaced.
             *  @return The service modified.
             */
            onCommandReplace: function(replaceCommandCallback) {
                callbacks.replace = replaceCommandCallback;
                return this;
            },
            /**
             *  Sets callback.
             *  @param {historyCallback} historyCallback - Function to be called when a command
             *         history list is get.
             *  @return The service modified.
             */
            onHistory: function(historyCallback) {
                callbacks.history = historyCallback;
                return this;
            },
            /**
             *  Sets callback.
             *  @param {errorCallback} errorCallback - Function to be called when an error is get.
             *  @return The service modified.
             */
            onError: function(errorCallback) {
                callbacks.error = errorCallback;
                return this;
            },
            /**
             *  Connects to websocket endpoint.
             *  @param {string} websourlcketURL - URL of the websocket for the PTAnywhere command line.
             */
            start: function(url) {
                ws = $websocket(url);
                listenWebsocket(ws);
            },
            /**
             *  Disconnects from websocket endpoint.
             */
            stop: function() {
                ws.close();
            },
            /**
             *  Executes command in the console.
             *  @param {string} command - Command to be executed in the command line.
             */
            execute: function(command) {
                ws.send(command);
            },
            /**
             *  Sends a request to update the command history.
             */
            getHistory: function() {
                ws.send('/getHistory');
            }
        };
    }]);