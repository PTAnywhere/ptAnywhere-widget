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
                // We want to process the same function no matter the number of attempt (/retry)
                var ifSuccess = function(response) { return response.data; };
                HttpRetry.setSuccess(ifSuccess);
                return $http.get(sessionUrl + '/network', {timeout: 2000})
                            .then(ifSuccess, HttpRetry.responseError);
            }
        };
    }])
    .factory('HttpRetry', ['$http', '$q', '$timeout', '$location',
                           function($http, $q, $timeout, $location) {
        var tryCount = 0;
        var maxRetries = 5;
        var successCall = null;

        function retry(httpConfig, waitForNextRetry) {
            return $timeout(function() {
                        return $http(httpConfig).then(successCall, checkError);
                    }, waitForNextRetry);
        }

        function checkError(response) {
            if (response.status === 0 || response.status === 503) {
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
            }
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