angular.module('ptAnywhere.widget')
    .directive('inputIpAddress', [function() {

        return {
            restrict: 'C',
            transclude: true,
            scope: {
                id: '@',
                name: '@',
                formController: '=',
                value: '=ngModel'

            },
            templateUrl: 'input-ipaddress.html',
            link: function($scope, $element, $attrs) {
                $scope.ipAddrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            }
        };
    }]);