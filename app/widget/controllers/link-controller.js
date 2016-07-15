angular.module('ptAnywhere.widget')
    .controller('LinkController', ['$log', '$scope', '$uibModalInstance', 'locale', 'HttpApiService',
                                    'fromDevice', 'toDevice',
                                    function($log, $scope, $uibModalInstance, locale, api, fromDevice, toDevice) {
        var self = this;
        $scope.fromDeviceName = fromDevice.label;
        $scope.toDeviceName = toDevice.label;
        $scope.fromInterfaces = null;
        $scope.toInterfaces = null;
        $scope.submitError = null;
        $scope.loadError = null;

        $scope.locale = locale;
        $scope.modal = {
            id: 'linkDialog',
            title: locale.linkDialog.title,
            bodyTemplate: 'link-dialog-body.html',
            hasSubmit: false
        };
        // I messed up with the inherited scope and the user-updated ng-model value when I tried to use two
        // different variables for "selected".
        // This a (not so ideal) solution that works (i.e., updates the value in all the scopes)
        // because the value is hold in a reference inside the object passed through different scopes.
        $scope.selected = {fromIface: null, toIface: null};

        self._load = function() {
            if (fromDevice!==null && toDevice!==null) {
                var arrayOfPromises = [
                    api.getAvailablePorts(fromDevice),
                    api.getAvailablePorts(toDevice)
                ];
                Promise.all(arrayOfPromises)
                        .then(function(arrayOfResponses) {
                            $scope.fromInterfaces = arrayOfResponses[0];
                            $scope.toInterfaces = arrayOfResponses[1];
                            // Items selected by default:
                            if(!$scope.emptyInterfaces()) {
                                $scope.selected.fromIface = $scope.fromInterfaces[0];
                                $scope.selected.toIface = $scope.toInterfaces[0];
                                $scope.modal.hasSubmit = true;
                            }
                            if(!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, function(response) {
                            $log.error('Interfaces to be linked could not be loaded.', response);
                            if (response.status === 410) {
                                $uibModalInstance.dismiss('cancel');
                            } else {
                                $scope.loadError = '(error code: ' + response.status + ')';
                                if(!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        });
            }
        };

        $scope.isLoadingInterfaces = function() {
            return  $scope.fromInterfaces === null && $scope.toInterfaces === null;
        };

        $scope.emptyInterfaces = function() {
            return $scope.fromInterfaces.length === 0 || $scope.toInterfaces.length === 0;
        };

        $scope.availableInterfaces = function() {
            return !$scope.isLoadingInterfaces() && !$scope.emptyInterfaces();
        };

        $scope.submit = function() {
            var fromIf = $scope.selected.fromIface;
            var toIf = $scope.selected.toIface;
            $scope.submitError = null;
            api.createLink(fromIf.url, toIf.url)
                .then(function(newLink) {
                    var retLink = {
                        newLink: newLink,
                        fromPortName: fromIf.portName,
                        toPortName: toIf.portName
                    };
                    $uibModalInstance.close(retLink);
               }, function(error) {
                   $scope.submitError = 'Link could not be created (' + error.statusText + ').';
                   $log.error('Link creation', error);
               });
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        self._load();
    }]);