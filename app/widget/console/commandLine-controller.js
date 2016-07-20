angular.module('ptAnywhere.widget.console')
    .controller('CommandLineController', ['$scope', '$uibModalInstance', 'locale', 'WebsocketApiService', 'HistoryService', 'endpoint',
                                          function($scope, $uibModalInstance, locale, wsApi, history, endpoint) {
        $scope.title = locale.commandLineDialog.title;
        $scope.disabled = true;
        $scope.output = [];
        $scope.lastLine = {
            prompt: '',
            command: ''
        };
        $scope.inputCached = false;  // Is the input being cached because history commands are being shown?

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.send = function (command) {
            wsApi.execute(command);
            $scope.lastLine.command = '';
            // TODO cmd.clearCached();
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.onPreviousCommand = function () {
            /*if (!cmd.isCaching() || cmd.isShowingCached())
                cmd.updateCached();
            ptAnywhere.websocket.previous();*/
            console.log('Previous');
        };

        $scope.onNextCommand = function () {
            /*ptAnywhere.websocket.next();*/
            console.log('Next');
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
                        console.log($scope.output);
                    }
                    $scope.lastLine.prompt += lines[lines.length-1];
                    //TODO $('.' + html.cCurrent, cmd.selector).focus();

                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
                .onCommandReplace(function(command) {
                    console.log('Replace', command);
                    var showCurrentIfNull = false;
                    if (command !== null) {
                        $scope.lastLine.command = command;
                        $scope.inputCached = false;
                        if(!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                })
                .onHistory(function(historicalCommands) {
                    console.log(historicalCommands);
                })
                .onWarning(function(message) {
                    $scope.disabled = true;
                    $scope.lastLine.prompt = null;  // Hide div which handles user input
                    $scope.output = [ message ];
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
        wsApi.start(endpoint);

        /* if (typeof showCurrentIfNull!=='undefined' && showCurrentIfNull && this.isCaching()) {
            $('.' + html.cCurrent, this.selector).text(this.getCached());
            $scope.inputCached = true;
        } */

        $scope.$on('$destroy', function() {
            wsApi.stop();
        });
    }]);