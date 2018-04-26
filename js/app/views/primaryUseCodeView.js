define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2','require'], function (PanelView, $, Nrm, _,select2,require) {
    return PanelView.extend({


        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.currentStep = this.model.toJSON();
            config.useCodeCategoryList = config.currentStep.useCodeCategoryDTOs;


            var useCodeCategories = _.map(config.useCodeCategoryList, function(item) {

                                    return {
                                        value: item.categoryName,
                                        text: item.fullDesc
                                    }
                                });


            var useCodesDtoList = _.map(config.useCodeCategoryList, function(category) {
                     return {
                            text : category.fullDesc,
                            options : _.map(category.useCodeDTOs, function(item) {
                                return { value: item.useCodeCn, text: item.fullDesc };
                            })
                        }

            }, []);


            config.useCodesDtoList = useCodesDtoList;


            config.controls =[{
                type: 'select',
                id: 'codeSelect_0',
                /* label: 'Select Code',*/
                prop: 'codeSelect0',
                nameAttr: 'codeSelect_0',
                optgroups: useCodesDtoList,
                pluginOpt: { matcher: matcher},
                placeholder:'Select Code',
                labelGrid: 'col-md-4 col-sm-12', // Twitter Bootstrap grid class for the label
                hzGrid: 'col-md-12 col-sm-12', // Twitter Bootstrap grid class for the field
                grid: 'col-md-5', // label and field
                className:'selectUseCode'
            },
                {
                    type: 'select',
                    id: 'categorySelect_0',
                    /*label: 'Select Category',*/
                    prop: 'category0',
                    nameAttr: 'categorySelect_0',
                    options: useCodeCategories,
                    placeholder:'Select Category',
                    /*labelGrid: 'col-md-4 col-sm-12', // Twitter Bootstrap grid class for the label*/
                    hzGrid: 'col-md-12 col-sm-12', // Twitter Bootstrap grid class for the field
                    grid: 'col-md-5', // label and field
                    className:'selectCategory'

                },
                {
                    id: 'addUseCodeBtn0',
                    nameAttr:'addUseCodeBtn0',
                    type: 'btn',
                    prop: 'addUseCode',
                    btnStyle: "success",
                    icon: "glyphicon glyphicon-plus",
                    className: "btn btn-default addSpecialUseCodeBtn",
                    label: 'Add Another Code',
                    grid: 'col-md-2',
                }]


            function matcher (term, text, option) {

                if (!$.fn.select2.defaults.matcher(term, text)) {
                    var optgroupLabel = $(option).parent().attr('label');
                    return optgroupLabel ? optgroupLabel.toUpperCase().indexOf(term.toUpperCase()) != -1 : false;
                } else {
                    return true;
                }

            };

            return config;
        },

        modelEvents: {


        },

        events: {
                'change .selectCategory' : 'changeCategory',
                'change .selectUseCode' : 'codeSelected',
                'click .addSpecialUseCodeBtn' : 'addUseCodeBtnClicked'
                //... other custom events go here...
            },


        codeSelected : function(event){

            var targetId = $(event.target).attr("id"),
                id = Number(targetId.slice(-1)),
                model = this.model.toJSON(),
                useCodeCategoryList = this.config.useCodeCategoryList,
                useCodes = [];

            if($(event.target).val() !== '') {
                $("#addUseCodeBtn" + id, this.$el).prop('disabled', false);
            } else {
                $("#addUseCodeBtn" + id, this.$el).prop('disabled', true);
            }


            _.each(model, function(value, key, obj) {

                if (key === "codeSelect0"){
                    useCodes[0] = value;
                }else if (key.indexOf("codeSelect") != -1 && value !== ""){
                    useCodes.push(value);
                }

            });



            useCodes  =  _.chain(useCodes).map(function(item) { return item }).uniq().value();

            /*_.each(useCodes, function(obj,idx) {
                _.each(useCodeCategoryList, function(category) {
                    _.each(category.useCodeDTOs, function(item) {
                         if (item.useCode === obj){
                             useCodes[idx] = item;
                        };
                    });
                });
            });*/


            this.model.set("selectedUseCodeIds",useCodes);

        },

        changeCategory: function(event) {

            event.preventDefault();

            var id = Number( $(event.target).attr('id').slice(-1)),
                self= this,
                currentStep = this.model.toJSON(),
                currentCategory = this.model.get('category' +id),
                context = {
                    apiKey : 'category/useCodes',
                    idAttr: 'useCodeCn',
                    nameAttr: 'fullDesc',
                    collection: currentCategory ? getListOfUseCodesByCategory(currentCategory) :  this.config.useCodesDtoList
                }


            $('#codeSelect_'+id, this.$el).val("").change();

            var containerControl = $.extend(true,{},this.config.controls);

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
         * Event handler for 'change:statusFk' event that is triggered on the model.  Also may be called during initial
         * rendering.
         * @param {external:module:backbone} [model]
         * @returns {undefined}
         */
        addUseCodeBtnClicked: function(event) {

            event.preventDefault();
            $(event.target).hide();
            var targetId = $(event.target).attr("id"),
                viewModuleId = 'nrm-ui/views/panelView', templateLoading,
                oldId = Number(targetId.slice(-1)),
                newId = 1 + oldId,
                containerControl =  $.extend(true,[], this.config.controls);


            if (oldId >= 2){

                var updatedControls = _.without(containerControl, _.findWhere(containerControl, { id: 'addUseCodeBtn0'}));

                containerControl = updatedControls;


            }

            this.updateControlObject(containerControl,newId);

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
                    this.setControlEnabled($(".addSpecialUseCodeBtn", this.$el),false);
                    this.rendered = true;

                }
            });

        },




    });
});