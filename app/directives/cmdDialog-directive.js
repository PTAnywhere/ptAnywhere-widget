angular.module('ptAnywhere')
    .directive('cmdDialog', ['locale_en', 'baseUrl', function(res, baseUrl) {
        var network;

        /*function setBody(htmlSnippet) {
            $('.modal-body', this.selector).html(htmlSnippet);
        }*/

        return {
            restrict: 'C',
            scope: {
                open: '='//,
                //backdrop: '='
            },
            templateUrl: baseUrl + '/html/cmd-dialog.html',
            link: function($scope, $element, $attrs) {
                var container = $($element.find('div')[0]);
                var options = {
                    backdrop: ('backdrop' in $scope) && ($scope.backdrop==='true')
                };

                $scope.title = res.commandLineDialog.title;
                $scope.open = function(endpoint) {
                    $('iframe.terminal', container).attr('src', endpoint);
                    $(container).modal(options);
                    $(container).modal('show');
                    /*if (this.options.backdrop && this.bdArea !== null) {
                        $('.modal-backdrop').appendTo(this.bdArea);
                    }*/
                };
                /*$element.on('hidden.bs.modal', function (e) {
                    // TODO not destroy and have many hidden modals to not remove previous interactions.
                    //setBody('');  // To make sure that no iframe is left open after the modal is closed.
                });*/

            }
        };
    }]);