angular.module('ptAnywhere.widget.console')
    .controller('CommandLineController', ['$log', '$scope', '$injector', 'WebsocketApiService', 'HistoryService',
                                          function($log, $scope, $injector, wsApi, history) {
        var self = this;

        // Variables inherited in this controller scope
        self.onDisconnect = ('onDisconnect' in $scope)? $scope.onDisconnect : null;
        self.endpoint = ('endpoint' in $scope)? $scope.endpoint : null;
        if (self.endpoint === null) {
            self.endpoint = $injector.get('endpoint');
        }
        // End: Variables inherited

        self.disabled = true;
        self.output = [];
        self.lastLine = {
            prompt: '',
            command: ''
        };
        self.cachedCommand = null;  // The input will be cached when history commands are being shown.
        self.showingCached = false;  // Is the cached input being shown?

        history.markToUpdate(); // To avoid using the history of a previously opened modal


        self.isShowingCached = function() {
            return self.showingCached;
        };

        self.clearCached = function() {
            self.cachedCommand = null;
            self.showingCached = false;
        };

        self.isCaching = function() {
            return self.cachedCommand !== null;
        };

        self.updateCached = function() {
            self.cachedCommand = self.lastLine.command;
        };

        self.send = function (command) {
            wsApi.execute(command);
            self.lastLine.command = '';
            self.clearCached();
            history.markToUpdate();
        };

        self.onPreviousCommand = function () {
            if (history.needsToBeUpdated()) {
                wsApi.getHistory();
            } else {
                if (!self.isCaching() || self.isShowingCached())
                    self.updateCached();

                var previous = history.getPreviousCommand();
                if (previous !== null) {
                    self.lastLine.command = previous;
                    self.showingCached = false;
                }
            }
        };

        // History is not updated if we are trying to get the "next" of a command which is not part of the history.
        self.onNextCommand = function () {
            if (!history.needsToBeUpdated()) {
                var next = history.getNextCommand();
                if (next !== null) {
                    self.lastLine.command = next;
                    self.showingCached = false;
                } else {
                    if (self.isCaching()) {
                        self.lastLine.command = self.cachedCommand;
                        self.showingCached = true;
                    }
                }
            }
        };

        wsApi.onConnect(function() {
                    $log.debug('WebSocket connection opened.');
                    self.disabled = false;
                })
                .onOutput(function(message) {
                    // Not sure that we will ever get more than a line, but just in case.
                    var lines = message.split('\n');
                    if (lines.length>1) {
                        for (var i=0; i<lines.length-1; i++) { // Unnecessary?
                            if (i === 0) {
                                var lastLine = self.lastLine.prompt;
                                if (lastLine.trim() !== '--More--' && lastLine !== '')
                                    // Write on top of the previous line
                                    //self.output[self.output.length-1] += lastLine;
                                    self.output.push(lastLine);
                                self.lastLine.prompt = '';
                            }
                            self.output.push(lines[i]);
                        }
                    }
                    self.lastLine.prompt += lines[lines.length-1];
                })
                .onCommandReplace(function(command) {
                    var showCurrentIfNull = false;
                    if (command !== null) {
                        self.lastLine.command = command;
                    }
                })
                .onHistory(function(historicalCommands) {
                    history.update(historicalCommands, function(onPreviousCommand) {
                        self.lastLine.command = onPreviousCommand;
                    });
                })
                .onError(function(event) {
                    $log.error('WebSocket error', event);

                    self.disabled = true;
                    self.lastLine.prompt = null;  // Hide div which handles user input
                    self.output = ['WebSocket error'];
                })
                .onDisconnect(function(event) {
                    $log.warn('WebSocket connection closed.', event);
                    if (self.onDisconnect === null) {
                        self.disabled = true;
                        self.lastLine.prompt = null;  // Hide div which handles user input
                        self.output = ['WebSocket closed'];
                    } else {
                        self.onDisconnect(event);
                    }
                });

        wsApi.start(self.endpoint);

        $scope.$on('$destroy', function() {
            wsApi.stop();
        });
    }]);