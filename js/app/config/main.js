define(['./context', 'require'], function (context, require) {
    return {
        "appName": "SUDS", // title in navbar
        "namespace": "Suds", // should match the name of { Models: {}, Collections: {}, Views: {} } object created in app/main
        "helpUrl": "http://fsweb.nrm.fs.fed.us/support/index.php", // url for User Guide menu item
        //"singlePanel": true, // disables the NrmLayout plugin (this is an option for non-spatial only)
        //"mobileApp"; true, // enables certain functionality tailored to mobile apps
        //"layout" : { westPane: false }, // options to pass to NrmLayout plugin, this example disables the west pane
        /*
         * For spatial apps...*/
         "enableMap": true,
         "map" : {
            // all options defined here will be passed to the MapView constructor options.
            id: "map-container",
            z: 4, // default zoom level
            tocExpanded: false,
            layers: [
                // include a selection of basemap layers at minimum...
                {
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer',
                    tiled: true,
                    visible: false,
                    layerOptions: {
                        resampling: false,
                        resamplingTolerance: 0
                    }
                },
                {
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
                    visible: false,
                    tiled: true
                },
                {
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                    visible: false,
                    tiled: true
                },
                {
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
                    tiled: true
                }
            ]
        },
        /*
            override default state of the map pane and start up with it closed.
              Setting State Management to false will stop the layout plugin from storing the state in a cookie which should allow us
              to startup with the map closed regardless of the state of the app when the user was last in it.
        */

        layout: {
            stateManagement__enabled: false,
            center__childOptions: {
                initClosed: true
            }
        },
        /* 
         * If "tools" config is specified, a Tools accordion will be rendered with the provided template.
         * The "panelData" object will be passed to the template.
         */
        "tools": {
            "template": "tools",
            "panelData": {
                "links": [
                    {
                        "id": "tools-contactManagement",
                        "label": "Contacts Management",
                        "href": "#/tools/search/contacts",
                    },
                    /*{
                        "id": "tools-billTransmittalStatus",
                        "label": "Bill Transmittal Status",
                        "href": "#",                        
                    },
                    {
                        "id": "tools-viewBillsAndReceipts",
                        "label": "View Bills and Receipts",
                        "href": "#",                        
                    },
                    {
                        "id": "tools-AutoCalulationOfRents",
                        "label": "Auto Calculation of Rents",
                        "href": "#",                        
                    }*/
                ]
            }
        },
        /*
         * "navActions" is an example of config object used in core "dropdown" template.
         */
//        "navActions": [{
//                "id": "navMenuConfig",
//                "label": "Custom Menu",
//                "items": [{
//                        "id": "navMenuConfig-example",
//                        "label": "Do Something",
//                        // Add nrm-route-action class to an anchor element to automatically trigger a route without updating browser history.
//                        // This is more commonly useful than one might think (e.g. zoom to item in map, open a modal view).
//                        "className": "nrm-route-action",
//                        "href": "#example/You%20Clicked%20Me"
//                                //, "group" : true //adds a divider above this item
//                                //, "header" : "Header Text" //adds a header above this item
//                                //, "items" : [ ] // render submenus recursively
//                    }]
//            }],
        // Use the routes hash to map a Backbone route to event triggered on Nrm.event.
        // A route that ends with /*path will be translated to a model or collection by navigating the "context" object provided below.
        // 
        "routes": {
            //"example/:option": "app:example"
            "tools/:action/*path" : "suds:load-tools-view",
            "tools/:option1/:option2/*path" : "suds:load-tools-view",
            "tools/:option1/:option2/:option3/*path" : "suds:load-tools-view",//Todo: remove three routes and just keep one route with #tools/contacts/*
            "AOLevelScreening": "suds:ao-level-test",
            "GIS": "suds:suds-gis-test",
            "customUrl/:id" : "suds:custom-view",
            "setHomeOrg": "app:setHomeOrg",
            "step/:StepId/create/*path" : "context:beginCreate",
            "step/:StepId/edit/*path" : "suds:edit",
            "refreshTasks": "suds:refreshTasks" // Refresh menu item, see contextItems in config/myTasks.js

        },
        //"defaultSearch": "myBusinessArea", // identifies which root node and search panel to show by default
        // preload: ['lov/processingStatus'], // list of LOV context keys to preload before tree loads
        "nodetypes": {
            // set images for the "subtype" attribute values expected from the "myTasks" context configuration.
            "Needs Attention": {
                icon: require.toUrl('img/page_white_error.png')
            }, 
            "Past Due": {
                icon: require.toUrl('img/page_white_delete.png')
            }, 
            "No Priority": {
                icon: require.toUrl('img/page.png')
            }
        }, // extends the default node types passed to the jsTree plugin

        /*
         * The "userInfoUrl" if specified should be a REST API endpoint that returns user info in a standard format.
         *  See this document: http://sforge.fs.fed.us/sf/go/doc32160?nav=1 for more information.
         * Note that we should replace the app/data/user.json value with the commented out "api/user" when switching 
         * from the LocalDB prototype to actual REST API implementation.
         */
         //"userInfoUrl": require.toUrl("app/data/user.json"), //"api/user", // enables the User dropdown menu on navbar with logout menu item
        "userInfoUrl": require.toUrl("api/user"), //"api/user", // enables the User dropdown menu on navbar with logout menu item

        "context": context
    };
});
