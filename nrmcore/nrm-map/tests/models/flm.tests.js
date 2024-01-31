define([
    'jquery',
    'underscore',
    '../../models/flm',
    'nrm-ui',
    'nrm-ui/models/application'
], function(
        $,
        _,
        FLM,
        Nrm,
        Application
                ) {
    
    return {
        /**
         * Test {@link module:nrm-map/models/flmDataSource}.
         * @param {external:module:qunit} QUnit The QUnit module
         * @returns {undefined}
         */
        run: function(QUnit) {
            QUnit.test('Feature Level Metadata model', function(assert) {
                // class methods
                var lovDone = assert.async();
                Nrm.app = new Application();
                $.when(FLM.getFlmDataSourceLov()).done(function(lov) {
                    
                    console.log("flmDataSourceCollection", lov);
                    assert.ok(lov.models && lov.models.length > 1, "FlmDataSourceCollection has models");
                    // good values, long names
                    var atts = {
                        accuracy: 3,
                        datasource: "03",
                        revisiondate: "06/07/2017"
                    };
                    assert.equal(FLM.getDataSourceAttName(atts), "datasource", "Data source attribute name = datasource");
                    assert.equal(FLM.getDataSource(atts), "03", "Data source 03");
                    delete atts.datasource;
                    atts.data_source = "03";
                    assert.equal(FLM.getDataSourceAttName(atts), "data_source", "Data source attribute name = data_source");
                    assert.equal(FLM.getDataSource(atts), "03", "Data source 03");
                    delete atts.data_source;
                    atts.flmdatasource = "03";
                    assert.equal(FLM.getDataSourceAttName(atts), "flmdatasource", "Data source attribute name = flmdatasource");
                    assert.equal(FLM.getDataSource(atts), "03", "Data source 03");
                    delete atts.flmdatasource;
                    atts.data_sourc = "03";
                    assert.equal(FLM.getDataSourceAttName(atts), "data_sourc", "Data source attribute name = data_sourc");
                    assert.equal(FLM.getDataSource(atts), "03", "Data source 03");
                    delete atts.data_sourc;
                    atts.flmdatasou = "03";
                    assert.equal(FLM.getDataSourceAttName(atts), "flmdatasou", "Data source attribute name = flmdatasou");
                    assert.equal(FLM.getDataSource(atts), "03", "Data source 03");
                    atts.flmdatasou = 4;
                    assert.equal(FLM.getDataSource(atts), "04", "Data source number 4 returns as string '04'");
                    atts.flmdatasou = "77";
                    assert.equal(FLM.getDataSource(atts), "00", "Data source '77' is '00' (unknown)");
                    atts.flmdatasou = "n";
                    assert.equal(FLM.getDataSource(atts), "00", "Data source 'n' is '00' (unknown)");
                    assert.equal(FLM.getAccuracy(atts), 3, "Accuracy 3");
                    delete atts.accuracy;
                    atts.flmAccuracy = 3;
                    assert.equal(FLM.getAccuracy(atts), 3, "Accuracy 3");
                    delete atts.flmAccuracy;
                    assert.notOk(FLM.getAccuracy(atts), "No accuracy attribute returns no accuracy");
                    atts.flmAccuracy = "4";
                    assert.equal(FLM.getAccuracy(atts), 4, "Accuracy string '4' returns as number 4");
                    atts.flmAccuracy = "n";
                    assert.notOk(FLM.getAccuracy(atts), "Accuracy string 'n' returns falsy");
                    assert.ok(_.isDate(new Date(FLM.getRevDate(atts))),"revisiondate is a date" );
                    delete atts.revisiondate;
                    atts.rev_date = "2017/06/07";
                    assert.ok(_.isDate(new Date(FLM.getRevDate(atts))),"rev_date is a date" );
                    //6/27/2017 added overloads to getXName methods
                    assert.equal(FLM.getDataSourceAttName(new FLM({datasource: 1, x: 2, y:3})), "datasource", "Data source attribute name = datasource for a Model");
                    assert.equal(FLM.getDataSourceAttName(["datasource", "x", "y"]), "datasource", "Data source attribute name = datasource for an Array");
                    assert.equal(FLM.getAccuracyAttName({datasource: 1, accuracy: 2, y:3}), "accuracy", "Accuracy attribute name = accuracy for an Object");
                    assert.equal(FLM.getAccuracyAttName(new FLM({datasource: 1, accuracy: 2, y:3})), "accuracy", "Accuracy attribute name = accuracy for a Model");
                    assert.equal(FLM.getAccuracyAttName(["datasource", "accuracy", "y"]), "accuracy", "Accuracy attribute name = accuracy for an Array");
                    assert.equal(FLM.getAccuracyAttName("datasource", "notaccuracy", "y"), undefined, "Accuracy attribute name is empty for array with no accuracy");
                    assert.equal(FLM.getRevDateAttName({datasource: 1, accuracy: 2, rev_date:3}), "rev_date", "Rev Date attribute name = rev_date for an Object");
                    assert.equal(FLM.getRevDateAttName(new FLM({datasource: 1, accuracy: 2, rev_date:3})), "rev_date", "Rev Date attribute name = rev_date for a Model");
                    assert.equal(FLM.getRevDateAttName(["datasource", "accuracy", "rev_date"]), "rev_date", "Rev Date attribute name = rev_date for an Array");
                    assert.equal(FLM.getRevDateAttName("datasource", "notaccuracy", "y"), undefined, "Rev Date attribute name is empty for array with no accuracy");
                    lovDone();
                });
            });
        }
    };
    
});