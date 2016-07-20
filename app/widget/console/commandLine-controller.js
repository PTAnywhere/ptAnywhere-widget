angular.module('ptAnywhere.widget.console')
    .controller('CommandLineController', ['$log', '$scope', '$location', '$uibModalInstance', 'locale',
                                          'WebsocketApiService', 'HistoryService', 'redirectionPath', 'endpoint',
                                          function($log, $scope, $location, $uibModalInstance, locale, wsApi, history,
                                                    redirectionPath, endpoint) {
        $scope.title = locale.commandLineDialog.title;
        $scope.disabled = true;
        $scope.output = [];
        $scope.lastLine = {
            prompt: '',
            command: ''
        };
        $scope.cachedCommand = null;  // The input will be cached when history commands are being shown.
        $scope.showingCached = false;  // Is the cached input being shown?

        history.markToUpdate(); // To avoid using the history of a previously opened modal


        $scope.isShowingCached = function() {
            return $scope.showingCached;
        };

        $scope.clearCached = function() {
            $scope.cachedCommand = null;
            $scope.showingCached = false;
        };

        $scope.isCaching = function() {
            return $scope.cachedCommand !== null;
        };

        $scope.updateCached = function() {
            $scope.cachedCommand = $scope.lastLine.command;
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.send = function (command) {
            wsApi.execute(command);
            $scope.lastLine.command = '';
            $scope.clearCached();
            history.markToUpdate();
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.onPreviousCommand = function () {
            if (history.needsToBeUpdated()) {
                wsApi.getHistory();
            } else {
                if (!$scope.isCaching() || $scope.isShowingCached())
                    $scope.updateCached();

                var previous = history.getPreviousCommand();
                if (previous !== null) {
                    $scope.lastLine.command = previous;
                    $scope.showingCached = false;
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            }
        };

        // History is not updated if we are trying to get the "next" of a command which is not part of the history.
        $scope.onNextCommand = function () {
            if (!history.needsToBeUpdated()) {
                var next = history.getNextCommand();
                if (next !== null) {
                    $scope.lastLine.command = next;
                    $scope.showingCached = false;
                } else {
                    if ($scope.isCaching()) {
                        $scope.lastLine.command = $scope.cachedCommand;
                        $scope.showingCached = true;
                    }
                }
                if(!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        };

        wsApi.onConnect(function() {
                    $log.debug('WebSocket connection opened.');
                    $scope.disabled = false;
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
                .onOutput(function(message) {
                    // Not sure that we will ever get more than a line, but just in case.
                    var lines = message.split('\n');
                    if (lines.length>1) {
                        for (var i=0; i<lines.length-1; i++) { // Unnecessary?
                            if (i === 0) {
                                var lastLine = $scope.lastLine.prompt;
                                if (lastLine.trim() !== '--More--' && lastLine !== '')
                                    // Write on top of the previous line
                                    //$scope.output[$scope.output.length-1] += lastLine;
                                    $scope.output.push(lastLine);
                                $scope.lastLine.prompt = '';
                            }
                            $scope.output.push(lines[i]);
                        }
                    }
                    $scope.lastLine.prompt += lines[lines.length-1];

                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
                .onCommandReplace(function(command) {
                    var showCurrentIfNull = false;
                    if (command !== null) {
                        $scope.lastLine.command = command;
                        if(!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                })
                .onHistory(function(historicalCommands) {
                    history.update(historicalCommands, function(onPreviousCommand) {
                        $scope.lastLine.command = onPreviousCommand;
                        if(!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                })
                .onError(function(event) {
                    $log.error('WebSocket error', event);

                    $scope.disabled = true;
                    $scope.lastLine.prompt = null;  // Hide div which handles user input
                    $scope.output = ['WebSocket error'];

                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
                .onDisconnect(function(event) {
                    $log.warn('WebSocket connection closed.', event);
                    $location.path(redirectionPath);
                    $uibModalInstance.dismiss('websocket closed');
                });
        wsApi.start(endpoint);

        $scope.$on('$destroy', function() {
            wsApi.stop();
        });
    }]);