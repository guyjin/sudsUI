define(['../../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/models/getTableRecordByAuthAndProp','app/collections/contactsCollection'], function (PanelView, $, Nrm, _, GetTableRecordByAuthCnAndProp,ContactCollection) {
    return PanelView.extend({

        genericTemplate : "addContactsToProposal/summary",
        events: {}, //We need this because PanelView is missing elements normally present in the EditorView

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);
           var authorization  = this.model.toJSON(),
               property = "authorizationContactsTbls";

            config.controls = [];

            var getTableRecordByAuthAndChildId = new GetTableRecordByAuthCnAndProp({
                    authCn :authorization.authorizationCn,
                    property : property
                });

            var dfd = new $.Deferred();

            getTableRecordByAuthAndChildId.fetch({
                success: _.bind(function (model, resp, options) {

                    if (resp && resp.length){
                        this.model.set(property,resp)
                    }

                config.controls = [/*{
                    id: 'assignedContacts',
                    type: 'addContactsToProposal/contactsList',
                    items: [this.getContactListTableControl()]
                }*/this.getContactListTableControl()]

                    dfd.resolve(config);
                }, this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            });

            return dfd.promise(config);
        },

        render: function () {
            $('.alert').fadeOut();
            $('.contacts').fadeIn();
            PanelView.prototype.render.apply(this, arguments);
            return this;
        },

        getContactListTableControl: function (config) {

            var addedContacts = this.model.get('authorizationContactsTbls');
            //currentStep  = config.currentStep;
            if (addedContacts) {
                this.model.set("authorizationContactsTbls", new ContactCollection(addedContacts));
            } else {
                this.model.set("authorizationContactsTbls", new ContactCollection());
            }


            var tableControl = {

                "type": "tableEdit",
                "id": "contactsTable",
                "prop": 'authorizationContactsTbls',
                /*"hasResults" : this.addedContacts && this.addedContacts.size() > 0,
                 "value" : this.addedContacts,*/
                "columns": [
                    {
                        "prop": 'name',
                        "label": "Name",
                        className: 'selectContactLink',
                        "pluginOpts": {
                            "sWidth": "110px"
                        }
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
                    }
                ],
                "pluginOpts": {
                    "multiSelect": false,
                    "readOnly": true,
                    "searching": true,
                    "paging": false
                },
                "rowActions": [],
                "actions": []
            }

            return tableControl;
        },

    });
});