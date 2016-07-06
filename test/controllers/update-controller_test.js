describe('update controller', function() {
    beforeEach(module('ptAnywhere'));

    var ctrl, scope;
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        ctrl = $controller('UpdateController', {
            $scope: scope,
            $uibModalInstance: {},
            device: {label: 'name', defaultGateway: '10.0.0.1'}
        });
    }));

    it('checks that settings have not been changed', function() {
        expect(ctrl._haveGlobalSettingsChanged()).toBe(false);
        expect(ctrl._hasInterfaceChanged()).toBe(false);
    });

    it('checks when device name has changed', function() {
        scope.device.name = 'name1';
        expect(ctrl._haveGlobalSettingsChanged()).toBe(true);
    });

    it('checks when device default gateway has changed', function() {
        scope.device.defaultGateway = '10.0.0.2';
        expect(ctrl._haveGlobalSettingsChanged()).toBe(true);
    });

    it('checks when selected interface has not changed', function() {
        scope.interface.selected = {
            portIpAddress: '10.0.0.1',
            portSubnetMask: '255.255.255.0'
        };
        scope.interface.ipAddr = '10.0.0.1';
        scope.interface.subnet = '255.255.255.0';
        expect(ctrl._hasInterfaceChanged()).toBe(false);
    });

    it('checks when selected interface\'s ip address has changed', function() {
        scope.interface.selected = {
            portIpAddress: '10.0.0.1',
            portSubnetMask: '255.255.255.0'
        };
        scope.interface.ipAddr = '10.0.0.2';
        scope.interface.subnet = '255.255.255.0';
        expect(ctrl._hasInterfaceChanged()).toBe(true);
    });

    it('checks when selected interface\'s subnet address has changed', function() {
        scope.interface.selected = {
            portIpAddress: '10.0.0.1',
            portSubnetMask: '255.255.255.0'
        };
        scope.interface.ipAddr = '10.0.0.1';
        scope.interface.subnet = '255.255.254.0';
        expect(ctrl._hasInterfaceChanged()).toBe(true);
    });
});