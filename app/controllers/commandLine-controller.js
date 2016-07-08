angular.module('ptAnywhere')
    .controller('CommandLineController', ['$scope', '$uibModalInstance', 'locale', 'endpoint',
                                          function($scope, $uibModalInstance, locale, endpoint) {
        $scope.title = locale.commandLineDialog.title;
        $scope.endpoint = endpoint;
        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);