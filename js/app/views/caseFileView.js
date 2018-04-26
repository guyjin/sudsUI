define(['./panelView', "jquery", "nrm-ui", 'underscore','app/views/common/editDataModalView','app/models/getAuthSummary','hbs!common/caseFileSummaryHeader'],
    function (PanelView, $, Nrm, _,EditDataModalView, GetAuthSummary, CaseFileSummaryHeader) {
    return PanelView.extend({

        genericTemplate: 'caseFile/main',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            var model = this.model.toJSON();
            var sectionInfoDtos = this.parentModel.get('sectionInfoDtos');


            this.optOrReqFlowSummaryList = this.getOptionalAndRequiredFlowSummaryList(this.parentModel.get('sectionInfoDtos'))

            config.controls=[{
                id:'caseNavigationContainer',
                type: 'caseFile/caseNavigation',
                items: this.getSectionInfoControlObj()
            },{
                id:'caseSectionsContainer',
                type:'caseFile/caseSections',
                items:this.caseSectionsContainerControls(model)
            }]

            return config;
        },



        caseSectionsContainerControls : function (model) {

            var controls = [{
                id : 'caseFiltersAndViewsContainer',
                type:'caseFile/caseFiltersAndViews',
                tabHeadings:this.caseFilterAndViewsContainerControls()
            },{
                id : 'sectionsContainer',
                type:'caseFile/summarySectionContainer',
                items: this.summarySectionContainerCtrls(model)
            },{
                id : 'docsContainer',
                type : 'caseFile/docs/main',
                items : this.docsTabControls()
            },{
                id : 'activityLogContainer',
                type:'caseFile/activityLog/main',
                items : this.acitivityLogTabControls()
            }];

            return controls;
        },

        caseFilterAndViewsContainerControls : function () {
            var controls = [];

            controls[0] = [{
                viewTarget :"case",
                filter : "all",
                label : "All",
                isActive : true
            },{
                viewTarget :"case",
                filter : "todo",
                label : "To Do",
            },{
                viewTarget :"case",
                filter : "done",
                label : "Done"
            }]

            controls[1] = [{
                viewTarget :"docs",
                label : "Docs"
            },{
                viewTarget :"log",
                label : "Log"
            }]

            return controls;

        },

        summarySectionContainerCtrls : function (model) {

            var controls = [{
                id : 'requiredSummaryCaseSection',
                type: '',
                items : []
                }],
                self = this,
                summaryTemplateCtrls, sectionInfoCtrlObj = this.getSectionInfoControlObj();


            //delete statusAndSubflowObj[0];//since we know that index 0 will always be home so just remove it

            function populateOptOrReqSecContainerCtrlItems(sectionSummaryInfoList,ctrlIdx){

                _.each(sectionSummaryInfoList.items,function (eachSectionInfo) {

                    if (eachSectionInfo.target !== "home"){

                        var temp = $.extend({},{
                            id :'',
                            type: '',
                            status :'',
                            tabLabel :'',
                            items : [],//this is where we can later on define the custom controls for each summary template
                            isEditable : self.isEditable(eachSectionInfo.status)
                        },eachSectionInfo)

                        if (eachSectionInfo && eachSectionInfo.sectionId){
                            //summaryTemplateCtrls = self.getSummaryTemplate(eachSectionInfo.sectionId,eachSectionInfo.sectionStatus);
                            if (eachSectionInfo.sectionId === "BasicInfo"){
                                temp.editDataText = "Edit All"
                            }else{
                                temp.editDataText = "Edit"
                            }

                            if(eachSectionInfo.sectionStatus === "Available"){
                                temp.editDataText = "Start"
                            }
                            temp.id = eachSectionInfo.target;
                           /* temp.type = templateNameAndCtrls.name;
                            temp.items = templateNameAndCtrls.controls;*/
                            temp.status = eachSectionInfo.status;
                            temp.camelCaseStatus = eachSectionInfo.status.charAt(0).toLowerCase() + eachSectionInfo.status.slice(1);
                            temp.titleCaseStatus = eachSectionInfo.status.charAt(0).toUpperCase() + eachSectionInfo.status.slice(1);
                            temp.tabLabel = eachSectionInfo.sectionName;

                            controls[ctrlIdx].items.push(temp);
                        }

                        //self.loadSummarySectionView($.extend({},summaryTemplateCtrls,{id : eachSectionInfo.target}));

                        //self.renderPanel($.extend({},templateNameAndCtrls,{id : eachSectionInfo.target}));
                    }

                    //controls.push(temp);

                })
            }

            if (this.optOrReqFlowSummaryList.required.length){
                populateOptOrReqSecContainerCtrlItems(sectionInfoCtrlObj[0],0);
            }

           if (this.optOrReqFlowSummaryList.optional && this.optOrReqFlowSummaryList.optional.length){
                controls.push({
                    id : 'optionalSummaryCaseSection',
                    type: '',
                    items : []
                })
                populateOptOrReqSecContainerCtrlItems(sectionInfoCtrlObj[1],1);
            }

            this.summaryTemplateControls = $.extend({},controls);

            return controls;
        },


        renderSummarySection: function(parentView, summaryView) {
            if (!summaryView) {
                // step Control not found
                return;
            }


            var $summaryPanel = $( "#" + summaryView.id,this.$el).find('.sectionContent');

            $.when(PanelView.prototype.renderPanel.call(parentView, summaryView, $summaryPanel)).done(_.bind(function(view) {

                this.listenTo(view, "save", _.bind(function(){
                    this.trigger("save");
                },this));

                this.listenTo(view, "reloadSummaryView", _.bind(function() {
                    /*view.remove();
                    view.render();*/
                    this.stopListening()
                    this.destroyControls();
                    this.renderAndFocus();
                    this.renderSummarySection(this, summaryView);
                    this.trigger("renderViewScroll")
                    if (this.populateSummmaryData) {
                        this.populateSummmaryData();
                    }
                },this));

                this.listenTo(view, "loadFormView", _.bind(function(screenId) {
                    this.loadFormView(screenId);
                },this));

            }, this));


        },


        loadFormView : function (screenId) {
          this.trigger("loadFormView",screenId)
        },
        getSummaryTemplate : function (sectionId,status) {

            var authorization =  this.model.toJSON();

            var showSummarySectionsForThisSectionIds = ['AuthActions','AuthInfo']

            var subFlowSummaryCtrls = $.extend({},{
                id: 'UnderConstructionId',
                config: {
                    //template: 'underConstruction',
                    controls: []
                }
            },{
                view: 'app/views/panelView'
            });


                if (sectionId === "Geospatial"
                    && authorization && authorization.shape){


                        var noContentControl = {
                            id:'notYetImplemented',
                            type:'gis/gisSummaryTemplate',
                            sectionId:sectionId || "#"
                        }

                        subFlowSummaryCtrls.config.controls.push(noContentControl);

                        return subFlowSummaryCtrls;


                       }


                   if ((status === "Available" || status === "NotAvail") && showSummarySectionsForThisSectionIds.indexOf(sectionId) == "-1"){
                        var showGetStarted = true;

                           if(status === "NotAvail"){
                               showGetStarted = false;
                           }

                            var noContentControl = {
                                id:'noContent',
                                showGetStarted: showGetStarted,
                                type:'common/noSummaryContent',
                                sectionId:sectionId || "#"
                            }
                            subFlowSummaryCtrls.config.noContent = true;
                            subFlowSummaryCtrls.config.controls.push(noContentControl);

                            return subFlowSummaryCtrls;
                     }


            switch (sectionId){

                case "BasicInfo":

                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/basicInfoSummaryView";
                    break;
                case "Contacts":

                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/contactSummaryView";
                    break;
                case "UseCode":

                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/useCodeSummaryView";
                    break;
                case "NCGU":

                    subFlowSummaryCtrls.view  ="app/views/caseFile/summaryViews/ncguSummaryView"
                    break;
                case "CRprocessing":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/costRecoveryProcessingSummaryView";
                    break;
                case "Screening":

                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/screeningSummaryView";
                    subFlowSummaryCtrls.config.summaryType = 'screen1And2';
                    break;
                case "AuthNeeded":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/screeningSummaryView";
                    subFlowSummaryCtrls.config.summaryType = 'authNeeded';
                    break;
                case "AuthSelection":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/authoritySelectionSummaryView";
                    break;
                case "manClauses":
                    //subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/application/mandatoryClauses";
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/mandatoryClauses";
                    break;
                case "secClauses":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/application/secondaryClauses";
                    break;
                case "nepaClauses":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/application/nepaApprovalDocs";
                    break;
                case "RentSheet":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/application/rentSheet";
                    break;
                case "AuthActions":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/authorization/authActions";
                    break;
                case "AuthInfo":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/authorization/authInfoSummary";
                    break;
                case "Appendices":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/authorization/appendicesSummary";
                    break;
                case "DocumentList":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/authorization/documentListSummary";
                    break;
                case "OptionalClauses":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/authorization/optionalClausesSummary";
                    break;
                case "Amendments":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/administration/amendmentsSummary";
                    break;
                case "Bonding":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/administration/bondingSummary";
                    break;
                case "Licenses":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/administration/licenseSummary";
                    break;
                case "Closure":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/administration/closureSummary";
                    break;
                case "Insurance":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/administration/insuranceSummary";
                    break;
                case "Oversight":
                    subFlowSummaryCtrls.view = "app/views/caseFile/summaryViews/administration/oversightSummary";
                    break;
            }

            return subFlowSummaryCtrls;
        },


        isEditable : function (status) {

            if (status.toLowerCase() !== "notReady".toLowerCase()){

                return true;
            }

            return false;
        },
        docsTabControls : function () {
            var controls = [];


            return controls;
        },

        acitivityLogTabControls : function () {
            var controls = [];


            return controls;
        },
        events: {
            /*'click .editDataPointLink' : "editDataPoint",*/
            'click .sectionFilter' : "filterSections",
            'click div[data-view-target]'  : function(event) {
                var $target = $(event.target),
                    target = $target.attr('data-view-target');
                $('.caseContent',this.$el).attr('data-view', target);
                this.setActiveTab($target);
            },
            'click .caseNavToggle' : function(e){

                e.preventDefault();
                var caseSections = $('.caseSections',this.$el) /* || $('.screenSections',this.$el)*/;
                $('.screenNav',this.$el).toggleClass('opened');
                caseSections.toggleClass('open');
            },
            /*'click .testingChanges' : function (event) {

             console.log("this is working in the child view")
             }*/

            //... other custom events go here...
        }, //We need this because PanelView is missing elements normally present in the EditorView


        editDataPoint : function (event) {

            event.preventDefault();

            var caption = $(event.target).closest('.badgeCardHeader').find('.badgeCardLabel').text().trim();
            var self = this;

            var options = {
                model: this.model,
                modalOptions : {
                    title : caption
                }
            };
            var editDataModalView = new EditDataModalView(options);

            Nrm.event.trigger("app:modal", {
                caption: caption,
                modalId: 'editDataPointModal',
                view: editDataModalView,
                backdrop: "static",
                animate : true,
                /* events:  { 'click #saveAndContinue': 'close' },*/
                callback: _.bind(function(modal) {


                },this)
            });
        },

        filterSections : function (event) {

            var filterDone = function () {
                $('.caseSection',this.$el).hide();
                $('.caseSection[data-status="done"]',this.$el).show();
                $('.navAnchorLink.status',this.$el).hide();
                $('.navAnchorLink.status.Done',this.$el).show();
            }, filterAll = function () {
                $('.caseSection',this.$el).show();
                $('.navAnchorLink.status',this.$el).show();
            }, filterToDo = function () {
                $('.caseSection',this.$el).hide();
                $('.caseSection[data-status != "done"]',this.$el).show();
                $('.navAnchorLink.status', this.$el).show();
                $('.navAnchorLink.status.Done', this.$el).hide();
            },  $target = $(event.target),
                status = $target.attr('data-filter'),
                filterSections = function(status) {
                    switch(status) {
                        case 'done':
                            filterDone();
                            break;
                        case 'todo':
                            filterToDo();
                            break;
                        default:
                            filterAll();
                }
            };

            this.setActiveTab($target);
            filterSections(status);
        },

        setActiveTab : function (targetTab) {
            $('.caseFiltersAndViews .tabHeading',this.$el).removeClass('active');
            $(targetTab).addClass('active');
        },

        render : function () {


            PanelView.prototype.render.apply(this, arguments)
            // if the view is being re-rendered after a save...
            this.renderSummaryTemplate();
            this.trigger('scrollToLastSectionOfCaseFile');

            return this;
        },

       /* scrollToLastSection : function (e) {
            var $target = $(e.target);
            e.preventDefault();

            var caseSections = $('.caseSections',this.$el);
            var renderView = $('.nrm-edit-form',this.$el);

            if ($target.attr('data-target') === '#home') {
                renderView.animate({
                    scrollTop: 0
                }, 500)
            } else {
                var dataTarget = $.attr(e.currentTarget, 'data-target');

                renderView.animate({
                    scrollTop: ($(dataTarget).offset().top - $(dataTarget).offsetParent().offset().top)
                }, 500);

            }

            if (caseSections.hasClass('open')) {
                caseSections.removeClass('open');
                $('.screenNav',this.$el).toggleClass('opened');
            }

            lastSectionTarget = e;
        },*/


        renderSummaryTemplate : function () {

            var summaryTemplateCtrls, self = this;

            function populateSummaryControlsAndLoadSummarySectionView(idx){

                if (self.summaryTemplateControls[idx]
                    && self.summaryTemplateControls[idx].items
                    && self.summaryTemplateControls[idx].items.length){

                    _.each(self.summaryTemplateControls[idx].items,function (eachSectionInfo) {

                        summaryTemplateCtrls = self.getSummaryTemplate(eachSectionInfo.sectionId,eachSectionInfo.sectionStatus);

                        if (summaryTemplateCtrls){
                            self.renderSummarySection(self, $.extend({},summaryTemplateCtrls,{id : eachSectionInfo.target}));
                        }

                    })
                }
            }
            populateSummaryControlsAndLoadSummarySectionView(0)
            populateSummaryControlsAndLoadSummarySectionView(1)


        },

        getOptionalAndRequiredFlowSummaryList : function (flowSummaryDtos) {

            var sectionInfoDtosByRequiredOrOptional = {
                required : [],
                optional : []
            }

            function getFlowSummaryDtoByIsRequiredOrOptional(flag){

                _.each(flowSummaryDtos,function (obj) {

                    if(flag == "R" && obj.optionalOrRequiredInd == "R"){
                        sectionInfoDtosByRequiredOrOptional.required.push(obj)
                    }else if(flag == "O" && obj.optionalOrRequiredInd == "O"){
                        sectionInfoDtosByRequiredOrOptional.optional.push(obj)
                    }
               })

            }
            _.indexBy(getFlowSummaryDtoByIsRequiredOrOptional("R"), 'displayOrder');
            _.indexBy(getFlowSummaryDtoByIsRequiredOrOptional("O"), 'displayOrder');

            return sectionInfoDtosByRequiredOrOptional;
        },

        getSectionInfoControlObj : function () {

            var optOrReqSubflowInfo = [{
                id: 'requiredFlows',
                items : []
                }],
                homeNavObj = {
                    statusClass : 'homeAnchor',
                    sectionName : 'Home',
                    target : 'home'
                },
                self = this;


            if (this.optOrReqFlowSummaryList){

                optOrReqSubflowInfo[0].items.push(homeNavObj);


               function populateOptOrReqSubflowInfoControlItems(sectionInfoDtoList, itemIdx){

                   _.each(sectionInfoDtoList,function (obj) {

                       var status = self.getUiStatus(obj),
                           sectionName = obj && obj.sectionName;


                       if (status && sectionName){
                           var temp = $.extend({},{
                               statusClass : 'status ' + status.charAt(0).toUpperCase() + status.slice(1),
                               status : status,
                               target : obj.sectionId
                           },obj)

                           optOrReqSubflowInfo[itemIdx].items.push(temp);
                       }

                   })
               }


               if (this.optOrReqFlowSummaryList.required.length){
                   populateOptOrReqSubflowInfoControlItems(this.optOrReqFlowSummaryList.required,0);
               }

                if (this.optOrReqFlowSummaryList.optional && this.optOrReqFlowSummaryList.optional.length){
                    optOrReqSubflowInfo.push({
                        id: 'optionalFlows',
                        items : []
                    })
                    populateOptOrReqSubflowInfoControlItems(this.optOrReqFlowSummaryList.optional,1);
                }



            }

            return optOrReqSubflowInfo;

        },

        getUiStatus :function (sectionInfo) {

            var uiStatus = sectionInfo && sectionInfo.sectionStatus;

            switch (uiStatus.trim()){

                case "Available" :
                    uiStatus = "ready"
                    break;
                case "Complete" :
                    uiStatus = "done"
                    break;
                case "InProgress" :
                    uiStatus = "inProgress"
                    break;
                case "NeedsAtten" :
                    uiStatus = "error"
                    break;
                case "NotAvail" :
                    uiStatus = "notReady"
                    break;
                default :
                    break;


            }

            return uiStatus;
        },

        populateSummmaryData : function () {

            var authorization = this.model.toJSON();
            var getAuthSummary = new GetAuthSummary({
                id :authorization.authorizationCn
            });
            var self = this;

            getAuthSummary.fetch({
                success: _.bind(function (model, resp, options) {
                    var summaryData = $.extend({},this.config,resp)
                    $('.summaryHeader',this.$el).html(CaseFileSummaryHeader(summaryData));
                    this.highlightRegion(summaryData.regionId);
                }, this),
                error: function (model, resp, options) {

                }
            });
        },

        highlightRegion : function (regionId) {
            var css =("fill", "#a5be00"),
                selector = '.detailSections .headerSection.locale svg';

            switch (regionId){

                case "01" :
                    $(selector + ' #Northern_Region').css("fill", "#a5be00");
                    break;

                case "02" :
                    $(selector + ' #Rocky_Mountain_Region').css("fill", "#a5be00");
                    break;

                case "03" :
                    $(selector + ' #Southwestern_Region').css("fill", "#a5be00");
                    break;

                case "04" :
                    $(selector + ' #Intermountain_Region').css("fill", "#a5be00");
                    break;

                case "05" :
                    $(selector + ' #Pacific_Southwest').css("fill", "#a5be00");
                    break;

                case "06" :
                    $(selector + ' #Pacific_Northwest').css("fill", "#a5be00");
                    break;

                case "07" :
                    $(selector + ' #Eastern_Region').css("fill", "#a5be00");
                    break;

                case "08" :
                    $(selector + ' #Southern').css("fill", "#a5be00");
                    break;

                case "09" :
                    $(selector + ' #Alaska').css("fill", "#a5be00");
                    break;

                default :
                    break;
            }

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
                    var self = this;
                    this.rendered = true;
                    this.setControlEnabled($('.suds-save-btn', this.$el), false);
                    //TODO : temporary fix need to think how to put this in the parentView and access from here or something
                    //this is added to so that on the case file the left hand navigation is fixed when scrolling down
                    var renderView = $(".nrm-edit-form");

                    this.pageTransitionTime = 500;
                    this.sectionNavOffsetFromRenderViewTop = $('.summaryHeader').height();

                    var sectionInfoDtos = this.parentModel.get('sectionInfoDtos'),
                        isAllReqStepsCompleted;

                    $.each(sectionInfoDtos,function (idx,obj) {

                        if (obj.optionalOrRequiredInd === "R"){
                            isAllReqStepsCompleted = true;
                        }
                    })


                    if (isAllReqStepsCompleted){
                        this.setControlEnabled($('.suds-save-btn', this.$el), true);
                    }

                    var caseFileId = this.model.get("caseFileId");
                    if(!(caseFileId.toLowerCase() === 'pre-propsal')){
                        this.populateSummmaryData();
                        this.config.recordId = this.model.get("authorizationId");
                    }




                    /*if(typeof(lastSectionTarget)!= "undefined"){
                        this.scrollToLastSection(lastSectionTarget);
                    }*/

                },
               "scrollToLastSectionOfCaseFile" : function (lastSectionTarget) {
                   /*debugger
                    var e = this.lastSectionTarget;*/
                   var e = lastSectionTarget && lastSectionTarget.event;
                  var  renderView =  $('.nrm-edit-form') || lastSectionTarget && lastSectionTarget.renderView

                   if (e){
                       debugger
                       var $target = $(e.target);

                       var dataTarget = $.attr(e.currentTarget, 'data-target');

                       renderView.animate({
                           scrollTop: ($(dataTarget).offset().top - $(dataTarget).offsetParent().offset().top)
                       }, 500);

                   }


               }
            });

        },




    });
});