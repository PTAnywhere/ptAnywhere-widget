/**
 * ptAnywhere - User friendly interface to use PT Anywhere.
 * @version v2.0.2
 * @link http://pt-anywhere.kmi.open.ac.uk
 */
angular.module('ptAnywhere', []);
angular.module('ptAnywhere.templates', []);
angular.module('ptAnywhere.locale', [])
    .config(['$injector', '$provide', function($injector, $provide) {
        $log = console;  // FIXME Apparently $log injection does not work in my tests.

        // default selection (this constant is already provided in the distributed JS).
        var selectedLocale = 'locale_en';
        try {
            selectedLocale = $injector.get('use');
        } catch(e) {
            $log.debug('Locales to use were not defined: using default ones.');
        }

        var locales;
        try {
            locales = $injector.get(selectedLocale);
            $provide.constant('locale', locales);
            $log.debug('Locales loaded from: ' + selectedLocale);
        } catch(e) {
            $log.error('Locales to use could not be loaded from constant:' + selectedLocale + '.');
        }
    }]);
angular.module('ptAnywhere.locale')
    // Constant instead of value because it will be used in config.
    .constant('locale_en', {
        loading: 'Loading...',
        loadingInfo: 'Loading info...',
        name: 'Name',
        manipulationMenu: {
            edit: 'Edit',
            del: 'Delete selected',
            back: 'Back',
            addNode: 'Add Device',
            addEdge: 'Connect Devices',
            editNode: 'Edit Device',
            addDescription: 'Click in an empty space to place a new device.',
            edgeDescription: 'Click on a node and drag the edge to another element to connect them.',
            // BEGIN: Unused
            editEdge: 'Edit Edge',
            editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
            createEdgeError: 'Cannot link edges to a cluster.',
            deleteClusterError: 'Clusters cannot be deleted.',
            editClusterError: 'Clusters cannot be edited.'
            // END: Unused
        },
        session: {
            creating: {
                title: 'Creating new session...'
            },
            notFound: {
                title: 'Topology not found',
                content: '<p>The topology could not be loaded probably because the session does not exist (e.g., if it has expired).</p>' +
                         '<p><a href="#/">Click here</a> to initiate a new one.</p>'
            },
            unavailable: {
                title: 'Unavailable PT instances',
                content: '<p>Sorry, there are <b>no Packet Tracer instances available</b> right now to initiate a session.</p>' +
                         '<p>Please, wait a little bit and <a href="#/">try again</a>.</p>'
            },
            genericError: {
                title: 'Error creating PT instance',
                content: '<p>Sorry, there was an error initiating the session.</p>' +
                         '<p>Please, wait a little bit and <a href="#/">try again</a>.</p>'
            }
        },
        network: {
            loading: 'Loading network...',
            attempt: 'Attempt',
            errorUnavailable: 'Instance not yet available',
            errorTimeout: 'Timeout',
            errorUnknown: 'Unknown error',
            notLoaded: {
                title: 'Topology not found',
                content: '<p>The topology could not be loaded probably because the session does not exist (e.g., if it has expired).</p>' +
                         '<p><a href="?session">Click here</a> to initiate a new one.</p>'
            }
        },
        deleteDevice: {
            status: 'Deleting device...',
            error: 'The device could not be deleted.'
        },
        deleteLink: {
            status: 'Deleting link...',
            error: 'The link could not be deleted.'
        },
        creationMenu: {
            legend: 'To create a new device, drag it to the network map'
        },
        creationDialog: {
            title: 'Create new device',
            type: 'Device type'
        },
        linkDialog: {
            title: 'Connect two devices',
            select: 'Please select which ports to connect...',
            error: {
                loading: 'Problem loading the interfaces for this device. Please, try it again.',
                unavailability: 'One of the devices you are trying to link has no available interfaces.',
                creation: 'Sorry, something went wrong during the link creation.'
            }
        },
        modificationDialog: {
            title: 'Modify device',
            globalSettings: 'Global Settings',
            interfaces: 'Interfaces',
            defaultGW: 'Default gateway',
            ipAddress: 'IP address',
            subnetMask: 'Subnet mask',
            noSettings: 'No settings can be specified for this type of interface.'
        },
        commandLineDialog: {
            title: 'Command line'
        }
    });

angular.module('ptAnywhere.widget', ['ngRoute', 'ui.bootstrap', 'luegg.directives', // For CMD dialog
                                     'ptAnywhere.locale', 'ptAnywhere.widget.configuration', 'ptAnywhere.api.http',
                                     'ptAnywhere.widget.console', 'ptAnywhere.widget.create', 'ptAnywhere.widget.link',
                                     'ptAnywhere.widget.map', 'ptAnywhere.widget.update', 'ptAnywhere.templates'])
    .constant('redirectionPath', '/not-found')
    .config(['$routeProvider', 'redirectionPath', 'locale',  function($routeProvider, redirectionPath, locale) {
        function createSimpleTemplate(message) {
            return '<div class="row message"><div class="col-md-8 col-md-offset-2 text-center">' +
                   '<h1>' + message.title + '</h1>' + (('content' in message)? message.content: '') + '</div></div>';
        }
        $routeProvider.when('/', {
            template: createSimpleTemplate(locale.session.creating),
            controller: 'SessionCreatorController'
        }).when('/session-unavailable', {
            template: createSimpleTemplate(locale.session.unavailable)
        }).when('/session-error', {
            template: createSimpleTemplate(locale.session.genericError)
        }).when(redirectionPath, {
            template: createSimpleTemplate(locale.session.notFound)
        }).when('/loading/:id', {
            templateUrl: 'loading.html'
        }).when('/s/:id', {
            templateUrl: 'main-widget.html'
        }).otherwise('/');
    }])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('HttpErrorInterceptor');
    }])
    .run(['HttpErrorInterceptor', 'redirectionPath', function(interceptor, redirectionPath) {
        interceptor.setRedirectionPath(redirectionPath);
    }]);
angular.module('ptAnywhere.widget')
    .controller('SessionCreatorController', ['$location', 'HttpApiService', 'fileToOpen',
                                              function($location, api, fileToOpen) {
        api.createSession(fileToOpen, null)
            .then(function(sessionId) {
                $location.path('/loading/' + sessionId);
            }, function(response) {
                if (response.status === 503) {
                    $location.path('/session-unavailable');
                } else {
                    $location.path('/session-error');
                }
            });
    }]);
angular.module('ptAnywhere.widget')
    .controller('SessionLoadingController', ['$location', '$routeParams', 'HttpApiService', 'NetworkMapData',
                                             'imagesUrl', 'locale',
                                             function($location, $routeParams, api, mapData, imagesUrl, loc) {
        var self = this;
        self.path = imagesUrl;
        self.loading = loc.network.loading;
        self.message = '';

        api.startSession($routeParams.id);
        api.getNetwork(function(errorExplanation) {
                self.message = errorExplanation;
            })
            .then(function(network) {
                mapData.load(network);
                $location.path('/s/' + $routeParams.id);
            }, function(response) {
                $location.path('/not-found');
            });
    }]);
