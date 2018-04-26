define(['./panelView', "jquery", "nrm-ui", 'underscore','../collections/contactsCollection'], function (PanelView, $, Nrm, _,ContactCollection) {

    return PanelView.extend({

        genericTemplate: 'addContactsToProposal/contacts',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);


            config.currentStep = this.model.toJSON();
            this.searchResults = new ContactCollection();

            config.controls = [
                {
                  id : 'contactList',
                  type : 'addContactsToProposal/contactsList',
                  className : 'contactList',
                  controls : this.getContactListTableControl(config)
                },
                {

                    id:"contactSearchForm",
                    nameAttr:"contactSearchForm",
                   /*type: 'addContactsToProposal/contactSearchForm',*/
                   type:'form',
                    inline : true,
                    controls :[{
                        id: 'contactSearchField',
                        nameAttr:'contactSearchField',
                        type: 'inputText',
                        label: 'Search',
                        placeholder :'Contact Name',
                        prop:'searchContact',
                    },{

                        type: "btn",
                        id: "search-contact",
                        label: "Search",
                        btnStyle: "primary",
                        className: "contactSearchSubmit",
                        icon :'glyphicon glyphicon-search',
                        title: "Save changes",
                        submit: false
                    },{
                        hz :true,
                        type: "btn",
                        id: "search-contact-reset",
                        label: "Reset",
                        icon: 'fa fa-refresh',
                        className: "btn-sm contactSearchReset" ,
                        title: "Reset Search Box"
                    }],
                   className :'searchFormControls'
                },

                {
                    id: 'contactSearchContainer',
                    nameAttr:'contactSearchContainer',
                    type: 'addContactsToProposal/searchResults',
                    controls : this.getContactSearchResultsTableControl()
                }
            ]



            return config;
        },

        events: {
                'click .addContact' : 'addContactToProposal',
                'click .removeContact' : 'removeContactsFromProposal',
                'click .contactSearchSubmit':'searchContacts',
                'click .contactSearchReset':function (event) {
                    event.preventDefault();
                    $("#contactSearchField",this.$el).val('');
                }
                //... other custom events go here...
            },


        addContactToProposal: function(e) {

            var model = this.searchResults.get($(e.target).closest('tr').attr("data-nrm-rowid"));
            model.collection.remove(model);

            var coll = this.getCollectionForTable($("#searchResultsTable", this.$el));

            if (coll.length  <= 0){
                $(".searchResults",this.$el).fadeOut();
            }

            this.addNewItem($("#contactsTable", this.$el),model.toJSON());

            $(".alert",this.$el).fadeOut();
            $(".contacts",this.$el).fadeIn();
        },

        removeContactsFromProposal: function(e) {

            var model = this.getModelForTableRow($(e.target))
            model.collection.remove(model);

            var coll = this.getCollectionForTable($("#contactsTable", this.$el));

            if (coll.length  <= 0){
                $(".contacts",this.$el).fadeOut();
                $(".alert",this.$el).fadeIn();
            }

        },

        getContactListTableControl : function(config){

            var addedContacts = config.currentStep.selectedContacts || {},
                currentStep  = config.currentStep;

            if (addedContacts)
            currentStep.selectedContacts = new ContactCollection(addedContacts);


            this.model.set("selectedContacts", new ContactCollection());

            var tableControl = [ {

                "type" : "tableEdit",
                "id" : "contactsTable",
                "prop" :'selectedContacts' ,
                /*"hasResults" : this.addedContacts && this.addedContacts.size() > 0,
                "value" : this.addedContacts,*/
                "columns" : [
                    {
                        "prop": 'name',
                        "label" : "Name",
                        className : 'selectContactLink',
                        "pluginOpts": {
                            "sWidth": "110px"
                        }
                    },
                    {
                        "prop": "companyName",
                        "label" : "Business Name",
                    },
                    {
                        "prop": "phoneNumber",
                        "label" : "Phone Number",

                    },
                    {
                        "prop": "address",
                        "label" : "Address",
                    }
                ],
                "pluginOpts" : {
                    "multiSelect" : false,
                    "readOnly": true,
                    "searching": true,
                    "paging": (addedContacts.length  > 10 ? true :false)
                },
                "rowActions": [ {
                    "title": "Delete row",
                    type:'btn',
                    btnStyle:"danger",
                    "className": "btn-xs nrm-route-action removeContact",
                    "icon": "glyphicon glyphicon-remove",
                    "label" : 'Remove',
                    "id": "removecontact-deleterow"
                } ],
                "actions" : []
            }]

            return tableControl;
        },

        getContactSearchResultsTableControl : function () {

            var tableControl =  [ {

                "type" : "tableEdit",
                "id" : "searchResultsTable",
                /*"prop" :'searchResultContacts' ,*/
                "hasResults" : this.searchResults && this.searchResults.size() > 0,
                "value" : this.searchResults,
                "columns" : [
                    {
                        "prop": "name",
                        "label" : "Name",
                        className : 'selectContactLink',
                        /*"pluginOpts": {
                            "sWidth": "110px"
                        }*/
                    },
                    {
                        "prop": "companyName",
                        "label" : "Business Name",


                    },
                    {
                        "prop": "phoneNumber",
                        "label" : "Phone Number",

                    },
                    {
                        "prop": "address",
                        "label" : "Address",

                    }
                ],
                "pluginOpts" : {
                    "multiSelect" : false,
                    "readOnly": true,
                    "searching": true,
                    "paging": false
                },
                "rowActions": [ {
                    "title": "Add Contact",
                    type:'btn',
                    btnStyle:"default",
                    "className": "btn-xs nrm-route-action addContact",
                    "icon": "glyphicon glyphicon-plus",
                    "label" :'Add',
                    "id": "addContact-row"
                } ],
                "actions" : []
            }]

            return tableControl;
        },

        addNewItem: function($table, attributes) {

            var coll = this.getCollectionForTable($table);
            if (!coll) return;
            var newModel = new coll.model(attributes);
            coll.add(newModel);
            this.setDirty(true);
        },

        getCollectionForTable : function ($table) {

            if (this.searchResults && $table && $table.attr("id") === "searchResultsTable") {
                return this.searchResults;
            }
            return PanelView.prototype.getCollectionForTable.apply(this, arguments);

        },
        searchContacts : function (event) {
            var model = this.parentModel.SearchContacts();
            var self = this;
            var searchVal = $("#contactSearchField",this.$el).val();


            if (searchVal != '')
            model.save({field1 : $("#contactSearchField",this.$el).val()},{
                success:_.bind (function(model, response, options) {

                    if (response.length > 0){
                        $(".searchResults",this.$el).fadeIn();
                    }

                    this.searchResults.reset(response);

                }, this),
                error: function(model, resp, options) {

                    console.log(model, resp, options);
                }
            })
        },

        render : function () {

            PanelView.prototype.render.apply(this, arguments);

            var  currentStep = this.model.get('currentStep')
            $(".alert",this.$el).fadeIn();

            return this;
        },


        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function() {
            PanelView.prototype.startListening.apply(this,arguments);


            this.listenTo(this, {
                'renderComplete': function() {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function

                    this.rendered = true;
                    $(".searchResults",this.$el).hide();
                    $(".contacts",this.$el).hide();

                }
            });

        },

    });
});