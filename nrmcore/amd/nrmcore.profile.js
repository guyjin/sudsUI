//define('handlebars-compiler', 0); // this is for the non-AMD version of Handlebars

var profile = (function(){
    // important: override the config-tlmSiblingOfDojo test so that modules without a package are resolved correctly.
    require.has.add("config-tlmSiblingOfDojo", 0, true, true);
    
    // make the default nrmcore.profile available globally to make it easier to override
    var nrmcore = require.nrmcore = (require.nrmcore || { });
    nrmcore.nonAmdModules = { // non-AMD modules not in a package
                'bootstrap':1, 
                'datatables-bootstrap':1, 
                'pnotify':1, 
                'jquery-layout':1, 
                'jquery-ui-touch':1, 
                'select2':1, 
                'datepicker':1, 
                'backbone-shim':1, 
                'underscore-shim':1,
                'modernizr':1,
                'bootstrap-wysiwyg': 1,
                'jquery-hotkeys': 1,
                'sinon-qunit':1,
                'axe': 1
            };
    nrmcore.noPkgModules =  { // AMD modules not in a pacakge
                'jquery':1, 
                'datatables':1, 
                'jquery-ui':1, 
                'jstree':1,  
                'backbone':1, 
                'underscore':1,  
                'handlebars':1, 
                'use':1,
                'proj4':1,
                'sinon':1,
                'qunit':1
            };
    nrmcore.hasAbsMid = { // modules not in a package defined with absolute module id
        'jquery':1, 
        'datatables':1,
        'proj4':1,
        'sinon':1
    };
    nrmcore.noTag = { // these modules are not pure AMD (cannot run outside a browser)
      'jquery':1, 
      'datatables':1,
      'sinon':1
   };
   nrmcore.testModules = { // test modules not in a package
       'sinon': 1,
       'qunit': 1,
       'sinon-ie': 1,
       'sinon-qunit': 1,
       'axe': 1
   };
   nrmcore.excludeLayer = {
        include: [ // let's keep this list sorted
            'dijit/a11yclick',            
            'dijit/TitlePane',
            'dijit/TooltipDialog',
            'dijit/_Templated',
            'dijit/_TemplatedMixin',
            'dijit/_Widget',
            'dijit/_WidgetBase',
            'dijit/layout/BorderContainer',
            'dijit/layout/ContentPane',
            'dijit/popup',
            'dijit/registry',
            'dojo/Deferred',
            'dojo/DeferredList',
            'dojo/Evented',
            'dojo/_base/Color',
            'dojo/_base/array',
            'dojo/_base/connect',
            'dojo/_base/declare',
            'dojo/_base/event',
            'dojo/_base/lang',
            'dojo/_base/sniff',
            'dojo/_base/unload',
            'dojo/aspect',
            'dojo/dom',
            'dojo/dom-attr',
            'dojo/dom-class',
            'dojo/dom-construct',
            'dojo/dom-style',
            'dojo/domReady',
            'dojo/fx',
            'dojo/fx/Toggler',
            'dojo/has',
            'dojo/keys',
            'dojo/on',            
            'dojo/parser',
            'dojo/text',            
            'dojox/gfx',
            'esri/Color',
            'esri/SnappingManager',
            'esri/SpatialReference',
            'esri/config',
            'esri/dijit/Measurement',
            'esri/dijit/Scalebar',
            'esri/domUtils',
            'esri/geometry/Extent',
            'esri/geometry/geodesicUtils',
            'esri/geometry/geometryEngine',
            'esri/geometry/Geometry',
            'esri/geometry/Multipoint',
            'esri/geometry/Point',
            'esri/geometry/Polygon',
            'esri/geometry/Polyline',
            'esri/geometry/ScreenPoint',
            'esri/geometry/screenUtils',
            'esri/geometry/jsonUtils',
            'esri/geometry/scaleUtils',
            'esri/geometry/webMercatorUtils',
            'esri/graphic',
            'esri/graphicsUtils',
            'esri/kernel',
            'esri/layers/ArcGISDynamicMapServiceLayer',
            'esri/layers/ArcGISImageServiceLayer',
            'esri/layers/ArcGISTiledMapServiceLayer',
            'esri/layers/FeatureLayer',
            'esri/layers/GraphicsLayer',
            'esri/map',
            'esri/OperationBase',
            'esri/renderers/SimpleRenderer',
            'esri/renderers/TemporalRenderer',
            'esri/renderers/TimeClassBreaksAger',
            'esri/renderers/UniqueValueRenderer',
            'esri/request',
            'esri/sniff',
            'esri/symbols/PictureFillSymbol',
            'esri/symbols/PictureMarkerSymbol',
            'esri/symbols/SimpleFillSymbol',
            'esri/symbols/SimpleLineSymbol',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/symbols/jsonUtils',
            'esri/tasks/FeatureSet',
            'esri/tasks/GeometryService',
            'esri/tasks/IdentifyParameters',
            'esri/tasks/IdentifyTask',
            'esri/tasks/query',
            'esri/tasks/QueryTask',
            'esri/toolbars/draw',
            'esri/toolbars/edit',
            'esri/toolbars/navigation',
            'esri/undoManager',
            'esri/units'
        ],
        discard: true
    };
    
    var nrmBasePath = "../../src/main/webapp";
    require({
        packages: [
            {
                name: "nrm-build",
                location: nrmBasePath + "/nrmcore/amd"
            },
            {
                name: "nrm-templates",
                location: nrmBasePath + "/nrmcore/nrm-templates"
            }
        ],
        paths: {
            // The "handlebars-compiler" module ID is only used during the build process, it is not required at runtime.
            'handlebars-compiler': nrmBasePath + "/nrmcore/handlebars/handlebars",
            'json2': nrmBasePath + "/nrmcore/json2/json2"
            // load nrm-templates/config from lib folder if you have added new template modules
            /*,'nrm-templates/config': nrmBasePath + "/lib/nrm-templates/config"*/
        }
    });
    
    return nrmcore.profile = {
        basePath: "../../../webapp", // relative to this file
        releaseDir: "../../../build/target/dojo",  // relative to basePath
        releaseName: "build",
        action: "release",
        layerOptimize: "closure",
        cssOptimize: true,
        optimizeOptions: { 
             languageIn: Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode.ECMASCRIPT5 
        },
        scopeMap: [["dojo", false], ["dijit", false], ["dojox", false]],
        plugins: { 
          "use" : "nrm-build/plugins/use.build",
          "nrm-templates/hbs": "nrm-build/plugins/hbs.build",
          "nrm-ui/text": "nrm-build/plugins/text.build"
        },
        discoveryProcs: ["build/discover", "nrm-build/discover"],
        transforms: {
           read: ["nrm-build/transforms/read", "read"],
           dojoReport: ["nrm-build/transforms/dojoReport", "report"]
        },
        messages: [
		// [order, numeric-id, symbolic-id, message, pacify]
		[2, 1000, "nrmHandlebarsLoad", "Handlebars compiler loaded from path:", 1],
		[2, 1001, "nrmHandlebars", "Precompiled Handlebars template implicitly mapped to module ID.", 0],
                [2, 1002, "nrmHandlebarsNotMapped", "Precompiled Handlebars template module not mapped to a module ID.", 0],
                [2, 1003, "nrmHandlebarsConfig", "Precompiled Handlebars template mapped to module ID via config.", 0],
                [2, 1004, "nrmJson2Load", "JSON2 polyfill loaded from path:", 1],
                [2, 1010, "nrmUse", "Non-AMD module transformed for Use plugin optimization.", 0],
		[2, 1100, "nrmModulesNotInLayer", "Modules not included in a layer:", 1],
                [2, 1101, "nrmExcludeModules", "Added placeholder resources for the exclude layer.", 1]
        ],
        messageCategories: {
            "info": [1000, 1200]
        },
        packages:[ 
        {
            name: "",
            location: '.'
        }, {
            "name": "doh",
            "location": "../../../dojo-sdk/util/doh" 
        }],
        paths: {
            // Redirect to the Handlebars runtime version for optimized build
            'handlebars': 'nrmcore/handlebars/handlebars.runtime',
            'dojo/dojo': 'nrmcore/amd/dojo/dojo'
        },
        dirs: [
            [ 'css', 'css' ],
            [ 'nrmcore/bootstrap/css', 'css/temp', /\.min\.css$/ ],
            [ 'nrmcore/bootstrap-datepicker-3x/css', 'css/temp' ],
            [ 'nrmcore/bootstrap/fonts', 'css/fonts' ],
            [ 'nrmcore/jquery-datatables/images', 'css/datatables/images'],
            [ 'nrmcore/jstree-3.0/themes/default', 'css/jstree', /\.min\.css$/],
            [ 'nrmcore/nrm-map/images', 'css/nrm-map/images'],
            [ 'nrmcore/nrm-ui/css', 'css/temp'],
            [ 'nrmcore/nrm-ui/img', 'css/img'],
            [ 'nrmcore/select2', 'css/select2', /(\.json$)|(\.js$)|(\.sh$)|(\.md$)|(LICENSE$)/],
            [ 'nrmcore/font-awesome/fonts', 'css/font-awesome/fonts' ]
        ],
        files: [
            [ 'nrmcore/jquery-datatables/css/DT_bootstrap.css', 'css/datatables/temp/DT_bootstrap.css'],
            [ 'nrmcore/jquery-datatables/css/jquery.dataTables.css', 'css/datatables/temp/jquery.dataTables.css'],
            [ 'nrmcore/layout/layout-default-latest.css', 'css/temp/layout-default-latest.css'],
            [ 'nrmcore/nrm-map/nrmMap.css', 'css/nrm-map/nrmMap.css'],
            [ 'nrmcore/pnotify/jquery.pnotify.default.css', 'css/temp/jquery.pnotify.default.css'],
            [ 'nrmcore/nrm-ui/css/nrm-shuttle.css', 'css/temp/nrm-shuttle.css'],
            [ 'Rules.txt', 'root/Rules.txt' ],
            [ 'api.html', 'root/api.html' ],
            [ 'index.html', 'root/index.html' ],
            [ 'tests.html', 'root/tests.html' ],
            [ 'nrmcore/qunit/qunit.css', 'root/nrmcore/qunit/qunit.css'],
            [ 'nrmcore/nrm-ui/logincheck.html', 'root/nrmcore/nrm-ui/logincheck.html'],
            [ 'nrmcore/font-awesome/css/font-awesome.css', 'css/font-awesome/temp/font-awesome.css']
        ],
         // define resourceTags if any of paths/dirs/files patterns match a .js file (not recommended).
         resourceTags: {
            copyOnly: function(filename) { return /\.js$/.test(filename); },
            test: function(filename) { return /\/tests\.html$|\/qunit\.css$/.test(filename); }
         },
         jsdocFilename: "../jsdoc.json",
         appcacheDefaults: {
            //generate: true, // this needs to be set in "appcache" config in dojo/profile.js
            filename: 'root/mobile/mobile.appcache', 
            //includeTest: false, // set to true to include test modules (not recommended for production)
            include: [
                'css/font-awesome/fonts/fontawesome-webfont.woff2?v=4.6.3',
                'css/font-awesome/fonts/fontawesome-webfont.woff?v=4.6.3',
                'nrmcore/img/NRM-logo-square-transp50.png',
                'config.js',
                'utils/SvnRev.txt'
                //,'utils/NrmCoreRev.txt'
            ],
            exclude: [
                // non-package resources are relative to root
                'api.html',
                'index.html',
                'nrmcore/nrm-ui/logincheck.html',
                'mobileauth.html', // special case, relative to mobile folder
                // package resource paths resolved based on package location
                'nrm-map/proxy.config',
                'nrm-map/dijit/templates/tocNode.html',
                'nrm-map/shapefileloader/readme.txt'
            ], 
            spatial: {// only if the application is spatial. 
                esriBasePath: '', // use / for offsite, blank for onsite
                include: [
                    // paths are resolved based on package location
                    // this list is NOT the same as the excludeLayer.include array
                    //start jsapi 3.18 and measurement
//                    'nrm-map/images/pan-cursor.cur',
//                    'nrm-map/images/reshape.png',
//                    'nrm-map/images/select.png',
//                    'nrm-map/images/select-cursor.cur',
                    'esri/nls/jsapi_ROOT.js',
                    'esri/layers/VectorTileLayerImpl.js',
                    'dojox/gfx/filters.js',
                    'dojox/gfx/svgext.js',
                    'dojo/cldr/nls/en/number.js',
                    'dojo/cldr/nls/en/gregorian.js',
                    'esri/toolbars/draw.js',
                    'esri/layers/ArcGISImageServiceLayer.js',
                    'esri/tasks/IdentifyParameters.js',
                    'esri/tasks/IdentifyResult.js',
                    'esri/tasks/IdentifyTask.js',
                    'esri/dijit/Measurement.js',
                    'esri/toolbars/_toolbar.js',
                    'esri/dijit/images/Measure_Area16.png',
                    'esri/dijit/images/Measure_Distance16.png',
                    'esri/dijit/images/Measure_Point16.png',
                    'dijit/themes/claro/form/images/buttonArrows.png',
                    'esri/dijit/images/cursor16x24.png',
                    'esri/dijit/images/esriGreenPin16x26.png',
                    'esri/dijit/images/button-hover.png',
                    'esri/dijit/images/button-active.png',
                    //end 3.18
                    'dijit/themes/claro/claro.css',
                    'esri/css/esri.css',
                    'dijit/_Contained.js',
                    'dijit/_KeyNavContainer.js',
                    'dijit/_KeyNavMixin.js',
                    'dijit/_MenuBase.js',
                    'dijit/DropDownMenu.js',
                    'dijit/form/HorizontalSlider.js',
                    'dijit/Menu.js',
                    'dijit/MenuItem.js',
                    'dojo/DeferredList.js',
                    'dojo/dnd/move.js',
                    'dojo/resources/blank.gif',
                    'dojox/gfx/canvas.js',
                    'dojox/gfx/Moveable.js',
                    'dojox/gfx/Mover.js',
                    'dojox/gfx/svg.js',
                    'esri/dijit/images/ajax-loader.gif',
                    'esri/dijit/images/popup.png',
                    'esri/dijit/Scalebar.js',
                    'esri/layers/FeatureEditResult.js',
                    'esri/layers/FeatureLayer.js',
                    'esri/layers/FeatureTemplate.js',
                    'esri/layers/FeatureType.js',
                    'esri/layers/GridLayout.js',
                    'esri/layers/OnDemandMode.js',
                    'esri/layers/RenderMode.js',
                    'esri/layers/SelectionMode.js',
                    'esri/layers/SnapshotMode.js',
                    'esri/layers/TrackManager.js',
                    'esri/OperationBase.js', //Test
                    'esri/tasks/LegendLayer.js',
                    'esri/tasks/PrintParameters.js',
                    'esri/tasks/PrintTask.js',
                    'esri/tasks/PrintTemplate.js',
                    'esri/toolbars/_Box.js',
                    'esri/toolbars/_GraphicMover.js',
                    'esri/toolbars/_VertexEditor.js',
                    'esri/toolbars/_VertexMover.js',
                    'esri/toolbars/edit.js',
                    'esri/toolbars/TextEditor.js',
                    'esri/undoManager.js' //Test
                ]
            }
        }
    };
})();