angular.module('ptAnywhere.widget')
    .controller('WidgetController', ['$q', '$log', '$location', '$routeParams', '$uibModal',
                                     'NetworkMapData', 'HttpApiService',
                                     function($q, $log, $location, $routeParams, $uibModal, mapData, api) {
        var self = this;
        var modalInstance;

        if (!mapData.isLoaded()) {
            $location.path('/loading/' + $routeParams.id);
        } else {
            self.openConsole = function(consoleEndpoint) {
                var endpoint = consoleEndpoint;
                modalInstance = $uibModal.open({
                    templateUrl: 'cmd-dialog.html',
                    controller: //'CommandLineController'
                                ['$location', '$scope', '$uibModalInstance', 'locale', 'redirectionPath', 'wsUrl',
                                    function($location, $scope, $uibModalInstance, locale, redirectionPath, wsUrl) {
                                        var self = this;
                                        self.title = locale.commandLineDialog.title;
                                        $scope.close = function () {
                                            $uibModalInstance.dismiss('close button');
                                        };
                                        // To be used in child controller:
                                        $scope.onDisconnect = function(event) {
                                            // Code 1000: Connection intentionally closed. E.g., when the user closes the modal on purpose.
                                            if (event.code !== 1000) {
                                                $location.path(redirectionPath);
                                                $uibModalInstance.dismiss('websocket closed');
                                            }
                                        };
                                        $scope.endpoint = wsUrl;
                                    }],
                    controllerAs: 'modal',
                    resolve: {
                        wsUrl: function () {
                            return endpoint;
                        }
                    },
                    windowClass: 'terminal-dialog'
                });
            };
            self.onAddDevice = function(x, y) {
                modalInstance = $uibModal.open({
                    templateUrl: 'default-dialog.html',
                    controller: 'CreationController',
                    resolve: {
                        position: function () {
                            return [x, y];
                        }
                    }
                });

                modalInstance.result.then(function(device) {
                    mapData.addNode(device);
                });
            };
            self.onAddLink = function(fromDevice, toDevice) {
                modalInstance = $uibModal.open({
                    templateUrl: 'default-dialog.html',
                    controller: 'LinkController',
                    //size: 'lg',
                    resolve: {
                        fromDevice: function () {
                            return fromDevice;
                        },
                        toDevice: function () {
                           return toDevice;
                        }
                    }
                });

                modalInstance.result.then(function(ret) {
                    mapData.connect(fromDevice, toDevice, ret.newLink.id, ret.newLink.url,
                                    ret.fromPortName, ret.toPortName);
                });
            };
            self.onEditDevice = function(device) {
                modalInstance = $uibModal.open({
                    templateUrl: 'default-dialog.html',
                    controller: 'UpdateController',
                    //size: 'lg',
                    resolve: {
                        device: function () {
                            return device;
                        }
                    }
                });

                modalInstance.result.then(function (changedDevice) {
                    if (changedDevice !== null) {  // If null, it means that the node didn't change
                        mapData.updateNode(changedDevice);
                    }
                });
            };
            self.onDeleteDevice = function(node) {
                return $q(function(resolve, reject) {
                            api.removeDevice(node)
                                .then(function() {
                                    resolve();
                                }, function(error) {
                                    $log.error('Device removal.', error);
                                    reject();
                                });
                        });
            };
            self.onDeleteLink = function(edge) {
                return $q(function(resolve, reject) {
                            api.removeLink(edge)
                                .then(function() {
                                    resolve();
                                }, function() {
                                    $log.error('Something went wrong in the link removal.');
                                    reject();
                                });
                        });
            };
            self.onDrop = function(newDevice) {
                return $q(function(resolve, reject) {
                            // Adapt coordinates from DOM to canvas
                            //  (function defined in the networkMap directive)
                            var positionInMap = self.getNetworkCoordinates(newDevice.x, newDevice.y);
                            newDevice.x = positionInMap.x;
                            newDevice.y = positionInMap.y;

                            api.addDevice(newDevice)
                                .then(function(device) {
                                    mapData.addNode(device);
                                    resolve();
                                }, function(error) {
                                    $log.error('Device creation', error);
                                    reject();
                                });
                      });
            };
        }
    }]);
//angular.module('ptAnywhere.api', ['ptAnywhere.api.http', 'ptAnywhere.api.websocket']);

angular.module('ptAnywhere.api.http', [])
    .config(['$injector', '$provide', function($injector, $provide) {
        var $log = console; // FIXME Apparently $log injection does not work in my tests.
        var constantName = 'url';
        var valueIfUndefined = '';
        try {
            $injector.get(constantName);
            //constant exists
        } catch(e) {
            $log.log('Setting default value for non existing "' + constantName + '" constant: "' + valueIfUndefined + '"');
            $provide.constant(constantName, valueIfUndefined);  // Set default value
        }
    }]);
angular.module('ptAnywhere.api.http')
    .factory('HttpApiService', ['$http', 'url', 'HttpRetryService', function($http, apiUrl, HttpRetry) {
        var sessionUrl = '';
        var httpDefaults = {timeout: 2000};
        var longResponseTime = {timeout: 5000};
        return {
            createSession: function(fileToOpen, previousSessionId) {
                var newSession = {fileUrl: fileToOpen};
                if (previousSessionId !== null) {
                    newSession.sameUserAsInSession = previousSessionId;
                }
                return $http.post(apiUrl + '/sessions', newSession, httpDefaults)
                            .then(function(response) {
                                // Although "startSession" will be called afterwards and override this:
                                sessionUrl = response.data;

                                var chunks = response.data.split('/');
                                var sessionId = chunks[chunks.length - 1];
                                return sessionId;
                            });
            },
            startSession: function(sessionId) {
                sessionUrl = apiUrl + '/sessions/' + sessionId;  // Building the URL manually :-(
            },
            getNetwork: function(errorExplainer) {
                // We want to process the same function no matter the number of attempt (/retry)
                var ifSuccess = function(response) { return response.data; };
                HttpRetry.setSuccess(ifSuccess);
                HttpRetry.setExplainer(errorExplainer);
                // This requests takes around 2 seconds...
                return $http.get(sessionUrl + '/network', longResponseTime)
                            .then(ifSuccess, HttpRetry.responseError);
            },
            addDevice: function(newDevice) {
                return $http.post(sessionUrl + '/devices', newDevice, httpDefaults)
                            .then(function(response) {
                                return response.data;
                            });
            },
            removeDevice: function(device) {
                return $http.delete(device.url, httpDefaults);
            },
            modifyDevice: function(device, deviceLabel, defaultGateway) {
                // General settings: PUT to /devices/id
                var modification = {label: deviceLabel};
                if (defaultGateway !== '') {
                    modification.defaultGateway = defaultGateway;
                }
                return $http.put(device.url, modification, httpDefaults)
                            .then(function(response) {
                                // FIXME This patch wouldn't be necessary if PTPIC library worked properly.
                                var modifiedDevice = response.data;
                                modifiedDevice.defaultGateway = defaultGateway;
                                return modifiedDevice;
                            });
            },
            modifyPort: function(portURL, ipAddress, subnetMask) {
                // Send new IP settings
                var modification = {
                  portIpAddress: ipAddress,
                  portSubnetMask: subnetMask
                };
                return $http.put(portURL, modification, httpDefaults)
                            .then(function(response) {
                                return response.data;
                            });
            },
            getAllPorts: function(device) {
                return $http.get(device.url + 'ports', httpDefaults)
                            .then(function(response) {
                                return response.data;
                            });
            },
            getAvailablePorts: function(device) {
                return $http.get(device.url + 'ports?free=true', httpDefaults)
                            .then(function(response) {
                                return response.data;
                            });
            },
            createLink: function(fromPortURL, toPortURL) {
                var modification = {
                  toPort: toPortURL
                };
                return $http.post(fromPortURL + 'link', modification, httpDefaults)
                            .then(function(response) {
                                return response.data;
                            });
            },
            removeLink: function(link) {
                return $http.get(link.url, httpDefaults)
                        .then(function(response) {
                            // Any of the two endpoints would work for us.
                            return $http.delete(response.data.endpoints[0] + 'link');
                        });
            }
        };
    }]);
