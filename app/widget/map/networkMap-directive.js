angular.module('ptAnywhere.widget.map')
    .directive('networkMap', ['$timeout', 'locale', 'NetworkMapData', 'imagesUrl', function($timeout, res, mapData, imagesUrl) {
        var network;

        function createNetworkMap($scope, networkContainer, imagesUrl, locale) {
            var visData = {
                // TODO I would prefer to pass both as attrs instead of as a service.
                // However, right now this is the most straightforward change.
                // Since for passing it as attrs I would need to be an object and I am not using vis.DataSet.
                nodes: mapData.getNodes(),
                edges: mapData.getEdges()
            };
            var options = {
                nodes: {
                    physics: false,
                    font: '14px verdana black',
                },
                edges: {
                    width: 3,
                    selectionWidth: 1.4,
                    color: {
                        color:'#606060',
                        highlight:'#000000',
                        hover: '#000000'
                    }
                 },
                groups: {
                    cloudDevice : {
                        shape : 'image',
                        image : imagesUrl + '/cloud.png',
                        size: 50
                    },
                    routerDevice : {
                        shape : 'image',
                        image : imagesUrl + '/router_cropped.png',
                        size: 45
                    },
                    switchDevice : {
                        shape : 'image',
                        image : imagesUrl + '/switch_cropped.png',
                        size: 35
                    },
                    pcDevice : {
                        shape : 'image',
                        image : imagesUrl + '/pc_cropped.png',
                        size: 45
                    }
                },
                manipulation: getManipulationOptions($scope, locale),
                locale: 'ptAnywhere',
                locales: {
                    ptAnywhere: res.manipulationMenu
                }
            };
            return new vis.Network(networkContainer, visData, options);
        }

        function getSelectedNode() {
            var selected = network.getSelection();
            if (selected.nodes.length !== 1) { // Only if just one is selected
                console.log('Only one device is supposed to be selected. Instead ' + selected.nodes.length + ' are selected.');
                return null;
            }
            return mapData.getNode(selected.nodes[0]);
        }

        function isOnlyOneEdgeSelected(event) {
            return event.nodes.length === 0 && event.edges.length === 1;
        }

        function isShowingEndpoint(node) {
            return node.label.indexOf('\n') !== -1;
        }

        function showEndpointsInEdge(edge) {
            var fromNode = mapData.getNode(edge.from);
            var toNode = mapData.getNode(edge.to);
            if ( !isShowingEndpoint(fromNode) ) {
                fromNode.label = fromNode.label + '\n(' + edge.fromLabel + ')';
                mapData.updateNode(fromNode);
            }
            if ( !isShowingEndpoint(toNode) ) {
                toNode.label = toNode.label + '\n(' + edge.toLabel + ')';
                mapData.updateNode(toNode);
            }
        }

        function hideEndpointsInEdge(edge) {
            var fromNode = mapData.getNode(edge.from);
            var toNode = mapData.getNode(edge.to);
            if ( isShowingEndpoint(fromNode) ) {
                fromNode.label = fromNode.label.split('\n')[0];
                mapData.updateNode(fromNode);
            }
            if ( isShowingEndpoint(toNode) ) {
                toNode.label = toNode.label.split('\n')[0];
                mapData.updateNode(toNode);
            }
        }

        function hideEndpointsInSelectedEdges(event) {
            for (var i = 0; i < event.edges.length; i++) {
                hideEndpointsInEdge( mapData.getEdge(event.edges[i]) );
            }
        }

        /**
         * Canvas' (0,0) does not correspond with the network map's DOM (0,0) position.
         *   @arg x DOM X coordinate relative to the canvas element.
         *   @arg y DOM Y coordinate relative to the canvas element.
         *   @return Coordinates on the canvas with form {x:Number, y:Number}.
         */
        function toNetworkMapCoordinate(x, y) {
            return network.DOMtoCanvas({x: x, y: y});
        }

        /* BEGIN tweak to vis.js */
        /* (Ugly) It uses jQuery to add a status message in vis.js manipulation menu. */
        function showStatus(msg) {
            $('div.vis-manipulation').append('<div class="statusMsg vis-button vis-none"><div class="vis-label text-warning">' + msg + '</p></div>');
            $('div.statusMsg').fadeIn('slow');
        }
        function showTemporaryStatus(msg) {
            $('div.vis-manipulation').append('<div class="statusMsg vis-button vis-none"><div class="vis-label text-danger">' + msg + '</p></div>');
            $('div.statusMsg').fadeIn('slow').delay( 2000 ).fadeOut('slow');
        }
        /* END tweak to vis.js */

        function getManipulationOptions($scope, locale) {
            var emptyFunction = function(data, callback) {};
            var addNode = emptyFunction;
            var addEdge = emptyFunction;
            var editNode = emptyFunction;
            var deleteNode = emptyFunction;
            var deleteEdge = emptyFunction;

            if ('onAddDevice' in $scope) {
                addNode = function(data, callback) {
                    $scope.onAddDevice({x: data.x, y: data.y});
                };
            }
            if ('onAddLink' in $scope) {
                addEdge = function(data, callback) {
                    var fromDevice = mapData.getNode(data.from);
                    var toDevice = mapData.getNode(data.to);
                    $scope.onAddLink({fromDevice: fromDevice, toDevice: toDevice});
                };
            }
            if ('onEditDevice' in $scope) {
                editNode = function(data, callback) {
                    $scope.onEditDevice({device: mapData.getNode(data.id)});
                    callback(data);
                };
            }
            if ('onDeleteDevice' in $scope) {
                deleteNode = function(data, callback) {
                    showStatus(locale.deleteDevice.status);
                    // Always (data.nodes.length>0) && (data.edges.length==0)
                    // FIXME There might be more than a node selected...
                    $scope.onDeleteDevice({device: mapData.getNode(data.nodes[0])})
                            .then(function() {
                                // This callback is important, otherwise it received 3 consecutive onDelete events.
                                callback(data);
                            }, function() {
                                callback([]);
                                showTemporaryStatus(locale.deleteDevice.error);
                            });
                };
            }
            if ('onDeleteLink' in $scope) {
                deleteEdge = function(data, callback) {
                    showStatus(locale.deleteLink.status);
                    // Always (data.nodes.length==0) && (data.edges.length>0)
                    // TODO There might be more than an edge selected...
                    var edge = mapData.getEdge(data.edges[0]);
                    hideEndpointsInEdge(edge);
                    $scope.onDeleteLink({link: edge})
                            .then(function() {
                                // This callback is important, otherwise it received 3 consecutive onDelete events.
                                callback(data);
                            }, function() {
                                callback([]);
                                showTemporaryStatus(locale.deleteLink.error);
                            });
                };
            }

            return {
                initiallyActive: true,
                addNode: addNode,
                addEdge: addEdge,
                editNode: editNode,
                editEdge: false,
                deleteNode: deleteNode,
                deleteEdge: deleteEdge
            };
        }

        return {
            restrict: 'C',
            scope: {
                onOpenConsole: '&',  // callback(selected);
                onAddDevice: '&',  // interactionCallback(data.x, data.y);
                onAddLink: '&',  // interactionCallback(fromDevice, toDevice);
                onEditDevice: '&',  //interactionCallback( nodes.get(data.id) );
                onDeleteDevice: '&',  // interactionCallback(nodes.get(data.nodes[0]));
                onDeleteLink: '&',  // interactionCallback(edge);
                adaptCoordinates: '='  // Function defined in this directive but used by controllers.
            },
            template: '<div class="map"></div>',
            link: function($scope, $element, $attrs) {
                var container = $element.find('div')[0];
                network = createNetworkMap($scope, container, imagesUrl, res);
                $scope.$on('$destroy', function() {
                    network.destroy();
                });

                $scope.adaptCoordinates = toNetworkMapCoordinate;

                network.on('selectNode', function(event) {
                    hideEndpointsInSelectedEdges(event);
                });
                network.on('selectEdge', function(event) {
                    if ( isOnlyOneEdgeSelected(event) ) {
                        var edge = mapData.getEdge(event.edges[0]);
                        showEndpointsInEdge(edge);
                    }
                });
                network.on('deselectEdge', function(event) {
                    if ( isOnlyOneEdgeSelected(event.previousSelection) ) {
                        hideEndpointsInSelectedEdges(event.previousSelection);
                    }
                });
                if ('onOpenConsole' in $scope) {
                    var onOpenConsole = function() {
                        var selected = getSelectedNode();
                        if (selected !== null) {
                            $scope.onOpenConsole({endpoint: selected.consoleEndpoint});
                        }
                    };
                    network.on('doubleClick', onOpenConsole);

                    /* BEGIN tweak to vis.js */
                    var toAppend = null;  // Shared in selectNode and deselectNode
                    var addOpenConsoleButton = function(event) {
                        if (event.nodes.length === 1) {
                            // Timeout so the DOM modification by vis.js happens before.
                            $timeout(function() {
                                if (toAppend !== null) toAppend.remove();
                                toAppend = $('<div class="vis-separator-line"></div>' +
                                             '<div class="vis-button vis-console"><div class="vis-label">' +
                                             res.manipulationMenu.openConsole + '</div></div>');
                                $('div.vis-manipulation', $element).append(toAppend);
                                $('div.vis-console', $element).click(onOpenConsole);
                            }, 1);
                        }
                    };
                    network.on('deselectNode', function(ev) {
                        if (toAppend !== null && ev.nodes.length !== 1 && ev.previousSelection.nodes.length === 1) {
                            toAppend.remove();
                            toAppend = null;
                        }
                    });
                    network.on('selectNode', addOpenConsoleButton);
                    // Because vis.js changes the manipulation menu after a double click
                    network.on('doubleClick', addOpenConsoleButton);
                    /* END tweak to vis.js */
                }
            }
        };
    }]);