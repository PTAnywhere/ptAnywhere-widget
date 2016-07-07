angular.module('ptAnywhere')
    .directive('draggableDevice', [function() {

        function init($scope) {
            $scope.originalPosition = {
                left: $scope.draggedSelector.css('left'),
                top: $scope.draggedSelector.css('top')
            };
            $scope.draggedSelector.draggable({
                helper: 'clone',
                opacity: 0.4,
                // The following properties interfere with the position I want to capture in the 'stop' event
                /*revert: true, revertDuration: 2000,  */
                start: function(event, ui) {
                    $scope.draggedSelector.css({'opacity':'0.7'});
                },
                stop: function(event, ui) {
                    if (collisionsWith(ui.helper, $scope.dragToSelector)) {
                        var creatingIcon = initCreatingIcon(ui);
                        var newDevice = getDevice($scope.type, ui.offset);
                        $scope.onDrop({device: newDevice})
                            .finally(function() {
                                moveToStartPosition($scope);
                                creatingIcon.remove();
                            });
                    } else {
                        moveToStartPosition($scope);
                    }
                }
            });
        }

        // Source: http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
        function collisionsWith(elementToCheck, possibleCollisionArea) {
            var x1 = possibleCollisionArea.offset().left;
            var y1 = possibleCollisionArea.offset().top;
            var h1 = possibleCollisionArea.outerHeight(true);
            var w1 = possibleCollisionArea.outerWidth(true);
            var b1 = y1 + h1;
            var r1 = x1 + w1;
            var x2 = elementToCheck.offset().left;
            var y2 = elementToCheck.offset().top;
            var h2 = elementToCheck.outerHeight(true);
            var w2 = elementToCheck.outerWidth(true);
            var b2 = y2 + h2;
            var r2 = x2 + w2;

            //if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
            return !(b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2);
        }

        function moveToStartPosition($scope) {
            $scope.draggedSelector.animate({opacity:'1'}, 1000, function() {
                $scope.draggedSelector.css({ // would be great with an animation too, but it doesn't work
                    left: $scope.originalPosition.left,
                    top: $scope.originalPosition.top
                });
            });
        }

        function initCreatingIcon(ui) {
            var image = $('<img alt="Temporary image" src="' + ui.helper.attr('src') + '">');
            image.css('width', ui.helper.css('width'));
            var warning = $('<div class="text-in-image"><span>Creating...</span></div>');
            warning.prepend(image);
            $('body').append(warning);
            warning.css({position: 'absolute',
                         left: ui.offset.left,
                         top: ui.offset.top});
            return warning;
        }

        function getDevice(deviceType, elementOffset) {
            var x = elementOffset.left;
            var y = elementOffset.top;
            // We don't use the return
            return {group: deviceType, x: x, y: y };
        }

        return {
            restrict: 'C',
            scope: {
                alt: '@',
                src: '@',
                dragTo: '@',
                type: '@',
                onDrop: '&'  // callback(device);
            },
            template: '<img class="ui-draggable ui-draggable-handle" alt="{{ alt }}" src="{{ src }}" />',
            link: function($scope, $element, $attrs) {
                if ('onDrop' in $attrs && $scope.onDrop !== null) {
                    $scope.draggedSelector = $('img', $element);
                    $scope.dragToSelector = $($scope.dragTo);
                    init($scope);
                }
            }
        };
    }]);