angular.module('ptAnywhere.api.http')
    .factory('HttpErrorInterceptor', ['$q', '$location', function($q, $location) {
        var redirectionPath;
        return {
            setRedirectionPath: function(path) {
                redirectionPath = path;
            },
            responseError: function(response) {
                // Session does not exist or has expired if we get error 410.
                if (response.status === 410) {
                    $location.path(redirectionPath);
                }
                return $q.reject(response);
            }
        };
    }]);
angular.module('ptAnywhere.api.http')
    .factory('HttpRetryService', ['$http', '$q', '$timeout', '$location', 'locale',
                           function($http, $q, $timeout, $location, res) {
        var tryCount = 0;
        var maxRetries = 5;
        var successCall = null;
        var errorExplainer = null;

        function retry(httpConfig, waitForNextRetry) {
            return $timeout(function() {
                        return $http(httpConfig).then(successCall, checkError);
                    }, waitForNextRetry);
        }

        function getErrorExplanation(responseStatus) {
            var errorMessage;
            switch (responseStatus) {
                case 503: errorMessage = res.network.errorUnavailable;
                          break;
                case 0: errorMessage = res.network.errorTimeout;
                        break;
                default: errorMessage = res.network.errorUnknown;
            }
            return errorMessage + '. ' + res.network.attempt + ' ' + tryCount + '/' + maxRetries + '.';
        }

        function checkError(response) {
            if (response.status === 0 || response.status === 503) {
                if (tryCount < maxRetries) {
                    // If timeout, let's try it again is without waiting.
                    var delay = (response.status === 0)? 0 : 2000;
                    tryCount++;
                    errorExplainer( getErrorExplanation(response.status) );
                    return retry(response.config, delay);
                }
            }
            // E.g., session has expired and we get error 404 or 410
            return $q.reject(response);
        }

        return {
            responseError: checkError,
            setSuccess: function(success) {
                successCall = success;
            },
            setExplainer: function(explainer) {
                errorExplainer = explainer;
            }
        };
    }]);
angular.module('ptAnywhere.api.websocket', ['ngWebSocket']);
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
angular.module('ptAnywhere.widget.configuration', [])
    .config(['$injector', '$provide', function($injector, $provide) {
        // Let's make sure that the following config sections have the constants available even
        // when they have not been defined by the user.
        var defaults = {
            imagesUrl: ''
        };
        for (var constantName in defaults) {
            try {
                $injector.get(constantName);
                //constant exists
            } catch(e) {
                var valueIfUndefined = defaults[constantName];
                $log.log('Setting default value for non existing "' + constantName + '" constant: "' + valueIfUndefined + '"');
                $provide.constant(constantName, valueIfUndefined);  // Set default value
            }
        }
    }]);
// This submodule can be part of a widget or be used alone in its own webpage (to isolate console functionality).
angular.module('ptAnywhere.widget.console', ['ptAnywhere.api.websocket', 'ptAnywhere.templates']);
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
                    $scope.$apply();
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
angular.module('ptAnywhere.widget.console')
    .directive('commandline', ['$log', function($log) {

        function strEndsWith(str, suffix) {
            return str.match(suffix + '$')==suffix;
        }

        function scrollToBottom() {
            if (!strEndsWith(window.location.href, '#' + html.nBottom)) {
                document.location.replace(window.location.href + '#' + html.nBottom);
            } else {
                document.location.replace(window.location.href);
            }
            // document.location.replace('#bottom'); // Only works if base property is unset.
            // Another alternative registering "redirection" in the browser history.
            // window.location.href = '#bottom';
        }

        // Fix for Chrome and Safari where e.key is undefined
        function fix(e) {
            if (typeof e.key === 'undefined') {
                switch(e.keyCode) {
                    case 9: e.key = 'Tab'; break;
                    case 13: e.key = 'Enter'; break;
                    case 38: e.key = 'ArrowUp'; break;
                    case 40: e.key = 'ArrowDown'; break;
                    default: $log.error('The key could not be '); break;
                }
            }
        }

        return {
            restrict: 'C',
            scope: {
                disabled: '=',
                output: '=',
                input: '=',
                sendCommand: '&',
                onPrevious: '&',
                onNext: '&'
            },
            templateUrl: 'commandline.html',
            link: function($scope, $element, $attrs) {
                var inputEl = $('div.interactive input', $element);

                inputEl.keydown(function(e) {
                    fix(e);
                    if (e.key === 'Enter' || e.key === 'Tab') {  // or if (e.keyCode == 13 || e.keyCode == 9)
                        var commandPressed =  $scope.input.command;  // It does not have '\n' or '\t' at this stage
                        if (e.key === 'Tab') {
                            e.preventDefault();  // Do not tab, stay in this field.
                            commandPressed += '\t';
                        }
                        $scope.sendCommand({command: commandPressed});
                    }
                });

                inputEl.keyup(function(e) {
                    fix(e);
                    if (e.key === 'ArrowUp') {
                        $scope.$apply($scope.onPrevious);
                    } else if (e.key === 'ArrowDown') {
                        $scope.$apply($scope.onNext);
                    } else {
                        // In PT, when '?' is pressed, the command is send as it is.
                        var lastChar = $scope.input.command.slice(-1);
                        if (lastChar === '?') {  // It has '?'
                            $scope.sendCommand({command: $scope.input.command});
                        }
                    }
                });

                $scope.focusOnInput = function() {
                    inputEl.focus();
                };
            }
        };
    }]);
