define([
    '../../models/rule',
    '../../models/businessObject'
], function(Rule, BusinessObject) {
    
    return {
        /**
         * Test the {@link module:nrm-ui/models/rule.isDate} business rule. Note that this is incomplete, currently only 
         * covers changes made in Water Samples branch, remaining tests will be added later.
         * @param {external:module:qunit} QUnit The QUnit module
         * @returns {undefined}
         */
        run: function(QUnit) {
            QUnit.test('artf65876: Invalid date range validation message', function(assert) {
                assert.expect(4);
                var todayOrEarlier = new Rule({
                    property: 'sampleDate',
                    maxValue: 'today'
                }), arbitraryDateRange = new Rule({
                    property: 'sampleDate',
                    minValue: '1997-01-01',
                    maxValue: '2017-01-01'
                }), todayOrLater = new Rule({
                    property: 'sampleDate',
                    minValue: 'today'
                });
                function daysFromNow(days) {
                    // quick and dirty date addition, doesn't account for timezones so use with care
                    var date = new Date( new Date().getTime() + days * 86400000 );
                    var dateStr = date.toISOString();
                    return dateStr.substr(0, 10);
                }
                var futureDate = daysFromNow(2);
                var pastDate = daysFromNow(-2);
                var model = new BusinessObject({
                    sampleDate: futureDate
                });
                function createCallback(prefix, expected) {
                    return function(rule, message) {
                        assert.equal(message, expected, prefix + ': Rule validation message is "' + expected + '"');
                    }
                }
                Rule.isDate.call(model, todayOrEarlier, createCallback('maxValue=today', 
                    'Date must be today or earlier'));
                model.set('sampleDate', pastDate);
                Rule.isDate.call(model, todayOrLater, createCallback('minValue=today', 
                    'Date must be today or later'));
                model.set('sampleDate', '1996-01-01');
                Rule.isDate.call(model, arbitraryDateRange, createCallback('minValue=now', 
                    'Date must be 01/01/1997 or later'));
                model.set('sampleDate', '2018-01-01');
                Rule.isDate.call(model, arbitraryDateRange, createCallback('minValue=now', 
                    'Date must be 01/01/2017 or earlier'));
            });
        }
    };
    
});