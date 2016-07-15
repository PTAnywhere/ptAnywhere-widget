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