angular.module('ptAnywhere.widget.console')
    .factory('HistoryService', [function() {
        var commands = null;
        var currentIndex = 0;  // Iterator from 0 to length+1
        // In last position you can already access previous.

        return {
            needsToBeUpdated: function() {
                return commands === null;
            },
            markToUpdate: function() {
                commands = null;
            },
            update: function(newCommandHistory, callback) {
              commands = newCommandHistory;
              // Current is outside the array limits at the beginning
              currentIndex = commands.length;
              callback(this.getPreviousCommand());
            },
            getPreviousCommand: function() {
                if (this.needsToBeUpdated()) return null;
                // No previous (already in the first position or empty array)
                if (currentIndex === 0 || commands.length === 0) return null;
                return commands[--currentIndex];
            },
            getNextCommand: function() {
                if (this.needsToBeUpdated()) return null;
                // if currentIndex is in length-1, there is no 'next command'.
                if (currentIndex < commands.length)
                    // current can still be moved to last position if === length - 1
                    currentIndex++;
                if (currentIndex === commands.length) return null;
                return commands[currentIndex];
            },
            _moveIteratorToTheBeginning: function() { // Function for tests
                currentIndex = 0;
            }
        };
    }]);
angular.module('ptAnywhere.widget.create', ['ui.bootstrap', 'ptAnywhere.locale', 'ptAnywhere.api.http',
                                            'ptAnywhere.widget.configuration']);
