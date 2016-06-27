angular.module('ptAnywhere')
    .factory('NetworkMapData', [function() {
        var loaded = false;
        var nodes = new vis.DataSet();
        var edges = new vis.DataSet();

        return {
            load: function(initialData) {
                loaded = true;
                if (initialData.devices !== null) {
                    nodes.clear();
                    nodes.add(initialData.devices);
                }
                if (initialData.edges !== null) {
                    edges.clear();
                    edges.add(initialData.edges);
                }
            },
            isLoaded: function() {
                return loaded;
            },
            getNodes: function() {
                return nodes;
            },
            getEdges: function() {
                return edges;
            }
        };
    }]);