define(['./process'], function(process) {
    return {
        "modules": {
            // "model": "app/models/specialUseTask",
            // non-generic collections are not always needed, but in this case we had to implement a comparator function
            "collection": "app/collections/specialUseTaskCollection", 
            "editor": "app/views/specialUseTaskView"
    //        "search": "app/views/projectSearchView"
        },
        "caption": "My SUDS Greetings", // folder node label (also used other places, e.g. generic quick search title, error messages)
        "alias": "My SUDS Greeting", // user-friendly display name, also model name with any non-word characters removed if "modelName" not specified.
        "topLevel": true, // show at the top level in the tree
        "nameAttr": "helloMessage", // model attribute name to use for tree node label
        "loadType": "auto", // load automatically instead of waiting for a search
        "loadRules": true,
        "groupAttr": "stage", // nodes will be grouped into folders derived from distinct valu   es of this model attribute
        // note that the generic comparator (sortAttr) didn't work in this case due to the issues described in artf65357
        //"sortAttr": ["stageIndex","priorityIndex","name"], // sort attributes, if using a generic collection.
        //"idAttr": "itemCn", // if using a generated model with id attribute other than "id"
        //"defaults": { }, // if using a generated model, this will be used as model.defaults

        "shapeAttr": "proposalShape", // model attribute for the geometry
        //"symbol" : { }, // defines the symbology for search results displayed in the map 
        "symbol": {
            "marker": {
                "style": "STYLE_DIAMOND",
                "size": 8,
                "line": { 
                    "style" : "STYLE_SOLID",
                    "color": [0, 0, 0],
                    "thickness": 1
                },
                "color": "#E7B0F5"
            },
            "line": {
                "style": "STYLE_SOLID",
                "color": "#E7B0F5", 
                "thickness": 2
            },
            "fill": {
                "style": "STYLE_SOLID",
                "color": [231, 176, 245, 0.67],
                "line": {
                    "style": "STYLE_SOLID",
                    "color": [96, 96, 96], 
                    "thickness": 1
                }
            }
        },
        /*
         * Node type customization:
         * The "nodetype" option can be used in two ways: 
         *   (1) specify "folder" to load this collection as a set of individual folders, 
         *       instead of the usual behavior where the collection is loaded as a set of nodes within a folder.
         *   (2) specify a custom type for non-spatial nodes, the type config for the custom type
         *       should be included in "nodetypes" option mentioned above.
         *   
         * The "subtype" option can be used to define a model attribute used to assign the node type.
         * Expected values should be included in "nodetypes" option.
         * 
         * The "typemap" option can be used to identify a list of subtype values to 
         * populate a submenu for the New Item menu item in the context menu.
         * The value can be an array if the subtype values are suitable for display in the menu,
         * or like the example below it can be an object that maps subtype attribute values to display values.
         */
        "nodetype": "No Priority", // default node type, used when priorityStatus returns empty string
        "subtype": "priorityStatus", // determines the node type, see nodetypes option in config/main.js
        //"typemap": { "type1": "Type 1", "type2": "Type 2" } 

        /*
         * Custom context menu items, format similar to "items" array in the "navActions" example above.
         * Additional filtering options are supported: 
         *     "override" - overrides default behavior if the id of the item matches one of the default menu items.
         *     "enable" - normally don't specify this, unless overriding a default item to make it always on or always off.
         *     "enableNew" - include the item on a "New" item node 
         *     "enableGroups" - include the item on a group folder node, either true or an array of groupAttr values for which this item is valid.
         *          All menu items are excluded on the group folder node by default unless this option is set.
         *     "enableEditable" - if this is set to true, only include the item on editable nodes. 
         *          For a folder node, editable is resolved based on the parent model.
         *          Editable status is determined by looking for model attribute or function named "editable" 
         *          which should evaluate to a boolean (model is assumed to be editable if the attribute or 
         *          function return value is undefined).
         *     "enableSpatial" - dynamically enable this item only on a node that has geometry
         * Can also be a function which is passed in a variety of options and should return an array of custom items.
         * 
         */
        "contextItems": [
            {
                id: 'specialUseTask-refresh',
                label: 'Refresh',
                // the href defines the route which should be mapped to an event in the "routes" property in config/main.js
                href: '#refreshTasks', 
                className: 'nrm-route-action', // prevent updating the URL in the address bar
                generateHref: false, //do not add the node path to the href
                nodetypes: ['folder'] // show only on the folder node
            }
        ], 
        "disableNew": true, // disable the "New My Task" default menu item 

        // search configuration options...
        //
        "postSearch": true, // indicates search data should be sent as POST instead of GET with query params.
        /*
         * set searchUrlSuffix to override default "/search" suffix for quick search, 
         *  e.g. api/myBusinessArea/mysearch instead of api/myBusinessArea/search
         */
        //"searchUrlSuffix": "/mysearch",
        "search": false, // disables search
    //    {
    //        // each item can be a config object instead of boolean to use configurable view
    //        "basic": true, // enables Quick Search
    //        "advanced": true // enables Advanced Search menu item
    //                //"spatial": true // enables Select in Map menu item
    //                // ... or... "spatial" : { "searchSuffix": "/spatial" } to override default suffix
    //    },
        //"searchResults": true // enables display of results grid, or...
        "searchResults": {
            //"columns": [ "helloMessage" ] // columns to display in grid, can also be a config object for each column
            "columns": [ // columns to display in grid, can also be a config object for each column
                //"stage",
                //"name",
                {
                    prop: "helloMessage",
                    label: "Message"
                }
                //,"statusDate"
            ]
        }
        // the "myTasks" context shares the schema configuration from "process" context for now
        , "schema": process.schema
        /* 
         * The "editor" config can contain a list of controls and other view config options that can be used
         * in Nrm.Views.EditorView to render as a configurable view.
         * Can be defined here or specify a "url" option to load asynchronously the first time the view renders.
         * See below for more details about async config loading (comment about partially loaded context object).
         */
        //, "editor": { }
    }
});            