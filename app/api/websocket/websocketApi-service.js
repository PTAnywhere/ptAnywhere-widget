angular.module('ptAnywhere.api.websocket')
    .factory('WebsocketApiService', ['$log', '$websocket', function($log, $websocket) {
        var ws;
        var callbacks = {};

        function listenWebsocket(websocket) {
            websocket.onOpen = function() {
                $log.debug('WebSocket connection opened.');
                callbacks.connected();
            };

            websocket.onMessage = function(event) {
                var msg = JSON.parse(event.data);
                if (msg.hasOwnProperty('prompt')) {  // At the beginning of the session
                    callbacks.output(msg.prompt);
                } else if (msg.hasOwnProperty('out')) {
                    callbacks.output(msg.out);
                } else if (msg.hasOwnProperty('history')) {
                    history.update(msg.history, function(previousCommand) {
                        callbacks.replace(previousCommand);
                    });
                }
            };

            websocket.onError = function(event) {
              $log.error('WebSocket error:');
              $log.error(event);
              callbacks.warning('Websocket error.');
            };

            websocket.onClose = function(event) {
              $log.warn('WebSocket connection closed, Code: ' + event.code);
              if (event.reason !== '') {
                $log.warn('\tReason: ' + event.reason);
              }
              callbacks.warning('Connection closed. ' + event.reason);
            };
        }

        return {
            /**
             *  Sets callbacks.
             *  @param {string} websocketURL - URL of the websocket for the PTAnywhere
             *         command line.
             *  @param {connectionCallback} connectedCallback - Function to be called after
             *         a successful websocket connection.
             *  @param {outputCallback} outputCallback - Function to be called on message
             *         reception.
             *  @param {replaceCommandCallback} replaceCommandCallback - Function to be
             *         called when the current command needs to be replaced.
             *  @param {warningCallback} warningCallback - Function to be called when a
             *         warning message is created.
             */
            setCallbacks: function(connectedCallback, outputCallback, replaceCommandCallback, warningCallback) {
                callbacks.connected = connectedCallback;
                callbacks.output = outputCallback;
                callbacks.replace = replaceCommandCallback;
                callbacks.warning = warningCallback;
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