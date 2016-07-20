angular.module('ptAnywhere.api.websocket')
    .factory('WebsocketApiService', ['$log', '$websocket', function($log, $websocket) {
        var ws;
        var callbacks = {};

        function listenWebsocket(websocket) {

            websocket.onOpen(function() {
                callbacks.connected();
            });

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

            websocket.onError(function(event) {
              $log.error('WebSocket error:');
              $log.error(event);
              callbacks.warning('Websocket error.');
            });

            websocket.onClose(function(event) {
              $log.warn('WebSocket connection closed, Code: ' + event.code);
              if (event.reason !== '') {
                $log.warn('\tReason: ' + event.reason);
              }
              callbacks.warning('Connection closed. ' + event.reason);
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
             *  @param {historyCallback} historyCallback - Function to be called when a command
             *         history list is get.
             *  @return The service modified.
             */
            onWarning: function(warningCallback) {
                callbacks.warning = warningCallback;
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
            getHistory: function() {
                ws.send('/getHistory');
            }
        };
    }]);