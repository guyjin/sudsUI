define(["underscore",
        'nrm-ui/views/layoutView',
        './homeOrgView',
        'nrm-ui/views/modalView',
        "jquery", "nrm-ui", "backbone",
        'hbs!error', '..',
        'app/views/aoLevelScreening/screeningQuestionsView',
        'app/views/aoLevelScreening/screeningQuestionsResultsView',
        'app/models/aoLevelScreening/aoReviewDetailsModel',
        'app/models/common/recordTestModel',
         'use!jquery-easing',
        'app/views/common/specialUseRecordView',
        'app/views/myTestView',
        'app/models/customBOValidationRules'],
    function(_, LayoutView, HomeOrgView, ModalView, $, Nrm, Backbone, errorTemplate, Suds,
             AOLevelScreeningView,AOLevelScreeningResultsView,AOReviewDetailsModel,RecordModel ,
             JqueryEasing, SpecialUseRecordView, MyTestView, CustomBOValidationRules) {
        return LayoutView.extend({

            setHomeOrg: function() {
                function setHomeOrgCallback(evtData) {
                    if (evtData.cancel) {
                        return; // user cancelled or save failed at the unsaved changes prompt
                    }
                    var caption = "Set Home Org";
                    var model = new Backbone.Model(
                        Nrm.app.get("homeOrg")
                    );
                    var options = {
                        model: model
                    };
                    Nrm.event.trigger("app:modal", {
                        caption: caption,
                        //text: "Not implemented yet.",
                        view: new HomeOrgView(options),
                        buttons: ModalView.OK_CANCEL, // Set the buttons displayed on modal (from ModalView.js)
                        backdrop: "static", // Bootstap modal option which is passed through
                        callback: function() {
                            if (this.clicked === 0) {
                                // We clicked "OK"... store the home org

                                var homeOrgModel = new Backbone.Model({ homeOrg: model.get('homeOrg')});
                                homeOrgModel.urlRoot = "api/userProfile";
                                homeOrgModel.save(null, {
                                    success: function() {
                                        Nrm.app.set("homeOrg", homeOrgModel.toJSON());
                                    },
                                    error: function(model, resp, options) {
                                        var error = Nrm.app.normalizeErrorInfo('Failed to set Home Org',
                                            model, resp || model, options);
                                        Nrm.event.trigger('showErrors', errorTemplate({ error: error }));
                                    }
                                });
                            }
                        }
                    });
                }
                /* Changing the home org will refresh the tree, which will prompt user if there are unsaved changes in an
                 * edit form, with an opportunity to cancel.  Therefore, we need to force that to happen before setting the
                 * home org, and displaying the home page will accomplish that goal.
                 */
                this.displayHomePage({
                    replace: true, // replace the current view if there is one
                    navigate: true, // maybe? update the URL in the address bar
                    callback: setHomeOrgCallback // the callback is called after attempting to remove the current view
                });
            },
            changeHomeOrg: function() {
                var homeOrgText;
                var homeOrg = Nrm.app.get("homeOrg");
                homeOrgText = ( homeOrg && homeOrg.id ) || "Not Set";
                $("#selectedHomeOrg", this.$el).text(homeOrgText);
                this.enableRootFolders(homeOrg);
            },

            startListening: function() {
               LayoutView.prototype.startListening.apply(this, arguments);//super method

                //this is the SUDS -custom routes
                this.listenTo(Nrm.event, {
                    "suds:load-tools-view" : this.activateTool,
                    "suds-get-summary" : this.getSummaryView,
                    "app:setHomeOrg"  : this.setHomeOrg,
                    "suds:ao-level-test" : this.showTestView,
                    "suds:suds-gis-test" : this.showGISView,
                    "suds:toggle-navigation" : this.toggleNavigation,
                    "suds:edit" : this.showSudsRecordView,
                    "suds:custom-view" : this.showMyTestView
                });


                this.listenTo(Nrm.app, {
                    "change:homeOrg"  : this.changeHomeOrg
                });
            },

            showView: function(data, callback) {
                var args, wrappedCallback = callback;
                callback = function(evtData, view) {

                    if (_.isFunction(wrappedCallback)) {
                        wrappedCallback.apply(this, arguments);
                    }
                    if (!view) {
                        // home screen
                        setTimeout(_.bind(function () {
                            $('.suds-container',this.$el).animate({
                                opacity: 1,
                                left: 0
                            }, 500, 'easeOutCirc')
                        }, this), 300);
                    } else if (_.isFunction(view.fadeIn)) {
                        view.fadeIn();
                    }

                }
                if (arguments.length < 2) {
                    args = [data, callback];
                } else {
                    args = arguments;
                }
              return   LayoutView.prototype.showView.apply(this, args);
            },
            getUserInfo: function() {
                // LayoutView.prototype.getUserInfo.apply = similar to using super in java
                //$.when returns when the asynchronous call is done
                // do here if you want to load anything before the page renders
                /*var dfd = $.Deferred();

                 $.when(LayoutView.prototype.getUserInfo.apply(this, arguments)).done(function(userInfo) {
                 var roles = userInfo.get('roles');
                 if (roles && roles.length > 0) {
                 dfd.resolve(userInfo);
                 } else if (userInfo.get('authorized') !== false) {
                 // allows the LocalDB prototype to add role information
                 Nrm.event.trigger('prototype:getRoles', userInfo, function(userInfo) {
                 dfd.resolve(userInfo);
                 });
                 }
                 });

                 return $.when(dfd).done(_.bind(function(userInfo) {
                 var homeOrg = userInfo.get("roles")[0];
                 Nrm.app.set('homeOrg', homeOrg);
                 this.enableRootFolders(homeOrg);
                 }, this));*/

                return $.when(LayoutView.prototype.getUserInfo.apply(this, arguments)).done(_.bind(function(userInfo) {
                    var roles = userInfo.get("roles"),
                        homeOrg = roles && roles[0];
                    Nrm.app.set('homeOrg', homeOrg);
                    this.enableRootFolders(homeOrg);

                }, this));

            },
            toggleNavigation : function (options) {

                var  layout = this.layout && this.layout.myLayout,
                    status = options && options.status,
                    paneName  = options && options.paneName;

                  if (status && paneName){

                    if (status === "open"){
                        layout.open(paneName);
                    }else if (status === "close"){
                        layout.close(paneName);
                    }
                }

            },

            enableRootFolders: function(homeOrg) {
                var allctx = Nrm.app.get("context");

                if (!allctx) return;
                /**
                 * Reload the collection if loadType is "auto", otherwise clear the collection if it is loaded by search
                 * initiated by the user.
                 * @private
                 * @param {module:nrm-ui/models/application~ContextConfig} ctx
                 * @returns {undefined}
                 */
                function resetCollection(ctx) {
                    if (ctx.loadType === "auto" && ctx.collection) {
                        ctx.collection.fetch({reset: true});
                    } else if (ctx.collection) {
                        ctx.collection.reset([]);
                    }
                }

                var refreshNeeded = false;
                function setTopLevel(ctx, topLevel) {
                    if ((!ctx.topLevel && topLevel) || (ctx.topLevel && !topLevel)) {
                        ctx.topLevel = topLevel;
                        refreshNeeded = true;
                    }
                }

                _.each(allctx, function(ctx, key) {
                    switch (key) {
                        case "myTasks":
                        case "process":
                            // any root node that is limited to the current home org must be reset when it changes.
                            resetCollection(ctx);
                            break;
                        case "application":
                            setTopLevel(!!(homeOrg && homeOrg.application));
                            break;
                        case "authorization":
                            //setTopLevel(!!(homeOrg && homeOrg.authorization));
                            break;
                        case "bills":
                            setTopLevel(!!(homeOrg && homeOrg.billing));
                            break;

                    }
//                if (key === "projects" || key === "sites" || key === "surveys") {
//                    ctx.topLevel = false;
//                    ctx.triggerRoute = "configure/default";
//                } else if (key === "vpdUnits") {
//                    ctx.topLevel = true;
//                }
                });
                Nrm.event.trigger("context:refresh");
            },

            showTestView: function(param) {

                var self = this;

                var aoReviewDetailsModel = new AOReviewDetailsModel();

                if (param !== "results"){
                    var recordDto = {
                        recordCn : '4D12735D33916824E054020820E22EC1'
                    }


                    aoReviewDetailsModel.save(recordDto,{
                        success : function(model, resp, options) {

                            var options = {
                                model : new RecordModel(resp),
                                level : (param ? param : "1")
                            }

                            self.showView(options, function() { }, {
                                viewType: AOLevelScreeningView
                            });
                        },
                        error : function(model, resp, options) {}
                    });
                }else if (param === "results"){

                    var options = {
                        model : new RecordModel(),
                    }
                    self.showView(options, function() { }, {
                        viewType: AOLevelScreeningResultsView
                    });
                }




            },

            getSummaryView : function(){


                console.log("this is getSummaryView")
            },

            showSudsRecordView : function (data) {
                data.navigate = false;
                Nrm.event.trigger('context:beginEdit', data);
            },

            showMyTestView : function (id) {

                var options = {
                    model : new RecordModel()
                }

                this.showView(options, function() { }, {
                    viewType: MyTestView
                });
            },


            /*loadContactManagementModule : function (options) {

               /!* var options = {
                    model : new RecordModel(),
                    screen :path
                }*!/

               debugger
                this.showView(options, function() { }, {
                    viewType: ContactsManagementView
                });
            },*/

            /*
            * Todo: one other thing about  route event handler... in the future if you add other contexts for tools/:action/*path
             you might want to change that handler a little to accommodate that possibility by removing this.currentToolView
             if it is a different context
            * */
            activateTool: function(evtData) {
                debugger

                if (!this.currentToolContext || this.currentToolContext.apiKey !== evtData.context.apiKey) {
                    if (this.currentToolView) {
                        this.currentToolView.remove();
                    }
                    var dfd = $.Deferred();
                    this.currentToolView = dfd.promise();
                    this.currentToolContext = evtData.context;
                    $.when(Nrm.app.getViewConstructor({
                        context:
                        evtData.context
                    }, this)).done(function(ViewConstructor) {
                        this.currentToolView = new ViewConstructor(evtData);

                        this.listenTo(this.currentToolView, {
                            "remove": function() {
                                this.currentToolView = null;
                                this.currentToolContext = null;
                            },

                            "renderComplete": function() {
                                this.currentToolView.fadeIn();
                            }
                        });

                        if (!this.currentView){
                            this.showView(evtData, function() { }, {
                                view: this.currentToolView
                            });
                        }else{
                            this.showWorkflowView({
                                view: this.currentToolView
                            });
                        }

                        dfd.resolve(this.currentToolView);
                    });
                } else {
                    $.when(this.currentToolView).done(function(view) {
                        view.applyContext(evtData);
                    });
                }
            },


            showGISView: function(param) {

                var name = "testing";

                var self = this;

                var aoReviewDetailsModel = new AOReviewDetailsModel();

                if (param !== "results"){
                    var recordDto = {
                        recordCn : '4D12735D33916824E054020820E22EC1'
                    }


                    aoReviewDetailsModel.save(recordDto,{
                        success : function(model, resp, options) {

                            var options = {
                                model : new RecordModel(resp),
                                level : (param ? param : "1")
                            }

                            self.showView(options, function() { }, {
                                viewType: AOLevelScreeningView
                            });
                        },
                        error : function(model, resp, options) {}
                    });
                }else if (param === "results"){

                    var options = {

                    }
                    self.showView(options, function() { }, {
                        viewType: AOLevelScreeningResultsView
                    });
                }




            }
        });
    });