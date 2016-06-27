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
            getNetwork: function() {
                HttpRetry.setSuccess(function(response) {
                    return response.data;
                });
                return $http.get(sessionUrl + '/network', {timeout: 2000})
                            .then(HttpRetry.ifSuccess, HttpRetry.responseError);
            }
        };
    }])
    .factory('HttpRetry', ['$injector', '$q', '$timeout', '$location',
                           function($injector, $q, $timeout, $location) {
        var tryCount = 0;
        var maxRetries = 5;
        var successCall = null;

        function retry(httpConfig, waitForNextRetry) {
            return $timeout(function() {
                        var $http = $injector.get('$http');
                        // We want to process the same in any successful attempt
                        return $http(httpConfig).then(successCall, checkError);
                    }, waitForNextRetry);
        }

        function checkError(response) {
            // TODO 404 or 410: sessionExpirationCallback (redirect to not_found)
            if (response.status === 404 || response.status === 410) {
                $location.path('/not-found');
            }
            else if (response.status === 0 || response.status === 503) {
                if (tryCount < maxRetries) {
                    var delay = 2000;
                    if (response.status === 0) {  // ERROR_TIMEOUT
                        console.error('The topology could not be loaded: timeout.');
                        delay = 0;
                    }  // Else mark as ERROR_UNAVAILABLE
                    tryCount++;
                    return retry(response.config, delay);
                }
            }
            // E.g., session has expired and we get error 404 or 410
            return $q.reject(response);
        }
        // TODO addListener: function listener for error message:  // or make it watchable by controller

        return {
            responseError: checkError,
            setSuccess: function(success) {
                successCall = success;
            },
            ifSuccess: successCall
        };

        /*
        function(tryCount, maxRetries, errorType) {
            var errorMessage;
            switch (errorType) {
                case ptAnywhere.http.UNAVAILABLE:
                            errorMessage = res.network.errorUnavailable;
                            break;
                case ptAnywhere.http.TIMEOUT:
                            errorMessage = res.network.errorTimeout;
                            break;
                default: errorMessage = res.network.errorUnknown;
            }
            main.map.error(errorMessage + '. ' + res.network.attempt + ' ' + tryCount + '/' + maxRetries + '.');
        }
        */
    }])
    .factory('HttpErrorsInterceptor', ['$injector', '$q', '$timeout', '$location',
                                         function($injector, $q, $timeout, $location) {
        var tryCount = 0;
        var maxRetries = 5;

        function retry(httpConfig, waitForNextRetry) {
            return $timeout(function() {
                        var $http = $injector.get('$http');
                        return $http(httpConfig);
                    }, waitForNextRetry);
        }

        return {
            responseError: function(response) {
                // TODO 404 or 410: sessionExpirationCallback (redirect to not_found)
                if (response.status === 404 || response.status === 410) {
                    $location.path('/not-found');
                }
                else if (response.status === 0 || response.status === 503) {
                    var delay = 500;
                    if (response.status === 0) {  // ERROR_TIMEOUT
                        console.error('The topology could not be loaded: timeout.');
                        delay = 0;
                    }  // Else mark as ERROR_UNAVAILABLE
                    tryCount++;
                    return retry(response.config, delay);
                }
                // E.g., session has expired and we get error 404 or 410
                return $q.reject(response);
            }
            // TODO addListener: function listener for error message:  // or make it watchable by controller
        };

        /*
        function(tryCount, maxRetries, errorType) {
            var errorMessage;
            switch (errorType) {
                case ptAnywhere.http.UNAVAILABLE:
                            errorMessage = res.network.errorUnavailable;
                            break;
                case ptAnywhere.http.TIMEOUT:
                            errorMessage = res.network.errorTimeout;
                            break;
                default: errorMessage = res.network.errorUnknown;
            }
            main.map.error(errorMessage + '. ' + res.network.attempt + ' ' + tryCount + '/' + maxRetries + '.');
        }
        */
    }]);