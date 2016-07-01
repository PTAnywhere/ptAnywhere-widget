angular.module('ptAnywhere')
    .directive('cmdDialog', ['locale_en', 'baseUrl', function(res, baseUrl) {
        return {
            restrict: 'C',
            scope: {
                open: '=',
                backdrop: '@'
            },
            templateUrl: baseUrl + '/html/cmd-dialog.html',
            link: function($scope, $element, $attrs) {
                var container = $($element.find('div')[0]);
                // TODO Implement this when backdropArea has been specified.
                /*backdrop: 'static',
                  backdropArea: '.widget'*/
                /*if (this.options.backdrop && this.bdArea !== null) {
                    $('.modal-backdrop').appendTo(this.bdArea);
                }*/
                var options = {
                    backdrop: ('backdrop' in $scope) && ($scope.backdrop==='true')
                };

                $scope.title = res.commandLineDialog.title;

                $scope.open = function(endpoint) {
                    var iframe = $('iframe.terminal', container);
                    iframe.attr('src', endpoint);
                    iframe.on('load', function(){
                        console.log('LOADED');

                        // To make sure that a previously loaded iframe is not shown while the new one is loaded.
                        container.modal(options);
                        container.modal('show');
                    });
                };
            }
        };
    }]);