angular.module('ptAnywhere.widget.console')
    .directive('commandline', ['$log', function($log) {

        function strEndsWith(str, suffix) {
            return str.match(suffix + '$')==suffix;
        }

        function scrollToBottom() {
            if (!strEndsWith(window.location.href, '#' + html.nBottom)) {
                document.location.replace(window.location.href + '#' + html.nBottom);
            } else {
                document.location.replace(window.location.href);
            }
            // document.location.replace('#bottom'); // Only works if base property is unset.
            // Another alternative registering "redirection" in the browser history.
            // window.location.href = '#bottom';
        }

        // Fix for Chrome and Safari where e.key is undefined
        function fix(e) {
            if (typeof e.key === 'undefined') {
                switch(keyCode) {
                    case 9: e.key = 'Tab'; break;
                    case 13: e.key = 'Enter'; break;
                    case 38: e.key = 'ArrowUp'; break;
                    case 40: e.key = 'ArrowDown'; break;
                    default: $log.error('The key could not be '); break;
                }
            }
        }

        function executeCommand($scope, commandToExecute) {
            $scope.sendCommand({command: commandToExecute});
            $scope.input.command = '';
        }

        return {
            restrict: 'C',
            scope: {
                disabled: '=',
                output: '=',
                input: '=',
                sendCommand: '&',
                onPrevious: '&',
                onNext: '&'
            },
            templateUrl: 'commandline.html',
            link: function($scope, $element, $attrs) {
                var interactiveEl = $('.interactive', $element);
                var currentEl = $('input', interactiveEl);

                interactiveEl.keydown(function(e) {
                    fix(e);
                    if (e.key === 'Enter' || e.key === 'Tab') {  // or if (e.keyCode == 13 || e.keyCode == 9)
                        var commandPressed =  $scope.input.command;  // It does not have '\n' or '\t' at this stage
                        if (e.key === 'Tab') {
                            e.preventDefault();  // Do not tab, stay in this field.
                            commandPressed += '\t';
                        }
                        $scope.sendCommand({command: commandPressed});
                    }
                });

                interactiveEl.keyup(function(e) {
                    fix(e);
                    if (e.key === 'ArrowUp') {
                        $scope.onPrevious();
                    } else if (e.key === 'ArrowDown') {
                        $scope.onNext();
                    } else {
                        // In PT, when '?' is pressed, the command is send as it is.
                        var lastChar = $scope.input.command.slice(-1);
                        if (lastChar === '?') {  // It has '?'
                            $scope.sendCommand({command: $scope.input.command});
                        }
                    }
                });

                $scope.focusOnElement = function() {
                    currentEl.focus();
                };
            }
        };
    }]);