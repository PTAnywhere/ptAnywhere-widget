describe('websocket API service', function() {
    beforeEach(angular.mock.module('ngWebSocket', 'ngWebSocketMock'));
    beforeEach(module('ptAnywhere.api.websocket'));

    var url = 'ws://foo/bar';
    var $websocketBackend, tested;
    beforeEach(inject(function(_$websocketBackend_, WebsocketApiService) {
        $websocketBackend = _$websocketBackend_;
        tested = WebsocketApiService;

        $websocketBackend.mock();
        $websocketBackend.expectConnect(url);
    }));

    afterEach(function() {
        $websocketBackend.verifyNoOutstandingRequest();
        $websocketBackend.verifyNoOutstandingExpectation();
    });

    it('connects to websocket', function() {
        tested.start(url);
        $websocketBackend.flush();
    });

    it('sends command', function() {
        var toBeSent = 'my command';
        $websocketBackend.expectSend(toBeSent);

        tested.start(url);
        tested.execute(toBeSent);

        $websocketBackend.flush();
    });

    it('sends request to update history', function() {
        $websocketBackend.expectSend('/getHistory');

        tested.start(url);
        tested.getHistory();

        $websocketBackend.flush();
    });
});