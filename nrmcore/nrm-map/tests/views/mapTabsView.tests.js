define([
    "qunit", 
    "jquery", 
    "nrm-map/views/mapTabsView",
    'esri/map'
], function(
        QUnit, 
        $, 
        View,
        Map
    ) {
    var fixture = "#qunit-fixture",
            containerId = "map-tabs-test-container";
    function domroot() {
        return $(fixture);
    }
    function addContainer() {
        // the view sets its element to the container, thus removing the view removes the container
        domroot().append('<div id="' + containerId + '-mapdiv"></div><div class="panel panel-default" id="' + containerId + '"></div>');
    }
    return {
        run: function() {
            // module defined in main
            QUnit.test("View renders child tab views.", function(assert) {
                addContainer();
                assert.ok($("#" + containerId + "-mapdiv").length, 'DOM before map');
                var map = new Map($("#" + containerId + "-mapdiv")[0], {basemap:"gray"}),
                    options = {
                        accordionId: containerId,
                        autoResize: false,
                        editSr: 4326,
                        //id: containerId + "-mapdiv",
                        mapControl: {map: map},
                        tocExpanded: true,
                        tocId: "mapTocControl",
                        z: 4
                    },
                    mapLoaded = assert.async();
                map.on("load", function(evt){
                    console.log("test map loaded");
                    assert.ok(map.loaded, 'Map loaded');
                    var view = new View(options);
                    assert.ok(view, 'View created');
                    var $firstTab = $("#" + view.tabs[0].id, view.$el),
                        $tabContent = $("#" + view.options.contentElemId, view.$el);
                    assert.equal($firstTab.length, 1, "First tab DOM element exists.");
                    assert.ok($firstTab.hasClass("active"), "First tab is active.");
                    assert.ok(view.tabs[0].view, "First tab view exists.");
                    assert.ok($tabContent.html().length > 15, "Tab area has content.");
                    mapLoaded();
                });
            });
        }
    };
});