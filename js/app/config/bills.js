define({
//    "modules": {
//        "editor": "app/views/projectAreaView",
//        "search": "app/views/projectSearchView"
//    },
    "caption": "Special Use Bills", // folder node label (also used other places, e.g. generic quick search title, error messages)
    "alias": "Bill", // user-friendly display name, also model name with any non-word characters removed if "modelName" not specified.
    "topLevel": true, // show at the top level in the tree
    "nameAttr": "name", // model attribute name to use for tree node label   
    "loadRules": true,
    //"groupAttr": "category", // nodes will be grouped into folders derived from distinct values of this model attribute

    //"idAttr": "itemCn", // if using a generated model with id attribute other than "id"
    //"defaults": { }, // if using a generated model, this will be used as model.defaults

    //"shapeAttr": "shape", // model attribute for the geometry
    //"symbol" : { }, // defines the symbology for search results displayed in the map 
//    "symbol": {
//        "line": {
//            "style": "STYLE_SOLID",
//            "color": "#33FF00", 
//            "thickness": 1
//        },
//        "fill": {
//            "style": "STYLE_SOLID",
//            "color": [51, 255, 0, 0.33]
//        }
//    },
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
    //"nodetype": "customtype", 
    //"subtype": "subtypeName", 
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
    //"contextItems": [], 
    //"disableNew": true, // shortcut for disabling the "New {Item}" context menu item

    // search configuration options...
    //
    "postSearch": true, // indicates search data should be sent as POST instead of GET with query params.
    /*
     * set searchUrlSuffix to override default "/search" suffix for quick search, 
     *  e.g. api/myBusinessArea/mysearch instead of api/myBusinessArea/search
     */
    //"searchUrlSuffix": "/mysearch",
    "search": {
        // each item can be a config object instead of boolean to use configurable view
        "basic": true, // enables Quick Search
        "advanced": true // enables Advanced Search menu item
                //"spatial": true // enables Select in Map menu item
                // ... or... "spatial" : { "searchSuffix": "/spatial" } to override default suffix
    },
    //"searchResults": true // enables display of results grid
    "searchResults": { 
        "columns": [ "name" ] // colums to display in grid, can also be a config object for each column
    }

    /* 
             * ... or searchResults can also be a config object for configurable view:
             "searchResults": { 
             "columns": [ "name", "col1", "col2" ], // colums to display in grid, can also be a config object for each column
             "actions": { } // override default actions
             }
             */
            /*
             * The "schema" object contains additional info about model attributes.
             * Examples include specifying expected geometry types that can be passed to nrmShapeEditor plugin, 
             * formatting special data types (like "date" or "datetime") in Nrm.Application.formatValue,
             * information about loading child nodes or inheriting attributes from a parent model, etc.
             * If using configurable views, schema objects for each property can include control config
             * properties that will be inherited (and possibly overriden) by the control config.
             */
            , "schema": {
                "name": {
                    "label": "Name"
                }
//                "securityId": {
//                    "label": "Admin Unit"
//                },
//                "projectAreaType": {
//                    "label": "Project Area Type"
//                },
//                 /*
//                "shape" : {
//                 "spatialTypes": ["point", "line", "polygon"]
//                 },
//                 "startDate" : {
//                 "dataType" : "date" // base views can use this to format sortable dates
//                 },*/
//                "shape" : {
//                 "spatialTypes": ["polygon"]
//                 },
//                "activities": {
//                    "refType": "activity", // refType is a lookup value to find the root context object
//                    "navigate": true,
//                    "context" : {
//                        "contextItems": [
//                            {
//                                id: "projectarea-add-activity",
//                                label: "Add existing activity",
//                                href: "#add",
//                                "nodetypes" : [ "folder" ] // There are several possible types here
//                            },
//                            {
//                                id: "projectarea-remove-activity",
//                                label: "Remove activity from project area",
//                                href: "#remove",
//                                enableFolder: false, // By default this would normally appear under the folder and node.
//                                className: "nrm-route-action" // This allows us to trigger an action without navigating the route
//                            }                    
//                        ],
//                        //"caption": "Unmapped Activities"
//                        "loadType": "auto",
//                        "search": {
//                           "basic": false, // enables Quick Search
//                           "advanced": false // enables Advanced Search menu item                     
//                        }
//                    } // can override options inherited from the root context object (this is a shallow extend!)
//                },
//                "nepaDocNbr": {
//                        "label": "NEPA Doc Nbr"
//                },
//                "nepaDocName": {
//                        "label": "NEPA Doc Name"
//                },
//                "examNumber": {
//                        "label": "Exam Number"
//                },
//                "saleOrg": {
//                        "label": "Sale Org"
//                },
//                "saleNumber": {
//                        "label": "Sale Number"
//                },
//                "saleName": {
//                        "label": "Sale Name"
//                },
//                "saleCategory": {
//                        "label": "Sale Category"
//                },
//                "cuttingUnit": {
//                        "label": "Cutting Unit"
//                }
            }
    /* 
     * The "editor" config can contain a list of controls and other view config options that can be used
     * in Nrm.Views.EditorView to render as a configurable view.
     * Can be defined here or specify a "url" option to load asynchronously the first time the view renders.
     * See below for more details about async config loading (comment about partially loaded context object).
     */
    //, "editor": { }
});            