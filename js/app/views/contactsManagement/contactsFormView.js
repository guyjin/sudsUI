define(['nrm-ui/views/panelView', "jquery", "nrm-ui","app/views/contactsManagement/contactsManagementPanelView"], function(PanelView, $, Nrm,ContactsManagementPanelView) {

    return ContactsManagementPanelView.extend({

        genericTemplate: "contacts/contactSearchForm",

        getConfig: function() {
            var config = ContactsManagementPanelView.prototype.getConfig.apply(this, arguments);

            config.controls = this.getContactContentSectionControls();

            return config;

        },

        events: $.extend({}, ContactsManagementPanelView.prototype.events, ContactsManagementPanelView.prototype.changeEvents, {
            'click .searchBtn' : "loadSearchResults",
            'click .addNewContactBtn' : "loadContactTypeScreen"

        }),



        getContactContentSectionControls : function () {},



        getContactSearchResultsTableControl: function () {

            var tableControl = {

                "type": "tableEdit",
                "id": "searchResultsTable",
                className: 'searchResultsTable',
                "prop" :'searchResults' ,
                /* "hasResults": this.searchResults && this.searchResults.size() > 0,
                 "value": this.searchResults,*/
                "columns": [
                    {
                        "prop": "name",
                        "label": "Name",
                        className: 'selectContactLink',
                        /*"pluginOpts": {
                         "sWidth": "110px"
                         }*/
                    },
                    {
                        "prop": "companyName",
                        "label": "Business Name",


                    },
                    {
                        "prop": "phoneNumber",
                        "label": "Phone Number",

                    },
                    {
                        "prop": "address",
                        "label": "Address",

                    },
                    {
                        "control": {
                            type: 'costRecovery/cr_worksheetEntriesTableCtrls',
                            "id": "rate",
                            controls :[{
                                "title": "Edit",
                                type:'btn',
                                btnStyle:"primary",
                                "className": "btn-sm nrm-route-action editEntry",
                                "icon": "fa fa-edit",
                                "label" :'Edit',
                                "id": "editEntry-row"
                            },{
                                "title": "Remove",
                                type:'btn',
                                btnStyle:"danger",
                                "className": "btn-sm nrm-route-action removeEntry",
                                "icon": "fa fa-times",
                                "label" :'Remove',
                                "id": "removeEntry-row"
                            }]
                        },
                        "pluginOpts": {
                            "sWidth": "500px"
                        }
                    },
                ],
                "pluginOpts": {
                    "multiSelect": false,
                    "readOnly": true,
                    "searching": true,
                    "paging": false
                },
                "rowActions": [{
                    "title": "Add Contact",
                    type: 'btn',
                    btnStyle: "default",
                    "className": "btn-xs nrm-route-action addContact",
                    "icon": "glyphicon glyphicon-plus",
                    "label": 'Add',
                    "id": "addContact-row"
                }],
                "actions": []
            }

            return tableControl;
        },


    });
});