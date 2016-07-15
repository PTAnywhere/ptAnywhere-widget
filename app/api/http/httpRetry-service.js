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