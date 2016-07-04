angular.module('ptAnywhere')
    .controller('CreationController', ['$scope', 'PTAnywhereAPIService', 'NetworkMapData',
                                    function($scope, api, mapData) {
        var self = this;
        self.allowedTypes = [
            {value: 'cloud', label: 'Cloud'},
            {value: 'router', label: 'Router'},
            {value: 'switch', label: 'Switch'},
            {value: 'pc', label: 'PC'}
        ];

        self.submit = function() {
            var newDevice = {
                label: self.device.name,
                group: self.device.type.value,
                x: self.device.x,
                y: self.device.y
            };
            self.submitError = null;
            api.addDevice(newDevice)
                .then(function(device) {
                    mapData.addNode(device);
                    self.close();
                }, function(error) {
                    var msg = (error.status===-1)? 'timeout':  error.statusText;
                    self.submitError = 'Device could not be created (' + msg + ').';
                    console.error('Device creation', error);
                });
        };

        if(!$scope.$$phase) {
            $scope.$apply();
        }
    }]);