define(['../panelView', "jquery", "nrm-ui", 'underscore','use!select2','require',
    'app/models/getUseCodeAndCategoriesModel','app/models/getTableRecordByAuthAndProp', 'app/models/recordUpdateModel'],
    function (PanelView, $, Nrm, _,select2,require,UseCodeAndCategoriesModel,GetTableRecordByAuthCnAndProp, RecordUpdateModel) {
    return PanelView.extend({

        genericTemplate : 'common/ctrlsIterator',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            var useCodeModel = new UseCodeAndCategoriesModel(),
                dfd = new $.Deferred(),self=this,
                authorization = this.model.toJSON(),
                property = "authorizationUseCodes";

            var getTableRecordByAuthAndChildId = new GetTableRecordByAuthCnAndProp({
                authCn : authorization.authorizationCn,
                property : property
            });

            this.model.set("currentSectionId", "UseCode");
            this.model.set("currentSectionStatus", "Complete");
            this.model.set("nextStepId",this.model.get("caseFileId"));

            var self = this;

            useCodeModel.fetch({
                success : function (model, resp, options) {

                    config.useCodeCategoryList = resp

                    var tabNames = ['Use Codes'];

                    getTableRecordByAuthAndChildId.fetch({

                        success: _.bind(function (model, resp, options) {

                            config.controls = [
                                {
                                    type:'common/soloTabSummaryHeader',
                                    screenName : {
                                        tabNames : tabNames
                                    }
                                },{
                                    type:'common/screenContentControls',
                                    controls : self.getScreenContentControls(config),
                                }
                            ]

                            if (resp && resp.length){
                                //config.authorizationUseCodes = $.extend({},resp);
                                //var authorizationUseCodes= JSON.parse(JSON.stringify(resp))
                                var authorizationUseCodes= $.extend([],resp);

                                config.previousSelectedUseCodes = [];
                                $.each(resp,function (idx,obj) {
                                    config.previousSelectedUseCodes.push(obj.authorizationUseCodeCn)
                                });

                                config.primaryUseCode = _.findWhere(resp, {
                                    primarySecondaryInd: "P"
                                });

                                if (config.primaryUseCode){
                                    self.model.set("codeSelect0",config.primaryUseCode.usesTbl);
                                }
                                config.secondaryUseCodes = _.without(resp, _.findWhere(resp, {
                                    primarySecondaryInd: "P"
                                }));

                                /*self.model.set("authorizationUseCodes", authorizationUseCodes);*/



                            }
                            dfd.resolve(config);
                        }, self),
                        error: function (model, resp, options) {

                            dfd.reject(model, resp, options);
                        }
                    });

                },
                error: function (model, resp, options) {
                    dfd.reject(config)
                }
            })


            return dfd.promise();
        },

        getScreenContentControls : function (config) {

            var controls = [];

            controls[0] = this.getUseCodeFormControl(config);

            return controls;
        },

        getUseCodeFormControl : function (config) {

            var useCodeFormControls = {
                id:'primaryUseCodeContainer',
                tabHeading :' Use Codes',
                type :'common/tabHeadingAndSection',
                sectionWrap : false,
                items : [
                    {
                        id :'codeSelector_0',
                        sectionLabel : 'Primary Use Code',
                        fullSection : true,
                        type : 'useCodes/useCodeAndCategoryDropDown',
                        items : this.getPrimaryUseCodeControls(config)
                    },
                    {
                        id :'contactSearchContainer',
                        sectionLabel : 'Secondary Use Code',
                        type:'useCodes/secondaryUseCodes',
                        fullSection : true,
                        items: []
                    }

                ]

            };


            return useCodeFormControls;
        },

        getPrimaryUseCodeControls : function (config) {

            var useCodeCategories = _.map(config.useCodeCategoryList, function(item) {

                return {
                    value: item.categoryName,
                    text: item.categoryName
                }
            });


            var useCodesDtoList = _.map(config.useCodeCategoryList, function(category) {
                return {
                    text : category.categoryName,
                    options : _.map(category.useCodeDTOs, function(item) {
                        return { value: item.useCodeCn, text: item.fullDesc };
                    })
                }

            }, []);


            config.useCodesDtoList = useCodesDtoList;

          var primaryUseCodeControls = [{
              type: 'select',
              id: 'codeSelect_0',
               label: 'Use Code',
              prop: 'codeSelect0',
                nameAttr: 'codeSelect_0',
                optgroups: useCodesDtoList,
                pluginOpt: { matcher: matcher},
                 placeholder:'Select Code',
                /*labelGrid: 'col-md-4 col-sm-12', // Twitter Bootstrap grid class for the label
                hzGrid: 'col-md-12 col-sm-12', // Twitter Bootstrap grid class for the field*/
                grid: 'col-md-5', // label and field
                className:'codeSelect'
        },
            {
                type: 'select',
                id: 'categorySelect_0',
                label: 'Select Category',
                prop: 'category0',
                nameAttr: 'categorySelect_0',
                options: useCodeCategories,
                placeholder:'Code Category',
                /*/!*labelGrid: 'col-md-4 col-sm-12', // Twitter Bootstrap grid class for the label*!/
                hzGrid: 'col-md-12 col-sm-12', // Twitter Bootstrap grid class for the field
                    grid: 'col-md-5', // label and field*/
                grid: 'col-md-5', // label and field
                className:'categorySelect'

            }]

            function matcher (term, text, option) {

                if (!$.fn.select2.defaults.matcher(term, text)) {
                    var optgroupLabel = $(option).parent().attr('label');
                    return optgroupLabel ? optgroupLabel.toUpperCase().indexOf(term.toUpperCase()) != -1 : false;
                } else {
                    return true;
                }

            };
            return primaryUseCodeControls;
        },
        modelEvents: {


        },

        events: {
                'change .categorySelect' : 'changeCategory',
                'change .codeSelect' : 'codeSelected',
                'click .addSpecialUseCodeBtn' : 'addUseCodeBtnClicked',
                'click .suds-danger' : function (event) {
                    var $target = $(event.target),
                        targetId = $target.attr("id"),
                        newId = Number(targetId.slice(-1));
                    var selectedUseCodes = this.model.get('selectedUseCodeIds');
                    $('#codeSelect_'+newId, this.$el).val("").change();
                    $('#codeSelector_' + newId).remove();
                    this.model.unset('codeSelect' +newId, { silent: true });
                    this.model.unset('category' +newId, { silent: true });

                    if (selectedUseCodes && selectedUseCodes.length && selectedUseCodes.length < 4){
                        $('.addSpecialUseCodeBtn',this.$el).show();
                    }


                }
                //... other custom events go here...
            },


        codeSelected : function(event){

            var targetId = $(event.target).attr("id"),
                id = Number(targetId.slice(-1)),
                currentSelectedCode = $(event.target).val();



            var listOfUseCodes = this.getCurrentSetOfUseCodesInTheModel();
            var isUseCodeAlreadyAdded;

            if (listOfUseCodes) {
                isUseCodeAlreadyAdded = _.findWhere(listOfUseCodes, {
                    usesTbl: currentSelectedCode
                });

                if (isUseCodeAlreadyAdded){

                    $(event.target).select2('data', null, false);
                    Nrm.event.trigger("app:modal", ( {
                        "text": "Please make sure to select unique use codes",
                        "caption": "Failed"
                    }));



                    return;
                }


            }


            this.model.set('codeSelect' +id,currentSelectedCode);

            this.updateAuthUseCodes();
        },

        updateAuthUseCodes : function () {

            this.model.set("authorizationUseCodes",this.getCurrentSetOfUseCodesInTheModel());
            this.model.set("deletedAuthorizationUseCodes", this.config.previousSelectedUseCodes);
            if (this.model.get('codeSelect0')){
                this.setControlEnabled($(".addSpecialUseCodeBtn", this.$el),true);
            }else{
                this.setControlEnabled($(".addSpecialUseCodeBtn", this.$el),false);
            }

        },

        getCurrentSetOfUseCodesInTheModel : function () {

            var useCodes = [];
            _.each(this.model.toJSON(), function(value, key, obj) {
                // this makes sure primary is in index 0 of useCodes array
                if (key === "codeSelect0"){
                    useCodes[0] = $.extend({},{
                        "usesTbl": value,
                        "primarySecondaryInd" : "P"
                    });
                }else if (key.indexOf("codeSelect") != -1 && value !== ""){
                    useCodes.push($.extend({},{
                        "usesTbl": value,
                        "primarySecondaryInd" : "S"
                    }));
                }
            });

            return useCodes;
        },


        /*Todo : Need to ask roshan if we really need this*/
        /*removePriorSelectedUseCode: function(priorSelectedUseCodes){

            debugger
            if (priorSelectedUseCodes && priorSelectedUseCodes.length){

                var authorization = this.model.toJSON();

                authorization.deletedAuthorizationUseCodes =  priorSelectedUseCodes;
                authorization.authorizationUseCodes = [];

                var recordUpdateModel = new RecordUpdateModel({
                    id: authorization.authorizationCn
                });

                recordUpdateModel.save(authorization,{
                    success: function(model, resp, options){
                        console.log("recordModel Update success")
                    },
                    error: function(model, resp, options){
                        console.log("recordModel Update error")
                    }
                });
            }
        },*/

        changeCategory: function(event) {

            event.preventDefault();

            var id = Number( $(event.target).attr('id').slice(-1)),
                self= this,
                currentCategory = $(event.target).val(),
                context = {
                    apiKey : 'category/useCodes',
                    idAttr: 'useCodeCn',
                    nameAttr: 'fullDesc',
                    collection: currentCategory ? getListOfUseCodesByCategory(currentCategory) :  this.config.useCodesDtoList
                }

            this.model.set('category' +id,currentCategory);
            $('#codeSelect_'+id, this.$el).val("").change();

            var containerControl = $.extend({},this.getPrimaryUseCodeControls(this.config));

            this.updateControlObject(containerControl,id);

            var control = _.find(containerControl, function(control) {
                return control.id === "codeSelect_" +id;
            });



            control.optgroups = (currentCategory ? false : this.config.useCodesDtoList);
            this.initLov(control, context, function(){

            }, function(data, response) {
                control.error = true;
                this.onLovError(context, data, response);

            });


            function getListOfUseCodesByCategory(categoryCode){

                var category = _.find(self.config.useCodeCategoryList, function(category) {
                    return category.categoryName === categoryCode;
                })

                return category.useCodeDTOs;
            }
        },

        /**
         *
         *
         * @param {external:module:backbone} [model]
         * @returns {undefined}
         */
        addUseCodeBtnClicked: function(event,newId) {

            var $target, targetId,
                viewModuleId = 'nrm-ui/views/panelView', templateLoading,oldId;

            if (event){
                event.preventDefault();
                $target = $(event.target),
                targetId = $target.attr("id") || "addBtn0",
                viewModuleId = 'nrm-ui/views/panelView',
                oldId = Number(targetId.slice(-1)),
                newId = 1 + oldId;
                var selectedUseCodes = this.model.get('selectedUseCodeIds');

                $target.attr("id",'addBtn' + newId)
                if (selectedUseCodes && selectedUseCodes.length && selectedUseCodes.length >= 4){
                    $target.hide();
                }
            }


            var primaryUseCodeControls = this.getPrimaryUseCodeControls(this.config);
            this.updateControlObject(primaryUseCodeControls,newId);

            var containerControl =  [{
                id :'codeSelector_' + newId,
                sectionLabel : 'Primary Use Code',
                fullSection : true,
                type : 'useCodes/useCodeAndCategoryDropDown',
                items : primaryUseCodeControls
            }]

            var removeBtnControl = {
                id:"removeBtn" + newId,
                label:'Remove',
                className :'suds-danger btn-suds',
                type: 'btn',
                grid: 'col-md-2', // label and field
                btnStyle :'danger'
            };


            containerControl[0].items.push(removeBtnControl)



            if (!containerControl) {
                // Control not found
                return;
            }

            function renderChildView(viewModule) {


                if (this.removed) {
                    // just in case the asynchronous module load finishes after removing the view
                    return;
                }

                var config = {
                    id : "secondaryUseCodeContainer" + newId,
                    controls : containerControl,
                    className :"specialUseCodeSelectors"
                }


                var context = {
                    apiKey : 'secondaryUseCodes' + newId,
                    idAttr: 'secondaryUseCodeId' + newId,
                    nameAttr: 'secondaryUseCodeName' + newId,
                    collection: this.model.collection

                }


                var view = new viewModule({
                    config: config,
                    model: this.model,
                    context: context,
                    /*prop : this.model*/
                });

                var renderFn = view.renderDeferred || view.render,
                    id = ".secondaryUseCodes",
                    $secondaryUseCodePanel = $(id, this.$el);

                $.when(renderFn.call(view),$('.secondaryUseCodes',this.$el).show()).done(_.bind(function() {
                    containerControl.view = view;
                    $secondaryUseCodePanel.append(view.$el);
                    this.trigger('renderComplete');
                    this.listenTo(view, 'dirtyChanged', function() {
                        if (view.isDirty()) {
                            this.setDirty(true);
                        }
                    });

                    if (templateLoading) {
                        templateLoading.resolve(view);
                    }
                }, this));

            }
            if (_.isString(viewModuleId)) {
                // it is an AMD module ID, so load the module, then render the view
                // set step.view to a Deferred object to guard against multiple loads
                templateLoading = containerControl.view = $.Deferred();
                require([viewModuleId], _.bind(renderChildView, this));
            } else if (_.isFunction(viewModuleId)) {
                // it is the actual view constructor, this will happen if re-rendering after a save
                templateLoading = containerControl.view = $.Deferred();
                // just render the view
                renderChildView.call(this, viewModuleId);
            }

        },

        updateControlObject : function (controls,newId) {

            var self = this;

            _.each(controls, function(item, idx) {

                if (item.id.indexOf("0".toString()) != -1){
                    item.id = item.id.replace("0",newId);
                    item.nameAttr = item.nameAttr.replace("0",newId);
                    item.prop = item.prop.replace("0",newId);
                }

                if (item.optgroups){

                    item.optgroups = self.config.useCodesDtoList;
                }


            });
        },



        render : function () {

            PanelView.prototype.render.apply(this, arguments);

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
                    /*$(".addSpecialUseCodeBtn", this.$el).hide();*/
                    var self = this;

                    if (this.config.primaryUseCode){
                        this.setControlEnabled($(".addSpecialUseCodeBtn", this.$el),true);
                    }

                    if (this.config.secondaryUseCodes && this.config.secondaryUseCodes.length){
                        var count = this.config.secondaryUseCodes.length;

                        $.each(this.config.secondaryUseCodes,function (idx,obj) {

                            if (obj){
                                self.model.set("codeSelect" + (idx +1),obj.usesTbl)

                                if (idx+1 === count) {
                                    //self.populateSelectedUseCodeDTO();
                                }
                            }

                        })

                        _.each(this.model.toJSON(), function(value, key, obj) {

                            if (key
                                && key != "codeSelect0"
                                && key.indexOf("codeSelect") != -1
                                && value !== ""){

                                var id  = key.substring(10),
                                    codeSelectorConfig = $('#codeSelect_'+id, this.$el);

                                if (codeSelectorConfig && codeSelectorConfig.length == 0){
                                    $('.addSpecialUseCodeBtn').trigger('click');
                                    self.config.secondaryUseCodes.splice(id-1,1);
                                }


                                console.log(key);
                            }

                        });

                    }

                    this.rendered = true;

                }
            });

        },




    });
});