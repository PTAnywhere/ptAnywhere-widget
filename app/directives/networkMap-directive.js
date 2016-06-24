angular.module('ptAnywhere')
    .directive('networkMap', ['locale_en', 'baseUrl', function(loc, baseUrl) {
        return {
            restrict: 'C',
            //require: 'ngModel',
            template: '<div class="map"></div>',
            link: function($scope, $element, $attrs, ngModelCtrl) {
                /*console.log(ngModelCtrl.$viewValue);

                ngModelCtrl.$render = function() {
                    $element.val(ngModelCtrl.$viewValue);
                };
                // When data changes outside of AngularJS
                $element.on('set', function(args) {
                    // Also tell AngularJS that it needs to update the UI
                    $scope.$apply(function() {
                        // Set the data within AngularJS
                        ngModelCtrl.$setViewValue($element.val());
                    });
                });*/
            }
        };
    }]);