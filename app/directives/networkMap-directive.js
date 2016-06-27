angular.module('ptAnywhere')
    .directive('networkMap', ['locale_en', 'baseUrl', 'NetworkMapData', function(res, baseUrl, mapData) {
        var network;

        return {
            restrict: 'C',
            scope: {
                iconsSrc: '@'
            },
            template: '<div class="map"></div>',
            link: function($scope, $element, $attrs) {
                var visData = {
                    // I would prefer to pass it as an attr, but need to be an object and I want the vis.DataSet
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
                    manipulation: {
                        initiallyActive: true,
                        addNode: function(data, callback) {},
                        addEdge: function(data, callback) {},
                        editNode: function(data, callback) {},
                        editEdge: false,
                        deleteNode: function(data, callback) {},
                        deleteEdge: function(data, callback) {}
                    },
                    locale: 'ptAnywhere',
                    locales: {
                        ptAnywhere: res.manipulationMenu
                    },
                };
                var container = $element.find('div')[0];
                network = new vis.Network(container, visData, options);
            }
        };
    }]);