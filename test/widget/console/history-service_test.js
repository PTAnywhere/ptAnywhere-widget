describe('history service', function() {
    beforeEach(module('ptAnywhere.widget.console'));

    var history;
    var testableHistory = ['dir', 'ping', 'ping 10.0.0.1', 'del file.txt', 'exit'];
    beforeEach(inject(function(HistoryService) {
        history = HistoryService;
    }));

    it('needs to be updated at the beginning', function() {
        expect(history.needsToBeUpdated()).toBe(true);
    });

    it('can be updated', function(done) {
        history.update([], function(previousCommand) {
            expect(previousCommand).toBeNull();  // Empty history set
            done();
        });
    });

    it('can be marked to be updated later', function(done) {
        history.update([], function(previousCommand) {
            expect(history.needsToBeUpdated()).toBe(false);
            history.markToUpdate();
            expect(history.needsToBeUpdated()).toBe(true);
            done();
        });
    });

    it('can check previous commands', function(done) {
        history.update(testableHistory, function(previousCommand) {
            var i;
            for (i = testableHistory.length - 2; i>=0; i--) {  // -2 because latest command is not returned
                expect(history.getPreviousCommand()).toBe(testableHistory[i]);
            }
            expect(history.getPreviousCommand()).toBeNull();
            done();
        });
    });

    it('can move forward checking commands', function(done) {
        history.update(testableHistory, function(previousCommand) {
            var i;
            // If iterator is in the last command...
            expect(history.getNextCommand()).toBeNull();
            // Otherwise...
            history._moveIteratorToTheBeginning();
            for (i=1; i<testableHistory.length; i++) {
                console.log(testableHistory[i]);
                expect(history.getNextCommand()).toBe(testableHistory[i]);
            }
            expect(history.getNextCommand()).toBeNull();
            done();
        });
    });
});