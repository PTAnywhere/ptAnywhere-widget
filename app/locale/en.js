angular.module('ptAnywhere.locale')
    // Constant instead of value because it will be used in config.
    .constant('locale_en', {
        loading: 'Loading...',
        loadingInfo: 'Loading info...',
        name: 'Name',
        manipulationMenu: {
            edit: 'Edit',
            del: 'Delete selected',
            back: 'Back',
            addNode: 'Add Device',
            addEdge: 'Connect Devices',
            editNode: 'Edit Device',
            addDescription: 'Click in an empty space to place a new device.',
            edgeDescription: 'Click on a node and drag the edge to another element to connect them.',
            // BEGIN: Unused
            editEdge: 'Edit Edge',
            editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
            createEdgeError: 'Cannot link edges to a cluster.',
            deleteClusterError: 'Clusters cannot be deleted.',
            editClusterError: 'Clusters cannot be edited.'
            // END: Unused
        },
        session: {
            creating: {
                title: 'Creating new session...'
            },
            notFound: {
                title: 'Topology not found',
                content: '<p>The topology could not be loaded probably because the session does not exist (e.g., if it has expired).</p>' +
                         '<p><a href="#/">Click here</a> to initiate a new one.</p>'
            },
            unavailable: {
                title: 'Unavailable PT instances',
                content: '<p>Sorry, there are <b>no Packet Tracer instances available</b> right now to initiate a session.</p>' +
                         '<p>Please, wait a little bit and <a href="#/">try again</a>.</p>'
            },
            genericError: {
                title: 'Error creating PT instance',
                content: '<p>Sorry, there was an error initiating the session.</p>' +
                         '<p>Please, wait a little bit and <a href="#/">try again</a>.</p>'
            }
        },
        network: {
            loading: 'Loading network...',
            attempt: 'Attempt',
            errorUnavailable: 'Instance not yet available',
            errorTimeout: 'Timeout',
            errorUnknown: 'Unknown error',
            notLoaded: {
                title: 'Topology not found',
                content: '<p>The topology could not be loaded probably because the session does not exist (e.g., if it has expired).</p>' +
                         '<p><a href="?session">Click here</a> to initiate a new one.</p>'
            }
        },
        deleteDevice: {
            status: 'Deleting device...',
            error: 'The device could not be deleted.'
        },
        deleteLink: {
            status: 'Deleting link...',
            error: 'The link could not be deleted.'
        },
        creationMenu: {
            legend: 'To create a new device, drag it to the network map'
        },
        creationDialog: {
            title: 'Create new device',
            type: 'Device type'
        },
        linkDialog: {
            title: 'Connect two devices',
            select: 'Please select which ports to connect...',
            error: {
                loading: 'Problem loading the interfaces for this device. Please, try it again.',
                unavailability: 'One of the devices you are trying to link has no available interfaces.',
                creation: 'Sorry, something went wrong during the link creation.'
            }
        },
        modificationDialog: {
            title: 'Modify device',
            globalSettings: 'Global Settings',
            interfaces: 'Interfaces',
            defaultGW: 'Default gateway',
            ipAddress: 'IP address',
            subnetMask: 'Subnet mask',
            noSettings: 'No settings can be specified for this type of interface.'
        },
        commandLineDialog: {
            title: 'Command line'
        }
    });
