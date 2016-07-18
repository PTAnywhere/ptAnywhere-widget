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