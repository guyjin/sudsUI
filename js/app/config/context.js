/** 
* Context configuration module for Demo app.
* The "context" object configures the tree view and search behavior, also can provide view config objects.
* Nrm.Application will use this information to automate loading of models/collections/views by name 
* when certain events are triggered.
*
*   Anywhere a model attribute name is specified, the string can represent a function name defined on the model.
*   If this is the case, and the attribute is not defined in the model attributes,
*   the function will be called in place of model.get as in: model["attrName"].call(model)
*   Likewise, the function will be called in place model.set if the name is found in a "setFunctions" array defined on the model.
*   The setter function will be called as: model["attrName"].call(model, newValue)
*   
* @module app/config/context
*/
define([
    'underscore', 
    // './myTasks',
    // './messages',
    './proposal',
    './stepTest',
    './workflowTest',
    './staticTemplates',
    './contactsManagement',
    // './process',
    // './application',
    // './authorization',
    // './bills',
//    './projectArea', 
//    './subUnit', 
//    './activity', 
//    './trustfund/sale', 
    './lov'
], function(_,
    //myTasks,
    // messages,
    proposals,
    stepTest,
    workflowTest,
    staticTemplates,
    contactsManagement,

    // process,
    // application,
    // authorization,
    // bills,
    //projectArea, subUnit, activity, sale,
    lov) {
    // topLevel context objects must be loaded synchronously to support modification for mobileApp config
    var topLevelDefaults = {
        topLevel: true
    };

    return _.extend({ // Order here determines the order in the actual tree
        //activity: _.defaults(activity, topLevelDefaults),
        //myTasks: _.defaults(myTasks, topLevelDefaults),
        // messages: _.defaults(messages, topLevelDefaults),
        proposals: _.defaults(proposals, topLevelDefaults),
        stepTest: _.defaults(stepTest, topLevelDefaults),
        workflowTest: _.defaults(workflowTest, topLevelDefaults),
        staticTemplates : _.defaults(staticTemplates, topLevelDefaults),
        contacts : _.defaults(contactsManagement, {
            topLevel: false
        }),
        // process: _.defaults(process, topLevelDefaults)
        // application: _.defaults(application, topLevelDefaults),
        // authorization: _.defaults(authorization, topLevelDefaults),
        // bills: _.defaults(bills, topLevelDefaults)
    }, lov);
});
