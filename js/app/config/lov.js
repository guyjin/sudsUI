/** 
 * Context configuration for LOVs in the Demo app. Includes defaults for each "lov/{type}" context.
 * @module app/config/lov
 */
define(['underscore'], function(_) {
    
    var lov = {
            modules: {
                collection: 'nrm-ui/collections/graphCollection'
            },
            lovDefaults: {
                // default options for all lov/{type} context objects...
                loadType: 'auto',
                nameAttr: 'code',
                noObjectStore: true
            },
            lovTypes: { 
                // each of these types will be added as separate context keys with defaults applied
//                activityCode: {
//                    alias: 'Activity Code',
//                    schema: {
//                        resourceTypeFk: {
//                            refType: "lov/resourceType"
//                        }
//                    }                    
//                },
//                resourceType: {
//                    alias: 'Resource Type',
//                    schema: {
//                        activityCodes: {
//                            refType: "lov/activityCode"
//                        }
//                    }
//                },
                editableUnit: {
                    alias: 'Editable Unit',
                    nameAttr: 'id'
                },
                proponentTypes: {
                    idAttr: "proponentTypeCn",
                    alias: 'Proponent Type',
                    nameAttr: 'name'
                },allowedFileTypes: {
                    idAttr: "fileTypeCn",
                    alias: 'Allowed File Type',
                    nameAttr: 'fileExtension'
                },
                crActivityTypes: {
                    idAttr: "crActivityTypeCn",
                    alias: 'Specialist Role',
                    nameAttr: 'name'
                },
                attachmentCatLabels: {
                    //idAttr: "attachmentCategoryCn",
                    idAttr: "code",
                    alias: 'Attachment Labels',
                    nameAttr: 'name'
                },

                closureReasons: {
                    idAttr: "closureReasonCn",
                    alias: 'Closure Reason',
                    nameAttr: 'name'
                },

                jobPositionTitles: {
                    //idAttr: "attachmentCategoryCn",
                    idAttr: "jobTitleCn",
                    alias: 'Job Position title',
                    nameAttr: 'name'
                },

                nepaCategories: {
                    idAttr: "nepaCategoryCn",
                    alias: 'Nepa Label',
                    nameAttr: 'name'
                },

                states: {
                    modules: {
                        collection: 'app/collections/stateCollection'
                    },
                    nameAttr: 'STATENAME',
                    alias: 'State'
                },

                counties: {
                    modules: {
                        collection: 'app/collections/countyCollection'
                    },
                    nameAttr: 'COUNTYNAME',
                    alias: 'County',
                    caption: 'Counties',
                    groupAttr : 'STATENAME'
                },

                forests: {
                    modules: {
                        collection: 'app/collections/forestCollection'
                    },
                    nameAttr: 'FORESTNAME',
                    alias: 'Admin Forest'
                },

                crAdjustmentTypes: {
                    idAttr: "costRecAdjustTypeCn",
                    alias: 'CR Activity Type',
                    nameAttr: 'name'
                },

                countries: {
                    idAttr: "countryCn",
                    alias: 'Country',
                    nameAttr: 'name'
                },

                countryRegions: {
                    idAttr: "countryRegionCn",
                    alias: 'Country Region',
                    nameAttr: 'name'
                },

                orgRolePhoneNumberTypes: {
                    idAttr: "orgRolePhoneNbrTypeCn",
                    alias: 'Phone Number Type',
                    nameAttr: 'name'
                },

                orgRoleAddressTypes: {
                    idAttr: "orgRoleAddressTypeCn",
                    alias: 'Address Type',
                    nameAttr: 'name'
                },

                processingStatus: {
                    caption: 'Processing Statuses',
                    alias: 'Processing Status', // Displayed during error (ex. if LOV fails to load) or caption (in nav tree)
                    sortAttr: 'displayOrder' // override default sort by nameAttr
                }
//                subunitStage: {
//                    alias: 'Subunit Type' // Displayed during error (ex. if LOV fails to load) or caption (in nav tree)
//                }

            }
        }, 
        lovContext = {
            lov: lov
        };
    _.each(lov.lovTypes, function(lovType, key) {

        var ctx = lovContext['lov/' + key] = _.defaults(lovType, lov.lovDefaults);
        if (!ctx.caption && ctx.alias) {
            // default caption is plural of alias, only needs to be overriden if the plural pattern is not alias + 's'
            ctx.caption = ctx.alias + 's';
        }
    });
    
    return lovContext;
});