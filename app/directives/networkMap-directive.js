angular.module('ptAnywhere')
    .directive('networkMap', ['locale_en', 'baseUrl', 'NetworkMapData', function(res, baseUrl, mapData) {
        var network;

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

        function isNodeSelected(event) {
            return event.nodes.length > 0;
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

        function getManipulationOptions($scope) {
            var emptyFunction = function(data, callback) {};
            var addNode = emptyFunction;
            var addEdge = emptyFunction;
            var editNode = emptyFunction;
            var deleteNode = emptyFunction;
            var deleteEdge = emptyFunction;

            if ('onAddDevice' in $scope) {
                addNode = function(data, callback) {
                    $scope.onAddDevice(data.x, data.y);
                };
            }
            if ('onAddLink' in $scope) {
                addEdge = function(data, callback) {
                    var fromDevice = mapData.getNode(data.from);
                    var toDevice = mapData.getNode(data.to);
                    $scope.onAddLink(fromDevice, toDevice);
                };
            }
            if ('onEditDevice' in $scope) {
                editNode = function(data, callback) {
                    $scope.onEditDevice(mapData.getNode(data.id));
                    callback(data);
                };
            }
            if ('onDeleteDevice' in $scope) {
                deleteNode = function(data, callback) {
                    // Always (data.nodes.length>0) && (data.edges.length==0)
                    // FIXME There might be more than a node selected...
                    $scope.onDeleteDevice(mapData.getNode(data.nodes[0]));
                    // This callback is important, otherwise it received 3 consecutive onDelete events.
                    callback(data);
                };
            }
            if ('onDeleteLink' in $scope) {
                deleteEdge = function(data, callback) {
                    // Always (data.nodes.length==0) && (data.edges.length>0)
                    // TODO There might be more than an edge selected...
                    var edge = mapData.getEdge(data.edges[0]);
                    hideEndpointsInEdge(edge);
                    $scope.onDeleteLink(edge);
                    // This callback is important, otherwise it received 3 consecutive onDelete events.
                    callback(data);
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
                iconsSrc: '@',
                onDoubleClick: '&',  // callback(selected);
                onAddDevice: '&',  // interactionCallback(data.x, data.y);
                onAddLink: '&',  // interactionCallback(fromDevice, toDevice);
                onEditDevice: '&',  //interactionCallback( nodes.get(data.id) );
                onDeleteDevice: '&',  // interactionCallback(nodes.get(data.nodes[0]));
                onDeleteLink: '&'  // interactionCallback(edge);
            },
            template: '<div class="map"></div>',
            link: function($scope, $element, $attrs) {
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
                            image : $scope.iconsSrc + 'cloud.png',
                            size: 50,
                        },
                        routerDevice : {
                            shape : 'image',
                            image : $scope.iconsSrc + 'router_cropped.png',
                            size: 45,
                        },
                        switchDevice : {
                            shape : 'image',
                            image : $scope.iconsSrc + 'switch_cropped.png',
                            size: 35,
                        },
                        pcDevice : {
                            shape : 'image',
                            image : $scope.iconsSrc + 'pc_cropped.png',
                            size: 45,
                        }
                    },
                    manipulation: getManipulationOptions($scope),
                    locale: 'ptAnywhere',
                    locales: {
                        ptAnywhere: res.manipulationMenu
                    }
                };
                var container = $element.find('div')[0];
                network = new vis.Network(container, visData, options);


                network.on('select', function(event) {
                    if ( isOnlyOneEdgeSelected(event) ) {
                        var edge = edges.get(event.edges[0]);
                        showEndpointsInEdge(edge);
                    } else if ( isNodeSelected(event) ) {
                        hideEndpointsInSelectedEdges(event);
                    }
                });
                network.on('deselectEdge', function(event) {
                    if ( isOnlyOneEdgeSelected(event.previousSelection) ) {
                        hideEndpointsInSelectedEdges(event.previousSelection);
                    }
                });
                if ('onDoubleClick' in $scope) {
                    network.on('doubleClick', function() {
                        var selected = getSelectedNode();
                        if (selected !== null) {
                            $scope.onDoubleClick({endpoint: selected.consoleEndpoint});
                        }
                    });
                }
            }
        };
    }]);