angular.module('ptAnywhere.widget.create')
    .controller('CreationController', ['$log', '$scope', '$uibModalInstance', 'locale',
                                        'HttpApiService', 'position',
                                    function($log, $scope, $uibModalInstance, locale, api, position) {
        $scope.submitError = null;
        $scope.locale = locale;
        $scope.modal = {
            id: 'creationDialog',
            title: locale.creationDialog.title,
            bodyTemplate: 'creation-dialog-body.html',
            hasSubmit: true
        };
        $scope.deviceTypes = [
            {value: 'cloud', label: 'Cloud'},
            {value: 'router', label: 'Router'},
            {value: 'switch', label: 'Switch'},
            {value: 'pc', label: 'PC'}
        ];
        $scope.newDevice = {name: '', type: $scope.deviceTypes[0]};

        $scope.submit = function() {
            var newDevice = {
                group: $scope.newDevice.type.value,
                x: position[0],
                y: position[1]
            };
            if ($scope.newDevice.name !== '') {
                newDevice.label = $scope.newDevice.name;
            }
            $scope.submitError = null;
            api.addDevice(newDevice)
                .then(function(device) {
                    $uibModalInstance.close(device);
                }, function(error) {
                    var msg = (error.status===-1)? 'timeout':  error.statusText;
                    $scope.submitError = 'Device could not be created (' + msg + ').';
                    $log.error('Device creation', error);
                });
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);
angular.module('ptAnywhere.widget.create')
    .directive('draggableDevice', ['imagesUrl', function(imagesUrl) {

        function init($scope) {
            $scope.originalPosition = {
                left: $scope.draggedSelector.css('left'),
                top: $scope.draggedSelector.css('top')
            };
            $scope.draggedSelector.draggable({
                helper: 'clone',
                opacity: 0.4,
                // The following properties interfere with the position I want to capture in the 'stop' event
                /*revert: true, revertDuration: 2000,  */
                start: function(event, ui) {
                    $scope.draggedSelector.css({'opacity':'0.7'});
                },
                stop: function(event, ui) {
                    if (collisionsWith(ui.helper, $scope.dragToSelector)) {
                        var creatingIcon = initCreatingIcon(ui);
                        var newDevice = getDevice($scope.type, ui.offset);
                        $scope.onDrop({device: newDevice})
                            .finally(function() {
                                moveToStartPosition($scope);
                                creatingIcon.remove();
                            });
                    } else {
                        moveToStartPosition($scope);
                    }
                }
            });
        }

        // Source: http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
        function collisionsWith(elementToCheck, possibleCollisionArea) {
            var x1 = possibleCollisionArea.offset().left;
            var y1 = possibleCollisionArea.offset().top;
            var h1 = possibleCollisionArea.outerHeight(true);
            var w1 = possibleCollisionArea.outerWidth(true);
            var b1 = y1 + h1;
            var r1 = x1 + w1;
            var x2 = elementToCheck.offset().left;
            var y2 = elementToCheck.offset().top;
            var h2 = elementToCheck.outerHeight(true);
            var w2 = elementToCheck.outerWidth(true);
            var b2 = y2 + h2;
            var r2 = x2 + w2;

            //if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
            return !(b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2);
        }

        function moveToStartPosition($scope) {
            $scope.draggedSelector.animate({opacity:'1'}, 1000, function() {
                $scope.draggedSelector.css({ // would be great with an animation too, but it doesn't work
                    left: $scope.originalPosition.left,
                    top: $scope.originalPosition.top
                });
            });
        }

        function initCreatingIcon(ui) {
            var image = $('<img alt="Temporary image" src="' + ui.helper.attr('src') + '">');
            image.css('width', ui.helper.css('width'));
            var warning = $('<div class="text-in-image"><span>Creating...</span></div>');
            warning.prepend(image);
            $('body').append(warning);
            warning.css({position: 'absolute',
                         left: ui.offset.left,
                         top: ui.offset.top});
            return warning;
        }

        function getDevice(deviceType, elementOffset) {
            var x = elementOffset.left;
            var y = elementOffset.top;
            // We don't use the return
            return {group: deviceType, x: x, y: y };
        }

        return {
            restrict: 'C',
            scope: {
                alt: '@',
                src: '@',
                dragTo: '@',
                type: '@',
                onDrop: '&'  // callback(device);
            },
            template: '<img class="ui-draggable ui-draggable-handle" alt="{{ alt }}" ng-src="{{ path }}" />',
            link: function($scope, $element, $attrs) {
                $scope.path = imagesUrl + '/' + $scope.src;
                $scope.draggedSelector = $('img', $element);
                $scope.dragToSelector = $($scope.dragTo);
                init($scope);
            }
        };
    }]);
angular.module('ptAnywhere.widget.link', ['ui.bootstrap', 'ptAnywhere.locale', 'ptAnywhere.api.http']);
angular.module('ptAnywhere.widget.link')
    .controller('LinkController', ['$log', '$scope', '$q', '$uibModalInstance', 'locale', 'HttpApiService',
                                    'fromDevice', 'toDevice',
                                    function($log, $scope, $q, $uibModalInstance, locale, api, fromDevice, toDevice) {
        var self = this;
        $scope.fromDeviceName = fromDevice.label;
        $scope.toDeviceName = toDevice.label;
        $scope.fromInterfaces = null;
        $scope.toInterfaces = null;
        $scope.submitError = null;
        $scope.loadError = null;

        $scope.locale = locale;
        $scope.modal = {
            id: 'linkDialog',
            title: locale.linkDialog.title,
            bodyTemplate: 'link-dialog-body.html',
            hasSubmit: false
        };
        $scope.selected = {fromIface: null, toIface: null};

        self._load = function() {
            if (fromDevice!==null && toDevice!==null) {
                var arrayOfPromises = [
                    api.getAvailablePorts(fromDevice),
                    api.getAvailablePorts(toDevice)
                ];
                $q.all(arrayOfPromises)
                        .then(function(arrayOfResponses) {
                            $scope.fromInterfaces = arrayOfResponses[0];
                            $scope.toInterfaces = arrayOfResponses[1];
                            // Items selected by default:
                            if(!$scope.emptyInterfaces()) {
                                $scope.selected.fromIface = $scope.fromInterfaces[0];
                                $scope.selected.toIface = $scope.toInterfaces[0];
                                $scope.modal.hasSubmit = true;
                            }
                        }, function(response) {
                            $log.error('Interfaces to be linked could not be loaded.', response);
                            if (response.status === 410) {
                                $uibModalInstance.dismiss('cancel');
                            } else {
                                $scope.loadError = '(error code: ' + response.status + ')';
                            }
                        });
            }
        };

        $scope.isLoadingInterfaces = function() {
            return  $scope.fromInterfaces === null && $scope.toInterfaces === null;
        };

        $scope.emptyInterfaces = function() {
            return $scope.fromInterfaces.length === 0 || $scope.toInterfaces.length === 0;
        };

        $scope.availableInterfaces = function() {
            return !$scope.isLoadingInterfaces() && !$scope.emptyInterfaces();
        };

        $scope.submit = function() {
            var fromIf = $scope.selected.fromIface;
            var toIf = $scope.selected.toIface;
            $scope.submitError = null;
            api.createLink(fromIf.url, toIf.url)
                .then(function(newLink) {
                    var retLink = {
                        newLink: newLink,
                        fromPortName: fromIf.portName,
                        toPortName: toIf.portName
                    };
                    $uibModalInstance.close(retLink);
               }, function(error) {
                   $scope.submitError = 'Link could not be created (' + error.statusText + ').';
                   $log.error('Link creation', error);
               });
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        self._load();
    }]);
angular.module('ptAnywhere.widget.map',
                ['ui.bootstrap', 'ptAnywhere.locale', 'ptAnywhere.api.http', 'ptAnywhere.widget.configuration']);
angular.module('ptAnywhere.widget.map')
    .directive('networkMap', ['locale', 'NetworkMapData', 'imagesUrl', function(res, mapData, imagesUrl) {
        var network;

        function createNetworkMap($scope, networkContainer, imagesUrl, locale) {
            var visData = {
                // TODO I would prefer to pass both as attrs instead of as a service.
                // However, right now this is the most straightforward change.
                // Since for passing it as attrs I would need to be an object and I am not using vis.DataSet.
                nodes: mapData.getNodes(),
                edges: mapData.getEdges()
            };
            var options = {
                nodes: {
                    physics: false,
                    font: '14px verdana black',
                },
                edges: {
                    width: 3,
                    selectionWidth: 1.4,
                    color: {
                        color:'#606060',
                        highlight:'#000000',
                        hover: '#000000'
                    }
                 },
                groups: {
                    cloudDevice : {
                        shape : 'image',
                        image : imagesUrl + '/cloud.png',
                        size: 50
                    },
                    routerDevice : {
                        shape : 'image',
                        image : imagesUrl + '/router_cropped.png',
                        size: 45
                    },
                    switchDevice : {
                        shape : 'image',
                        image : imagesUrl + '/switch_cropped.png',
                        size: 35
                    },
                    pcDevice : {
                        shape : 'image',
                        image : imagesUrl + '/pc_cropped.png',
                        size: 45
                    }
                },
                manipulation: getManipulationOptions($scope, locale),
                locale: 'ptAnywhere',
                locales: {
                    ptAnywhere: res.manipulationMenu
                }
            };
            return new vis.Network(networkContainer, visData, options);
        }

        function getSelectedNode() {
            var selected = network.getSelection();
            if (selected.nodes.length !== 1) { // Only if just one is selected
                console.log('Only one device is supposed to be selected. Instead ' + selected.nodes.length + ' are selected.');
                return null;
            }
            return mapData.getNode(selected.nodes[0]);
        }

        function isOnlyOneEdgeSelected(event) {
            return event.nodes.length === 0 && event.edges.length === 1;
        }

        function isNodeSelected(event) {
            return event.nodes.length > 0;
        }

        function isShowingEndpoint(node) {
            return node.label.indexOf('\n') !== -1;
        }

        function showEndpointsInEdge(edge) {
            var fromNode = mapData.getNode(edge.from);
            var toNode = mapData.getNode(edge.to);
            if ( !isShowingEndpoint(fromNode) ) {
                fromNode.label = fromNode.label + '\n(' + edge.fromLabel + ')';
                mapData.updateNode(fromNode);
            }
            if ( !isShowingEndpoint(toNode) ) {
                toNode.label = toNode.label + '\n(' + edge.toLabel + ')';
                mapData.updateNode(toNode);
            }
        }

        function hideEndpointsInEdge(edge) {
            var fromNode = mapData.getNode(edge.from);
            var toNode = mapData.getNode(edge.to);
            if ( isShowingEndpoint(fromNode) ) {
                fromNode.label = fromNode.label.split('\n')[0];
                mapData.updateNode(fromNode);
            }
            if ( isShowingEndpoint(toNode) ) {
                toNode.label = toNode.label.split('\n')[0];
                mapData.updateNode(toNode);
            }
        }

        function hideEndpointsInSelectedEdges(event) {
            for (var i = 0; i < event.edges.length; i++) {
                hideEndpointsInEdge( mapData.getEdge(event.edges[i]) );
            }
        }

        /**
         * Canvas' (0,0) does not correspond with the network map's DOM (0,0) position.
         *   @arg x DOM X coordinate relative to the canvas element.
         *   @arg y DOM Y coordinate relative to the canvas element.
         *   @return Coordinates on the canvas with form {x:Number, y:Number}.
         */
        function toNetworkMapCoordinate(x, y) {
            return network.DOMtoCanvas({x: x, y: y});
        }

        /* BEGIN tweak to vis.js */
        /* (Ugly) It uses jQuery to add a status message in vis.js manipulation menu. */
        function showStatus(msg) {
            $('div.vis-manipulation').append('<div class="statusMsg vis-button vis-none"><div class="vis-label text-warning">' + msg + '</p></div>');
            $('div.statusMsg').fadeIn('slow');
        }
        function showTemporaryStatus(msg) {
            $('div.vis-manipulation').append('<div class="statusMsg vis-button vis-none"><div class="vis-label text-danger">' + msg + '</p></div>');
            $('div.statusMsg').fadeIn('slow').delay( 2000 ).fadeOut('slow');
        }
        /* END tweak to vis.js */

        function getManipulationOptions($scope, locale) {
            var emptyFunction = function(data, callback) {};
            var addNode = emptyFunction;
            var addEdge = emptyFunction;
            var editNode = emptyFunction;
            var deleteNode = emptyFunction;
            var deleteEdge = emptyFunction;

            if ('onAddDevice' in $scope) {
                addNode = function(data, callback) {
                    $scope.onAddDevice({x: data.x, y: data.y});
                };
            }
            if ('onAddLink' in $scope) {
                addEdge = function(data, callback) {
                    var fromDevice = mapData.getNode(data.from);
                    var toDevice = mapData.getNode(data.to);
                    $scope.onAddLink({fromDevice: fromDevice, toDevice: toDevice});
                };
            }
            if ('onEditDevice' in $scope) {
                editNode = function(data, callback) {
                    $scope.onEditDevice({device: mapData.getNode(data.id)});
                    callback(data);
                };
            }
            if ('onDeleteDevice' in $scope) {
                deleteNode = function(data, callback) {
                    showStatus(locale.deleteDevice.status);
                    // Always (data.nodes.length>0) && (data.edges.length==0)
                    // FIXME There might be more than a node selected...
                    $scope.onDeleteDevice({device: mapData.getNode(data.nodes[0])})
                            .then(function() {
                                // This callback is important, otherwise it received 3 consecutive onDelete events.
                                callback(data);
                            }, function() {
                                callback([]);
                                showTemporaryStatus(locale.deleteDevice.error);
                            });
                };
            }
            if ('onDeleteLink' in $scope) {
                deleteEdge = function(data, callback) {
                    showStatus(locale.deleteLink.status);
                    // Always (data.nodes.length==0) && (data.edges.length>0)
                    // TODO There might be more than an edge selected...
                    var edge = mapData.getEdge(data.edges[0]);
                    hideEndpointsInEdge(edge);
                    $scope.onDeleteLink({link: edge})
                            .then(function() {
                                // This callback is important, otherwise it received 3 consecutive onDelete events.
                                callback(data);
                            }, function() {
                                callback([]);
                                showTemporaryStatus(locale.deleteLink.error);
                            });
                };
            }

            return {
                initiallyActive: true,
                addNode: addNode,
                addEdge: addEdge,
                editNode: editNode,
                editEdge: false,
                deleteNode: deleteNode,
                deleteEdge: deleteEdge
            };
        }

        return {
            restrict: 'C',
            scope: {
                onDoubleClick: '&',  // callback(selected);
                onAddDevice: '&',  // interactionCallback(data.x, data.y);
                onAddLink: '&',  // interactionCallback(fromDevice, toDevice);
                onEditDevice: '&',  //interactionCallback( nodes.get(data.id) );
                onDeleteDevice: '&',  // interactionCallback(nodes.get(data.nodes[0]));
                onDeleteLink: '&',  // interactionCallback(edge);
                adaptCoordinates: '='  // Function defined in this directive but used by controllers.
            },
            template: '<div class="map"></div>',
            link: function($scope, $element, $attrs) {
                var container = $element.find('div')[0];
                network = createNetworkMap($scope, container, imagesUrl, res);
                $scope.$on('$destroy', function() {
                    network.destroy();
                });

                $scope.adaptCoordinates = toNetworkMapCoordinate;

                network.on('select', function(event) {
                    if ( isOnlyOneEdgeSelected(event) ) {
                        var edge = mapData.getEdge(event.edges[0]);
                        showEndpointsInEdge(edge);
                    } else if ( isNodeSelected(event) ) {
                        hideEndpointsInSelectedEdges(event);
                    }
                });
                network.on('deselectEdge', function(event) {
                    if ( isOnlyOneEdgeSelected(event.previousSelection) ) {
                        hideEndpointsInSelectedEdges(event.previousSelection);
                    }
                });
                if ('onDoubleClick' in $scope) {
                    network.on('doubleClick', function() {
                        var selected = getSelectedNode();
                        if (selected !== null) {
                            $scope.onDoubleClick({endpoint: selected.consoleEndpoint});
                        }
                    });
                }
            }
        };
    }]);
angular.module('ptAnywhere.widget.map')
    .factory('NetworkMapData', [function() {
        var loaded = false;
        var nodes = new vis.DataSet();
        var edges = new vis.DataSet();

        return {
            load: function(initialData) {
                loaded = true;
                if (initialData.devices !== null) {
                    nodes.clear();
                    nodes.add(initialData.devices);
                }
                if (initialData.edges !== null) {
                    edges.clear();
                    edges.add(initialData.edges);
                }
            },
            isLoaded: function() {
                return loaded;
            },
            getNode: function(nodeId) {
                return nodes.get(nodeId);
            },
            updateNode: function(node) {
                nodes.update(node);
            },
            addNode: function(node) {
                return nodes.add(node);
            },
            getNodes: function() {
                return nodes;
            },
            getEdge: function(edgeId) {
                return edges.get(edgeId);
            },
            getEdges: function() {
                return edges;
            },
            connect: function(fromDevice, toDevice, linkId, linkUrl, fromPortName, toPortName) {
                // FIXME unify the way to connect devices
                var newEdge;
                if (typeof fromDevice === 'string'  && typeof toDevice === 'string') {
                    // Alternative used mainly in the replayer
                    newEdge = { from: getByName(fromDevice).id, to: getByName(toDevice).id };
                } else {
                    // Alternative used in interactive widgets
                    newEdge = { from: fromDevice.id, to: toDevice.id };
                }
                if (linkId !== undefined) {
                    newEdge.id = linkId;
                }
                if (linkUrl !== undefined) {
                    newEdge.url = linkUrl;
                }
                if (fromPortName !== undefined) {
                    newEdge.fromLabel = fromPortName;
                }
                if (toPortName !== undefined) {
                    newEdge.toLabel = toPortName;
                }
                edges.add(newEdge);
            }
        };
    }]);
angular.module('ptAnywhere.widget.update', ['ui.bootstrap', 'ptAnywhere.locale', 'ptAnywhere.api.http']);
angular.module('ptAnywhere.widget')
    .directive('inputIpAddress', [function() {

        return {
            restrict: 'C',
            transclude: true,
            scope: {
                id: '@',
                name: '@',
                formController: '=',
                value: '=ngModel'

            },
            templateUrl: 'input-ipaddress.html',
            link: function($scope, $element, $attrs) {
                $scope.ipAddrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            }
        };
    }]);
angular.module('ptAnywhere.widget.update')
    .controller('UpdateController', ['$log', '$scope', '$q', '$uibModalInstance', 'locale', 'HttpApiService', 'device',
                                     // Device is injected in $uiModal's resolve.
                                    function($log, $scope, $q, $uibModalInstance, locale, api, deviceToEdit) {
        var self = this;
        $scope.submitError = null;
        $scope.interfaces = null;
        $scope.interface = {
            selected: null,
            ipAddr: null,
            subnet: null
        };

        $scope.locale = locale;
        $scope.modal = {
            id: 'modification-dialog',
            title: locale.modificationDialog.title,
            bodyTemplate: 'update-dialog-body.html',
            hasSubmit: true
        };
        $scope.device = {
            name: deviceToEdit.label,
            defaultGateway: ('defaultGateway' in deviceToEdit)? deviceToEdit.defaultGateway: null
        };

        $scope.$watch('interfaces', function(newValue, oldValue) {
            if (newValue !== null) {
                $scope.interface.selected = newValue[0];
            }
        });

        $scope.$watch('interface.selected', function(newValue, oldValue) {
            if (newValue && ('portIpAddress' in newValue) && ('portSubnetMask' in newValue)) {
                $scope.interface.ipAddr = newValue.portIpAddress;
                $scope.interface.subnet = newValue.portSubnetMask;
            } else {
                // Not all the might have ip address and subnet.
                $scope.interface.ipAddr = null;
                $scope.interface.subnet = null;
            }
        });

        self._load = function() {
            api.getAllPorts(deviceToEdit)
                .then(function(ports) {
                    $scope.interfaces = ports;
                }, function(response) {
                    $log.error('Ports for the device ' + deviceToEdit.id + ' could not be loaded.', response);
                    $uibModalInstance.dismiss('cancel');
                });
        };

        self._haveGlobalSettingsChanged = function() {
            // TODO use $pristine instead
            return ($scope.device.name != deviceToEdit.label) ||
                   (('defaultGateway' in deviceToEdit) &&
                    ($scope.device.defaultGateway != deviceToEdit.defaultGateway));
        };

        self._hasInterfaceChanged = function() {
            // TODO use $pristine instead
            return ($scope.interface.ipAddr !== null && $scope.interface.subnet !== null) &&
                   ($scope.interface.ipAddr != $scope.interface.selected.portIpAddress ||
                    $scope.interface.subnet != $scope.interface.selected.portSubnetMask);
        };

        $scope.submit = function() {
            var update;
            if (self._haveGlobalSettingsChanged()) {
                update = api.modifyDevice(deviceToEdit, $scope.device.name, $scope.device.defaultGateway)
                            .then(function(modifiedDevice) {
                                return modifiedDevice;
                            }, function(error) {
                                $scope.submitError = 'Global settings could not be modified.';
                                return error;
                            });
            } else {
                update = $q.resolve(null);  // No modification return.
            }
            // Sequential order as API cannot cope with simultaneous changes when device name is modified.
            if (self._hasInterfaceChanged()) {
                update = update.then(function(modifiedDevice) {
                                        return api.modifyPort($scope.interface.selected.url,
                                                              $scope.interface.ipAddr, $scope.interface.subnet)
                                                  .then(function(port) {
                                                      return modifiedDevice;
                                                  }, function(error) {
                                                      $scope.submitError = 'Interface details could not be modified.';
                                                      return error;
                                                  });
                                    });
            }
            update.then(function(modifiedDevice) {
                $uibModalInstance.close(modifiedDevice);
            }, function(error) {
                $log.error('Update(s) could not be performed.', error);
            });
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        self._load();
    }]);
angular.module('ptAnywhere.templates').run(['$templateCache', function($templateCache) {$templateCache.put('cmd-dialog.html','<div class="modal-header">\n    <button type="button" class="close" ng-click="close()"><span aria-hidden="true">&times;</span></button>\n    <h4 class="modal-title" id="cmdModal">\n        <span class="glyphicon glyphicon-console" style="margin-right:10px" aria-hidden="true"></span>\n        {{ modal.title }}\n    </h4>\n</div>\n<div class="modal-body">\n    <div scroll-glue>\n        <!-- Uses variables form parent controller: endpoint and onDisconnect-->\n        <div ng-controller="CommandLineController as cmd">\n            <div class="commandline" disabled="cmd.disabled" output="cmd.output" input="cmd.lastLine"\n                    send-command="cmd.send(command)" on-previous="cmd.onPreviousCommand()" on-next="cmd.onNextCommand()">\n            </div>\n        </div>\n    </div>\n</div>');
$templateCache.put('commandline.html','<div class="messages">\n    <div ng-repeat="line in output track by $index">\n        <div class="line" ng-show="line" ng-bind="line"></div>\n        <div ng-show="!line">&nbsp;</div>\n    </div>\n</div>\n<div class="interactive input-group" ng-show="input.prompt">\n    <span class="input-group-addon prompt" ng-bind="input.prompt" ng-click="focusOnInput()"></span>\n    <input type="text" class="form-control" ng-model="input.command" ng-disabled="disabled"\n           autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off">\n</div>');
$templateCache.put('creation-dialog-body.html','<fieldset>\n    <div class="clearfix form-group">\n        <label for="{{ modal.id }}Name" class="control-label">{{ locale.name }}</label>\n        <input type="text" id="{{ modal.id }}Name" class="form-control input-lg" ng-model="newDevice.name" />\n    </div>\n    <div class="clearfix form-group">\n        <label for="{{ modal.id }}Type" class="control-label">{{ locale.creationDialog.type }}</label>\n        <p ng-if="deviceTypes === null">{{ locale.loading }}</p>\n        <div ng-if="deviceTypes !== null">\n            <select id="{{ modal.id }}Type" class="form-control input-lg"\n                    ng-model="newDevice.type" ng-options="type.label for type in deviceTypes">\n            </select>\n        </div>\n    </div>\n</fieldset>');
$templateCache.put('default-dialog.html','<form name="dialogForm">\n    <div class="modal-header">\n        <button type="button" class="close" ng-click="close()"><span aria-hidden="true">&times;</span></button>\n        <h4 class="modal-title" id="{{ modal.id }}Label">{{ modal.title }}</h4>\n    </div>\n    <div class="modal-body">\n        <div ng-include="modal.bodyTemplate"></div>\n        <p ng-if="submitError !== null" class="clearfix bg-danger">{{ submitError }}</p>\n    </div>\n    <div class="modal-footer">\n        <button ng-click="close()" type="button" class="btn btn-default btn-lg" data-dismiss="modal">Close</button>\n        <button ng-show="modal.hasSubmit" ng-disabled="dialogForm.$invalid" ng-click="submit()" type="button" class="btn btn-primary btn-lg">Submit</button>\n    </div>\n</form>');
$templateCache.put('input-ipaddress.html','<div class="clearfix form-group has-feedback" ng-class="{\'has-error\': formController.$invalid}">\n    <label for="{{ id }}" class="control-label"><span ng-transclude></span></label>\n    <input type="text" ng-pattern="ipAddrPattern" ng-model="value"\n           name="{{ name }}" id="{{ id }}" class="form-control input-lg" aria-describedby="{{ id }}-error" >\n    <span class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true" ng-show="formController.$invalid"></span>\n    <span id="{{ id }}-error" class="sr-only">(error)</span>\n</div>');
$templateCache.put('link-dialog-body.html','<div ng-show="isLoadingInterfaces() && loadError === null">{{ locale.loadingInfo }}</div>\n<div ng-show="!isLoadingInterfaces()">\n    <div ng-show="availableInterfaces()">\n        <p>{{ locale.linkDialog.select }}</p>\n        <div class="clearfix form-group">\n            <label for="{{modal.id}}FromIface" class="col-md-3 fromDeviceName">{{ fromDeviceName }}</label>\n            <div class="col-md-9" ng-if="fromInterfaces !== null">\n                <select id="{{modal.id}}FromIface" class="form-control input-lg" size="1"\n                        ng-model="selected.fromIface" ng-options="iface.portName for iface in fromInterfaces">\n                </select>\n            </div>\n        </div>\n        <div class="clearfix form-group">\n            <label for="{{modal.id}}ToIface" class="col-md-3 toDeviceName">{{ toDeviceName }}</label>\n            <div class="col-md-9" ng-if="toInterfaces !== null">\n                <select id="{{modal.id}}ToIface" class="form-control input-lg" size="1"\n                        ng-model="selected.toIface" ng-options="iface.portName for iface in toInterfaces">\n                </select>\n            </div>\n        </div>\n    </div>\n    <div ng-show="!availableInterfaces()">\n        <p>{{ locale.linkDialog.error.unavailability }}</p>\n    </div>\n</div>\n<div ng-show="loadError !== null">\n    <p>{{ locale.linkDialog.error.loading }}</p>\n    <p>{{ loadError }}</p>\n</div>');
$templateCache.put('loading.html','<div class="loading" ng-controller="SessionLoadingController as loading">\n    <img class="loading-icon" ng-src="{{ loading.path }}/loading.gif" alt="Loading network topology..." />\n    <p>{{ loading.loading }}</p>\n    <p>{{ loading.message }}</p>\n</div>');
$templateCache.put('main-widget.html','<div ng-controller="WidgetController as widget">\n    <div class="network networkMap"\n         on-double-click="widget.openConsole(endpoint)"\n         on-add-device="widget.onAddDevice(x, y)"\n         on-add-link="widget.onAddLink(fromDevice, toDevice)"\n         on-edit-device="widget.onEditDevice(device)"\n         on-delete-device="widget.onDeleteDevice(device)"\n         on-delete-link="widget.onDeleteLink(link)"\n         adapt-coordinates="widget.getNetworkCoordinates"\n    ></div>\n    <div class="creation-menu">\n        <fieldset>\n            <div class="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">\n                <div class="row">\n                    <figure class="col-md-3 col-sm-3 col-xs-3 text-center">\n                        <div class="draggableDevice" alt="cloud" src="cloud.png"\n                             drag-to=".map" type="cloud" on-drop="widget.onDrop(device)"></div>\n                        <figcaption>Cloud</figcaption>\n                    </figure>\n                    <figure class="col-md-3 col-sm-3 col-xs-3 text-center">\n                        <div class="draggableDevice" alt="router" src="router.png"\n                             drag-to=".map" type="router" on-drop="widget.onDrop(device)"></div>\n                        <figcaption>Router</figcaption>\n                    </figure>\n                    <figure class="col-md-3 col-sm-3 col-xs-3 text-center">\n                        <div class="draggableDevice" alt="switch" src="switch.png"\n                             drag-to=".map" type="switch" on-drop="widget.onDrop(device)"></div>\n                        <figcaption>Switch</figcaption>\n                    </figure>\n                    <figure class="col-md-3 col-sm-3 col-xs-3 text-center">\n                        <div class="draggableDevice" alt="pc" src="pc.png"\n                             drag-to=".map" type="pc" on-drop="widget.onDrop(device)"></div>\n                        <figcaption>Pc</figcaption>\n                    </figure>\n                </div>\n            </div>\n        </fieldset>\n    </div>\n</div>');
$templateCache.put('update-dialog-body.html','<uib-tabset justified="true">\n    <uib-tab>\n        <uib-tab-heading>{{ locale.modificationDialog.globalSettings }}</uib-tab-heading>\n        <div class="clearfix form-group">\n            <label for="{{ modal.id }}-name">{{ locale.name }}</label>\n            <input type="text" ng-model="device.name" id="{{ modal.id }}-name" class="form-control input-lg" />\n        </div>\n        <div class="inputIpAddress" ng-show="device.defaultGateway !== null"\n             id="{{ modal.id }}-default-gw" name="defaultgw"\n             ng-model="device.defaultGateway" form-controller="dialogForm.defaultgw">\n            {{ locale.modificationDialog.defaultGW }}\n        </div>\n    </uib-tab>\n    <uib-tab>\n        <uib-tab-heading>{{ locale.modificationDialog.interfaces }}</uib-tab-heading>\n        <div ng-show="interfaces === null">{{ locale.loadingInfo }}</div>\n        <div ng-show="interfaces !== null">\n            <div class="clearfix form-group">\n                <label for="{{ modal.id }}-ifaces" class="control-label">{{ locale.name }}</label>\n                <select id="{{ modal.id }}-ifaces" class="form-control input-lg" size="1"\n                        ng-model="interface.selected" ng-options="iface.portName for iface in interfaces">\n                </select>\n            </div>\n            <hr />\n            <div class="clearfix form-group" ng-show="interface.ipAddr !== null">\n                <div class="inputIpAddress" id="{{ modal.id }}-ipaddr" name="ipaddr"\n                     ng-model="interface.ipAddr" form-controller="dialogForm.ipaddr">\n                    {{ locale.modificationDialog.ipAddress }}\n                </div>\n                <div class="inputIpAddress" id="{{ modal.id }}-subnet" name="subnet"\n                     ng-model="interface.subnet" form-controller="dialogForm.subnet">\n                    {{ locale.modificationDialog.subnetMask }}\n                </div>\n            </div>\n            <div class="clearfix form-group" ng-show="interface.ipAddr === null">\n                <p class="col-md-12">{{ locale.modificationDialog.noSettings }}</p>\n            </div>\n        </div>\n    </uib-tab>\n</uib-tabset>\n');}]);