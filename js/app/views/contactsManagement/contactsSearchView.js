define(['nrm-ui/views/panelView', "jquery", "nrm-ui","app/views/contactsManagement/contactsManagementPanelView"], function(PanelView, $, Nrm,ContactsManagementPanelView) {

    return ContactsManagementPanelView.extend({

        genericTemplate: "common/ctrlsIterator",

        getConfig: function() {
            var config = ContactsManagementPanelView.prototype.getConfig.apply(this, arguments);

            //config.breadCrumbs = ['search','another','another'];
            this.searchResults = config.collection;

            config.controls = this.getContactContentSectionControls();

            return config;

        },

        events: $.extend({}, ContactsManagementPanelView.prototype.events, ContactsManagementPanelView.prototype.changeEvents, {
            'click .searchBtn' : "loadSearchResults",
            'click .resetBtn' :function (event) {
                $("#searchTerm",this.$el).val('');
                this.model.unset('searchTerm')
                $(".contactSearchResults", this.$el).removeClass('open');
            },
            "keyup #searchTerm" :  function (event) {

                if (event.keyCode === 13) {
                    // Trigger the button element with a click
                    $(".searchBtn",this.$el).click();
                }
            },
            'click .addNewContactBtn' : "loadContactTypeScreen",
            'click .viewContactRow' : "navigateToContactViewForm",
            'click .editContactRow' : "navigateToEditViewForm"

        }),


        navigateToContactViewForm : function (event) {
            var $target = $(event.target);
            var model = this.searchResults.get($target.closest('tr').attr("data-nrm-rowid")),
                contactViewUrl = "#/tools/contactView/"+  model.get("orgType") + "/" +  model.get("id") + "/contacts";

            Nrm.app.navigateUrl(contactViewUrl, {trigger: true, replace: true});
        },

        navigateToEditViewForm : function (event) {
            var $target = $(event.target);
            /*Todo need to confirm with Roshan what is the prop value that has the formTypeName info replace that with orgType*/

            var model = this.searchResults.get($target.closest('tr').attr("data-nrm-rowid")),
                editViewUrl = "#/tools/editView/"+  model.get("orgType") + "/" +  model.get("id") + "/contacts";

            /*editId = model.get('id');
            editIdUsed = false;*/
            this.trigger("setEditContactTypeAttr",model);

            Nrm.app.navigateUrl(editViewUrl, {trigger: true, replace: true});
        },

        getCollectionForTable: function ($table) {

            if (this.searchResults && $table && $table.attr("id") === "searchResultsTable") {
                return this.searchResults;
            }

            return ContactsManagementPanelView.prototype.getCollectionForTable.apply(this, arguments);

        },



        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function () {

            ContactsManagementPanelView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function
                    var self = this;
                    this.rendered = true;



                }
            });

        },

        loadSearchResults :function () {

            var searchKey = $("#searchTerm",this.$el).val();

            if (!searchKey || searchKey == ' '){
                return
            }

            this.searchResults.searchKey =  searchKey;

            var successCallback = _.bind(function(collection, response) {

                if (collection && collection.size()>0){
                    this.searchResults = collection;
                }

                $(".contactSearchResults", this.$el).addClass('open');
                $("#searchResultsTable_paginate",this.$el).css({"margin-top" :"10px"});
            }, this);

            var errorCallback = _.bind(function(collection, response) {

            }, this);


            this.searchResults.fetch({
                reset : true,
                success:successCallback,
                error :errorCallback
            })

        },

        getContactContentSectionControls : function () {

            var controls = [{
                id :'contactSearchForm',
                type : 'contacts/contactSearchForm',
                controls : this.getFormControls(),

            },{
                id :'contactSearchResultsContainer',
                type : 'contacts/contactSearchResultsContainer',
                controls : this.searchResultsContainerControls(),

            },{
                id :'addBtnContainer',
                type : 'contacts/addNewContactContainer',
                //controls : this.searchResultsContainerControls(),

            }]

            return controls;

        },

        searchResultsContainerControls : function () {

            var controls = [this.getContactSearchResultsTableControl()]


            return controls;
        },

        getFormControls : function () {

            var controls = [{
                id :'searchInputContainer',
                type :'contacts/inputContainer',
                containerClass:'searchBar horz',
                controls :[{
                    id:'searchTerm',
                    type:'inputText',
                    nameAttr:'searchTerm',
                    label: 'Search Term',
                    prop:'searchTerm',
                    className:'suds-input suds'
                }]
            },{
                id :'formControlsContainer',
                type :'contacts/inputContainer',
                containerClass:'formControls horz',
                controls :[{
                    id:'searchBtn',
                    icon:'fa fa-search',
                    type:'btn',
                    btnStyle:'primary',
                    nameAttr:'searchTerm',
                    label: 'Search',
                    className:'suds-primary searchBtn'
                },{
                    id:'resetBtn',
                    icon:'fa fa-refresh',
                    type:'btn',
                    //btnStyle:'primary',
                    nameAttr:'searchTerm',
                    label: 'Reset',
                    className:'suds-default resetBtn'
                }]
            }]


            return controls;
        },

        getContactSearchResultsTableControl: function () {

            var tableControl = {

                "type": "tableEdit",
                "id": "searchResultsTable",
                className: 'searchResultsTable',
                //"prop" :'searchResults' ,
                "hasResults": this.searchResults && this.searchResults.size() > 0,
                "value": this.searchResults,
                "columns": [
                    {
                        "prop": "orgName",
                        "label": "Organization Name",
                        className: 'selectContactLink',
                        /*"pluginOpts": {
                         "sWidth": "110px"
                         }*/
                    },{
                        "control": {
                            type: 'common/ctrlsIterator',
                            "id": "tableControls",
                            controls :[{
                                        id:"editContactBtn",
                                        btnStyle: "default",
                                        type:"btn",
                                        label :"Edit",
                                        icon :"fa fa-wrench",
                                        className: "btn-suds suds-default editContactRow"

                                    },{
                                        id:"removeContactBtn",
                                        btnStyle: "primary",
                                        type:"btn",
                                        label :"View",
                                        icon :"fa fa-eye",
                                        className: "btn-suds suds-primary viewContactRow"
                                    }]
                        },
                        "pluginOpts": {
                            "sWidth": "150px",
                            "orderable": false
                        }
                    },
                ],
                "pluginOpts": {
                    "multiSelect": false,
                    "readOnly": true,
                    "searching": false,
                    /*"scrollY":        "200px",
                    "scrollCollapse": true,*/
                    "paging":true,

                    bServerSide :false,
                },

            }

            return tableControl;
        },

    });
});