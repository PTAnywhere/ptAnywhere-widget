angular.module('ptAnywhere.widget')
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
            getNode: function(nodeId) {
                return nodes.get(nodeId);
            },
            updateNode: function(node) {
                nodes.update(node);
            },
            addNode: function(node) {
                return nodes.add(node);
            },
            getNodes: function() {
                return nodes;
            },
            getEdge: function(edgeId) {
                return edges.get(edgeId);
            },
            getEdges: function() {
                return edges;
            },
            connect: function(fromDevice, toDevice, linkId, linkUrl, fromPortName, toPortName) {
                // FIXME unify the way to connect devices
                var newEdge;
                if (typeof fromDevice === 'string'  && typeof toDevice === 'string') {
                    // Alternative used mainly in the replayer
                    newEdge = { from: getByName(fromDevice).id, to: getByName(toDevice).id };
                } else {
                    // Alternative used in interactive widgets
                    newEdge = { from: fromDevice.id, to: toDevice.id };
                }
                if (linkId !== undefined) {
                    newEdge.id = linkId;
                }
                if (linkUrl !== undefined) {
                    newEdge.url = linkUrl;
                }
                if (fromPortName !== undefined) {
                    newEdge.fromLabel = fromPortName;
                }
                if (toPortName !== undefined) {
                    newEdge.toLabel = toPortName;
                }
                edges.add(newEdge);
            }
        };
    }]);