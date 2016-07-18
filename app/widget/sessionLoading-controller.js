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