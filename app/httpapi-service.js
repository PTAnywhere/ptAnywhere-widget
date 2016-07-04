angular.module('ptAnywhere')
    .factory('PTAnywhereAPIService', ['$http', 'apiUrl', 'HttpRetry',
                                        function($http, apiUrl, HttpRetry) {
        var sessionUrl = '';
        return {
            createSession: function(fileToOpen, previousSessionId) {
                var newSession = {fileUrl: fileToOpen};
                if (previousSessionId !== null) {
                    newSession.sameUserAsInSession = previousSessionId;
                }
                return $http.post(apiUrl + '/sessions', newSession, {timeout: 10000})
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
                return $http.get(sessionUrl + '/network', {timeout: 2000})
                            .then(ifSuccess, HttpRetry.responseError);
            },
            getAvailablePorts: function(device) {
                return $http.get(device.url + 'ports?free=true')
                            .then(function(response) {
                                return response.data;
                            });
            },
            removeDevice: function(device) {
                return $http.delete(device.url);
            },
            createLink: function(fromPortURL, toPortURL) {
                var modification = {
                  toPort: toPortURL
                };
                return $http.post(fromPortURL + 'link', modification)
                            .then(function(response) {
                                return response.data;
                            });
            },
            removeLink: function(link) {
                // FIXME issue #4.
                return $http.get(link.url)
                        .then(function(response) {
                            // Any of the two endpoints would work for us.
                            return $http.delete(response.data.endpoints[0] + 'link');
                        });
            }
        };
    }])
    .factory('HttpRetry', ['$http', '$q', '$timeout', '$location', 'locale_en',
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
    }])
    .factory('HttpErrorsInterceptor', ['$q', '$location', function($q, $location) {
        return {
            responseError: function(response) {
                // TODO 404 or 410: sessionExpirationCallback (redirect to not_found)
                if (response.status === 404 || response.status === 410) {
                    $location.path('/not-found');
                }
                // E.g., session has expired and we get error 404 or 410
                return $q.reject(response);
            }
        };
    }]);