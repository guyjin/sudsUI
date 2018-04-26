define(['qunit', '../models/settings', '..', 'underscore', 'module'], 
    function(QUnit, Settings, Nrm, _, module) {
var run = function() {
    if (!QUnit.config.currentModule || QUnit.config.currentModule.name !== module.id) {
        // backwards-compatibility for early Starter Project implementation
        // DO NOT copy this into new tests, all new tests should assume the application is using latest Starter Project
        QUnit.module("Nrm.Models.Settings");
    }

/*
 * Tests:
 * new model() gets empty model with current url as id if none supplied, gets from localStorage if exists
 * model.set({att: undefined/null/"auto"}) calculate the value of att
 * model.set({att: value}) should set the value
 * model.setAll() sets all values in Nrm.Application.restoreSettings (or all if null)
 * new model({id:}) gets empty model if none exists
 * model.save() writes to local storage
 * model.restore({att:true|false, att:true|false}) applies all settings in model or just those identified
 *      returns object with the values of the settings restored
 * 
 */
QUnit.test( "model", function( assert ) {
    assert.expect(12);
    //var key = location.href.replace(location.hash,'').replace('/index.html', '').replace('?','').replace('#','');
    var v, key = location.origin + location.pathname.replace('/' + _.last(location.pathname.split('/')),'');
//    var v, key = location.href.replace(location.hash,'').replace('/index.html', '').replace('#','');
//    key = key.substr(0,(key.lastIndexOf('/') === key.length -1) ? key.length - 1 : key.length );
 // new model() gets empty model with current url as id if none supplied, gets from localStorage if exists
    var m = new Settings();
    console.log('initial model',m);
    assert.equal(m.get("key"), key, 'Auto-generate ID for new model');
 // model.set({att: undefined|"auto"}) calculate the value of att
    m.setPath();
    console.log('after set path',m);
    //assert.equal(m.get("background"), "Topo", 'Calculate attribute (background)');
    assert.equal(m.get('path'), location.hash,'set and get path');
 // model.set({att: value}) should set the value
    v = {a:"1", b:1, c:{z: "2", y: 2}};
    m.set({test: v});
    assert.deepEqual(m.get("test"), v, 'Set custom attribute');
 // model.save() write to local storage
    console.log('about to save model',m)
    try {
        m.save();
        v = localStorage.getItem("settings-" + key);
        assert.ok(v, 'Save');
    } catch (e) {
        console.log('Save error',e);
        assert.ok(false,'Save');
    }
 // read saved model into new model and compare
    var m2 = new Settings();
    assert.deepEqual(m2.attributes, m.attributes, 'Model retrieved intact from storage');
 // model.setAll() set all values in Nrm.Application.restoreSettings (or all if null)

//    m.listenToOnce("change", 
//        function(model, options){
//            console.log('change triggered',model,options);
//            assert.ok(true,'setAll() triggers change event');
//            doSetAll();
//        }
//    );
    m.setAll();
    assert.equal(m.get("path"),location.hash,'path');
    if (Nrm.Application && Nrm.Application.mapView) {
        assert.expect(assert.test.expected + 4);
        assert.ok(m.get("extent"),'extent');
        assert.ok(m.get("basemap"),'basemap');
        assert.ok(m.get("dynamicLayers"),'dynamicLayers');
        assert.ok(m.get("graphicsLayers"),'graphicsLayers');
    }
  // model.restore({att:true|false, att:true|false}) applies all settings in model or just those identified
    var restored = m.restore({path: false, extent:true, basemap:true, dynamicLayers:true, graphicsLayers:true});
    console.log('restored',restored);
    assert.notDeepEqual(restored, {extent:undefined, basemap:undefined, dynamicLayers:undefined, graphicsLayers:undefined}, 'restore all settings except path');
  // new model({id:}) gets empty model if none exists
    m2 = new Settings({id: 'unit test', name:'unit test model'});
    assert.equal(m2.get("id"), 'unit test', 'Create empty model with custom ID("unit test")');
    m2.save();
    var m3 = new Settings({id: 'unit test'});
    assert.equal(m3.get('name'), 'unit test model', 'Retrieve saved unit test model');
    //cleanup
    try {
        m.destroy();
        v = localStorage.getItem("settings-" + key);
        assert.equal(v, null,'remove model from localStorage');
    } catch (e) {
        console.log('error',e);
        assert.ok(false,'remove model from localStorage error: ' + e.message);
    }
    try {
        m2.destroy();
        v = localStorage.getItem("settings-" + key + "unit test");
        assert.equal(v, null,'remove model 2 from localStorage');
    } catch (e) {
        console.log('error',e);
        assert.ok(false,'remove model 2 from localStorage error: ' + e.message);
    }
    try {
        m3.destroy();
        assert.ok(true,'remove model 3 from localStorage');
    } catch (e) {
        v = localStorage.getItem("settings-" + key + "unit test");
        assert.equal(v, null,'remove model 3 from localStorage');
    }
});
};
return {run: run};
});