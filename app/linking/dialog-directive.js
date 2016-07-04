angular.module('ptAnywhere')
    .directive('linkDialog', ['locale_en', 'baseUrl', function(res, baseUrl) {

        function setDevices($scope, fromDevice, toDevice) {
            $scope.fromDevice = fromDevice;
            $scope.toDevice = toDevice;
            $scope.fromDeviceName = (fromDevice===null)? 'Device 1': fromDevice.label;
            $scope.toDeviceName = (toDevice===null)? 'Device 2': toDevice.label;
        }

        function initDefaults($scope) {
            $scope.locale = res;
            $scope.modal = {
                id: 'linkDialog',
                title: res.linkDialog.title,
                bodyTemplate: baseUrl + '/html/link-dialog-body.html',
                hasSubmit: false
            };
            $scope.show = {
                loading: true,
                loaded: false,
                error: false
            };
            $scope.submitError = null;
            // I messed up with the inherited scope and the user-updated ng-model value when I tried to use two
            // different variables for "selected".
            // This a (not so ideal) solution that works (i.e., updates the value in all the scopes)
            // because the value is hold in a reference inside the object passed through different scopes.
            $scope.selected = {fromIface: null, toIface: null};
            setDevices($scope, null, null);
        }

        function showLoading($scope) {
            $scope.show.loading = true;
            $scope.show.loaded = false;
            $scope.show.error = false;
            $scope.modal.hasSubmit = false;
        }

        function showLoaded($scope) {
            $scope.show.loading = false;
            $scope.show.loaded = true;
            $scope.show.error = false;
            $scope.modal.hasSubmit = true;
        }

        function showError($scope) {
            $scope.show.loading = false;
            $scope.show.loaded = false;
            $scope.show.error = true;
            $scope.modal.hasSubmit = false;
        }

        return {
            templateUrl: baseUrl + '/html/default-dialog.html',
            restrict: 'C',
            scope: {
                open: '=',  // initialized here
                backdrop: '@',
                init: '&',
                fromDevice: '=',
                toDevice: '=',
                fromIfaces: '=',
                toIfaces: '=',
                selected: '=',
                onSubmit: '&',
                submitError: '='
            },
            link: function($scope, $element, $attrs) {
                initDefaults($scope);

                var container = $($element.find('div')[0]);
                var options = {
                    backdrop: ('backdrop' in $scope) && ($scope.backdrop==='true')
                };

                $scope.open = function(fromDevice, toDevice) {
                    setDevices($scope, fromDevice, toDevice);
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                    showLoaded($scope);
                    $scope.init();
                    container.modal(options);
                    container.modal('show');
                };

                $scope.$watch('fromIfaces', function(newValue, oldValue) {
                    if($scope.fromIfaces !== null) {
                        $scope.selected.fromIface = $scope.fromIfaces[0];
                    }
                });

                $scope.$watch('toIfaces', function(newValue, oldValue) {
                    if($scope.toIfaces !== null) {
                        $scope.selected.toIface = $scope.toIfaces[0];
                    }
                });

                $scope.$watchGroup(['fromIfaces', 'toIfaces'], function(newValues, oldValues) {
                    for(var i in newValues) {
                        if (newValues[i] !== null && newValues[i].length === 0) {
                            showError($scope);
                        }
                    }
                });
            }
        };
    }]);