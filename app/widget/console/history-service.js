angular.module('ptAnywhere.widget.console')
    .factory('HistoryService', [function() {
        var commands = null;
        var currentIndex = 0;  // Iterator from 0 to length+1
        // In last position you can already access previous.

        return {
            needsToBeUpdated: function() {
                return commands === null;
            },
            markToUpdate: function() {
                commands = null;
            },
            update: function(newCommandHistory, callback) {
              commands = newCommandHistory;
              // Current is outside the array limits at the beginning
              currentIndex = commands.length;
              callback(this.getPreviousCommand());
            },
            getPreviousCommand: function() {
                if (this.needsToBeUpdated()) return null;
                // No previous (already in the first position or empty array)
                if (currentIndex === 0 || commands.length === 0) return null;
                return commands[--currentIndex];
            },
            getNextCommand: function() {
                if (this.needsToBeUpdated()) return null;
                // if currentIndex is in length-1, there is no 'next command'.
                if (currentIndex < commands.length)
                    // current can still be moved to last position if === length - 1
                    currentIndex++;
                if (currentIndex === commands.length) return null;
                return commands[currentIndex];
            },
            _moveIteratorToTheBeginning: function() { // Function for tests
                currentIndex = 0;
            }
        };
    }]);