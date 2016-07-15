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