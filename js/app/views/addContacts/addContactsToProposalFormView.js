define(['../panelView', "jquery", "nrm-ui", 'underscore',
    '../../collections/contactsCollection',
        'app/models/getCnForLookupTableRecord','app/models/getTableRecordByAuthAndProp','app/models/removeContactsModel'],
    function (PanelView, $, Nrm, _, ContactCollection, GetCnForLookupTableRecord,GetTableRecordByAuthCnAndProp, RemoveContactsModel) {

    return PanelView.extend({

        genericTemplate: 'common/ctrlsIterator',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            var getCnForLookupTableRecord = new GetCnForLookupTableRecord({id:"contactRoleForProponent"}),
                dfd = new $.Deferred(),
                authorization = this.model.toJSON(),
                property = "authorizationContactsTbls";

            // config.currentStep = this.model.toJSON();
            var getTableRecordByAuthAndChildId = new GetTableRecordByAuthCnAndProp({
                authCn :authorization.authorizationCn,
                property : property
            });
            this.model.set("currentSectionId", "Contacts");
            this.model.set("currentSectionStatus", "Complete");
            this.model.set("nextStepId",this.model.get("caseFileId"));


            var tabNames = ['New Proposal', 'Contacts']

            getCnForLookupTableRecord.fetch({
                success: _.bind(function (model, resp, options) {
                    this.model.set("authorizationContactRole",resp);

                    this.searchResults = new ContactCollection();

                    getTableRecordByAuthAndChildId.fetch({
                        success: _.bind(function (model, resp, options) {
                            if (resp && resp.length){
                                this.model.set(property,resp)
                                this.showAssignedContactsTbl = true;
                            }

                            config.controls = [
                                {
                                    type:'common/soloTabSummaryHeader',
                                    screenName : {
                                        tabNames : tabNames
                                    }
                                },{
                                    type:'common/screenContentControls',
                                    controls : this.getScreenContentControls(),
                                }
                            ]
                            dfd.resolve(config);
                        }, this),
                        error: function (model, resp, options) {

                            dfd.reject(model, resp, options);
                        }
                    });


                }, this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            });



            $.when(dfd.promise()).done(function (model, resp, options) {
              console.log("thise is eexecuted when promised i")
            }).fail(function (param1) {

            })


            console.log("some code executed")

            return dfd.promise();
        },

        events: {
            'click .addContact': 'addContactToProposal',
            'click .removeContact': 'removeContactsFromProposal',
            'click .contactSearchSubmit': 'searchContacts',
            'click .contactSearchReset': function (event) {
                event.preventDefault();
                $("#contactSearchField", this.$el).val('');
            }
            //... other custom events go here...
        },

        getScreenContentControls: function () {

            var controls = [];

            controls[0] = this.getAssignedContactsControl();

            return controls;
        },

        getAssignedContactsControl: function () {

            var assignedContactControls = {
                id: 'assignedContactContainer',
                tabHeading: 'Contacts',
                type: 'common/tabHeadingAndSection',
                sectionWrap: false,
                items: [
                    {
                        id: 'assignedContacts',
                        sectionLabel: 'Assigned Contacts',
                        fullSection: true,
                        type: 'addContactsToProposal/contactsList',
                        items: [this.getContactListTableControl()]
                    },
                    {
                        id: 'contactSearchContainer',
                        sectionLabel: 'Contact Search',
                        type: 'addContactsToProposal/contactSearchTab',
                        fullSection: true,
                        items: [this.getContactSearchResultsTableControl()]
                    }

                ]

            };


            return assignedContactControls;
        },

        addContactToProposal: function (e) {

            var model = this.searchResults.get($(e.target).closest('tr').attr("data-nrm-rowid"));
            model.collection.remove(model);

            var coll = this.getCollectionForTable($("#searchResultsTable", this.$el));

            if (coll.length <= 0) {
                $(".searchResults", this.$el).removeClass('showResults');
            }

            this.addNewItem($("#contactsTable", this.$el), model.toJSON());

            /*$(".alert",this.$el).fadeOut();
             $(".contacts",this.$el).fadeIn();*/


            $('.contactList .alert', this.$el).fadeOut(_.bind(function () {
                $('.contacts', this.$el).fadeIn();
                $('.stepControls button[type=submit]').prop('disabled', false);
            }, this))
        },

        removeContactsFromProposal: function (e) {
            var contactsTableRowModel = this.getModelForTableRow($(e.target)), removeContactsModel;

            var deletedAuthContactsTbls = this.model.get("deletedAuthContactsTbls");
            if(!deletedAuthContactsTbls){
             deletedAuthContactsTbls = [];
            }

            deletedAuthContactsTbls.push(contactsTableRowModel.get('authorizationContactCn'));
            this.model.set("deletedAuthContactsTbls", deletedAuthContactsTbls);


            contactsTableRowModel.collection.remove(contactsTableRowModel);
            this.toggleContactsTable();
        },

        /*removeContactsFromProposal: function (e) {

            var contactsTableRowModel = this.getModelForTableRow($(e.target)), removeContactsModel;

            if (contactsTableRowModel && contactsTableRowModel.get('authorizationContactCn')){
                removeContactsModel = new RemoveContactsModel({id : contactsTableRowModel.get('authorizationContactCn')});
                removeContactsModel.fetch({
                    success: _.bind(function (model, resp, options) {
                        contactsTableRowModel.collection.remove(contactsTableRowModel);
                        this.toggleContactsTable();
                    }, this),
                    error: function (model, resp, options) {

                    }
                });
            }else{
                contactsTableRowModel.collection.remove(contactsTableRowModel);
                this.toggleContactsTable();
            }

        },*/

        toggleContactsTable : function () {

            var coll = this.getCollectionForTable($("#contactsTable", this.$el));

            if (coll.length <= 0) {
                $(".contacts", this.$el).fadeOut();
                $(".alert", this.$el).fadeIn();
            }
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
                "rowActions": [{
                    "title": "Delete row",
                    type: 'btn',
                    btnStyle: "danger",
                    "className": "btn-xs nrm-route-action removeContact",
                    "icon": "glyphicon glyphicon-remove",
                    "label": 'Remove',
                    "id": "removecontact-deleterow"
                }],
                "actions": []
            }

            return tableControl;
        },

        getContactSearchResultsTableControl: function () {

            var tableControl = {

                "type": "tableEdit",
                "id": "searchResultsTable",
                className: 'searchResultsTable',
                /*"prop" :'searchResultContacts' ,*/
                "hasResults": this.searchResults && this.searchResults.size() > 0,
                "value": this.searchResults,
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

                    }
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

        addNewItem: function ($table, attributes) {

            attributes = $.extend({},attributes,{authorizationContactRole : this.model.get("authorizationContactRole")});
            var coll = this.getCollectionForTable($table);
            if (!coll) return;
            var newModel = new coll.model(attributes);
            coll.add(newModel);
            if (coll.setAll){
                coll.setAll('authorizationContactRole',this.model.get("authorizationContactRole"))
            }

            this.setDirty(true);
        },

        getCollectionForTable: function ($table) {

            if (this.searchResults && $table && $table.attr("id") === "searchResultsTable") {
                return this.searchResults;
            }
            return PanelView.prototype.getCollectionForTable.apply(this, arguments);

        },
        searchContacts: function (event) {
            var model = this.parentModel.SearchContacts();
            var self = this;
            var searchVal = $("#contactSearchField", this.$el).val();


            if (searchVal != '') {

                model.save({field1: $("#contactSearchField", this.$el).val()}, {
                    success: _.bind(function (model, response, options) {

                        if (response.length > 0) {
                            $(".searchResults", this.$el).addClass('showResults');
                        }

                        this.searchResults.reset(response);

                    }, this),
                    error: function (model, resp, options) {

                        console.log(model, resp, options);
                    }
                })
            }

        },

        render: function () {

            PanelView.prototype.render.apply(this, arguments);




            return this;
        },


        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function () {
            PanelView.prototype.startListening.apply(this, arguments);


            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function

                    this.rendered = true;

                    if (this.showAssignedContactsTbl){

                        $('.contactList .alert', this.$el).fadeOut(_.bind(function () {
                            $('.contacts', this.$el).fadeIn();
                            $('.stepControls button[type=submit]').prop('disabled', false);
                        }, this))
                    }
                    //$(".searchResults",this.$el).hide();
                    //$(".contacts",this.$el).hide();

                }
            });

        },

    });
});