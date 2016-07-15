angular.module('ptAnywhere.api.http')
    .factory('HttpErrorsInterceptor', ['$q', '$location', function($q, $location) {
        return {
            responseError: function(response) {
                // Session does not exist or has expired if we get error 410.
                if (response.status === 410) {
                    $location.path('/not-found');  // TODO uncouple
                }
                return $q.reject(response);
            }
        };
    }]);