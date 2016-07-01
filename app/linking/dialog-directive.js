angular.module('ptAnywhere')
    .directive('linkDialog', ['locale_en', 'baseUrl', function(res, baseUrl) {
        var success = null;

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
            $scope.errorMsg = '';
            $scope.selectedFromIface = null;
            $scope.selectedToIface = null;
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
            restrict: 'C',
            scope: {
                open: '=',  // initialized here
                backdrop: '@',
                init: '&',
                fromDevice: '=',
                toDevice: '=',
                fromIfaces: '=',
                fromIface: '=',  // selected one
                toIfaces: '=',
                toIface: '=',  // selected one
                onSubmit: '&'
            },
            templateUrl: baseUrl + '/html/default-dialog.html',
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