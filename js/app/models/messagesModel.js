/**
 * @file
 * @see module:app/models/common/specialUse
 */
define(['..', 'nrm-ui/models/businessObject', 'underscore'],
    function(Suds, BusinessObject, _) {
        return Suds.Models.Messages = BusinessObject.extend(/** @lends module:app/models/common/specialUse.prototype */{
            //idAttribute: "specialUseCn", // if we don't want to use the default idAttribute which is "id"

            urlRoot: "api/sudsIntroPath",
            idAttribute: 'introCN'
        })
    });