angular.module('ptAnywhere.widget.create')
    .controller('CreationController', ['$log', '$scope', '$uibModalInstance', 'locale',
                                        'HttpApiService', 'position',
                                    function($log, $scope, $uibModalInstance, locale, api, position) {
        $scope.submitError = null;
        $scope.locale = locale;
        $scope.modal = {
            id: 'creationDialog',
            title: locale.creationDialog.title,
            bodyTemplate: 'creation-dialog-body.html',
            hasSubmit: true
        };
        $scope.deviceTypes = [
            {value: 'cloud', label: 'Cloud'},
            {value: 'router', label: 'Router'},
            {value: 'switch', label: 'Switch'},
            {value: 'pc', label: 'PC'}
        ];
        // TODO with a better understanding on inherited scopes, I could try to create to separate variables.
        $scope.newDevice = {name: '', type: $scope.deviceTypes[0]};

        $scope.submit = function() {
            var newDevice = {
                group: $scope.newDevice.type.value,
                x: position[0],
                y: position[1]
            };
            if ($scope.newDevice.name !== '') {
                newDevice.label = $scope.newDevice.name;
            }
            $scope.submitError = null;
            api.addDevice(newDevice)
                .then(function(device) {
                    $uibModalInstance.close(device);
                }, function(error) {
                    var msg = (error.status===-1)? 'timeout':  error.statusText;
                    $scope.submitError = 'Device could not be created (' + msg + ').';
                    $log.error('Device creation', error);
                });
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);