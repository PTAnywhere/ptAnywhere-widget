angular.module('ptAnywhere')
    .directive('updateDialog', ['locale_en', 'baseUrl', function(res, baseUrl) {

        function initDefaults($scope) {
            $scope.locale = res;
            $scope.modal = {
                id: 'modificationDialog',
                title: res.modificationDialog.title,
                bodyTemplate: baseUrl + '/html/update-dialog-body.html',
                hasSubmit: true
            };
            $scope.submitError = null;
            // TODO with a better understanding on inherited scopes, I could try to create to separate variables.
            $scope.device = {name: '', type: null, x: 0, y: 0};
        }

        return {
            templateUrl: baseUrl + '/html/default-dialog2.html',
            restrict: 'C',
            scope: {
                open: '=',  // initialized here
                close: '=',  // initialized here
                backdrop: '@',
                device: '=',  // set here
                interfaces: '=',  // set in controller
                onSubmit: '&',
                submitError: '='
            },
            link: function($scope, $element, $attrs) {
                initDefaults($scope);

                var container = $($element.find('div')[0]);
                var options = {
                    backdrop: ('backdrop' in $attrs) && ($scope.backdrop==='true')
                };

                $scope.open = function(device) {
                    $scope.device = device;
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