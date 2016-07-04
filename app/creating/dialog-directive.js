angular.module('ptAnywhere')
    .directive('creationDialog', ['locale_en', 'baseUrl', function(res, baseUrl) {

        function initDefaults($scope) {
            $scope.locale = res;
            $scope.modal = {
                id: 'creationDialog',
                title: res.creationDialog.title,
                bodyTemplate: baseUrl + '/html/creation-dialog-body.html',
                hasSubmit: true
            };
            $scope.submitError = null;
            // TODO with a better understanding on inherited scopes, I could try to create to separate variables.
            $scope.newDevice = {name: '', type: null, x: 0, y: 0};
        }

        return {
            templateUrl: baseUrl + '/html/default-dialog.html',
            restrict: 'C',
            scope: {
                open: '=',  // initialized here
                close: '=',  // initialized here
                backdrop: '@',
                deviceTypes: '=',  // set in the controller (avoid overriding in defaults)
                newDevice: '=',  // set here
                onSubmit: '&',
                submitError: '='
            },
            link: function($scope, $element, $attrs) {
                initDefaults($scope);

                var container = $($element.find('div')[0]);
                var options = {
                    backdrop: ('backdrop' in $attrs) && ($scope.backdrop==='true')
                };

                $scope.open = function(x, y) {
                    $scope.newDevice.name = '';
                    $scope.newDevice.type = $scope.deviceTypes[0];
                    $scope.newDevice.x = x;
                    $scope.newDevice.y = y;
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                    container.modal(options);
                    container.modal('show');
                };

                $scope.close = function() {
                    container.modal('hide');
                };
            }
        };
    }]);