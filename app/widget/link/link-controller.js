angular.module('ptAnywhere.widget.link')
    .controller('LinkController', ['$log', '$scope', '$q', '$uibModalInstance', 'locale', 'HttpApiService',
                                    'fromDevice', 'toDevice',
                                    function($log, $scope, $q, $uibModalInstance, locale, api, fromDevice, toDevice) {
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
        $scope.selected = {fromIface: null, toIface: null};

        self._load = function() {
            if (fromDevice!==null && toDevice!==null) {
                var arrayOfPromises = [
                    api.getAvailablePorts(fromDevice),
                    api.getAvailablePorts(toDevice)
                ];
                $q.all(arrayOfPromises)
                        .then(function(arrayOfResponses) {
                            $scope.fromInterfaces = arrayOfResponses[0];
                            $scope.toInterfaces = arrayOfResponses[1];
                            // Items selected by default:
                            if(!$scope.emptyInterfaces()) {
                                $scope.selected.fromIface = $scope.fromInterfaces[0];
                                $scope.selected.toIface = $scope.toInterfaces[0];
                                $scope.modal.hasSubmit = true;
                            }
                        }, function(response) {
                            $log.error('Interfaces to be linked could not be loaded.', response);
                            if (response.status === 410) {
                                $uibModalInstance.dismiss('cancel');
                            } else {
                                $scope.loadError = '(error code: ' + response.status + ')';
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