define(['./panelView', "jquery", "nrm-ui", 'underscore','hbs!summary/summary','backbone'],
    function (PanelView, $, Nrm, _,summaryTemplate, Backbone) {

        return PanelView.extend({

            /*genericTemplate: 'addContactsToProposal/contacts',*/

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);
                /*config.controls=[{

                }]*/
                var model = this.model.toJSON();



                /*Region Forest and District*/

                this.regionForestDistrict=[
                    {
                        id:"regionId",
                        label : "Region",
                        value : model.regionId,
                        containerClass : "region"
                    },{
                        id:"forestId",
                        label : " Forest",
                        value : model.forestId,
                        containerClass : "forest"
                    },{
                        id:"districtId",
                        label : "District",
                        value : model.districtId,
                        containerClass : "district"
                    }]

                /* Dates header section*/

                this.dates=[]

                if(model.acceptedDate ||  model.receivedDate ){
                    this.dates.push({
                        id:"receivedDateId",
                        label : (model.acceptedDate ? "Date Accepted" : "Date Received"),
                        value : (model.acceptedDate ? model.acceptedDate : model.receivedDate),
                    })
                }

                if(model.activityBeginDate ){
                    this.dates.push({
                        id:"activityBeginDate",
                        label : "Date Activity Begins",
                        value : model.activityBeginDate,
                    })
                }

                if(model.activityEndDate){
                    this.dates.push({
                        id:"activityEndDate",
                        label : "Date Activity Ends",
                        value : model.activityEndDate,
                    })
                }



                /* Details header Section*/

                this.details=[]


                if( model.proponentType || model.applicantName){
                    this.details.push({
                        id:"proponentType",
                        label : (model.applicantName)? "Contact Name" :"Proponent Type",
                        value : (model.applicantName?  model.applicantName :model.proponentType),
                    })
                }

                if(model.primaryUseCode ){
                    this.details.push({
                        id:"primaryUseCode",
                        label : "Primary Use Code",
                        value : model.primaryUseCode,
                    })
                }

                if(model.status){
                    this.details.push({
                        id:"status",
                        label : "Status",
                        value : model.status,
                    })
                }
                /*Proposal Activity*/
            var proposalActivitySummary = model.proposalActivitySummary;


            if (model.proposalActivitySummary && !_.isEmpty(model.proposalActivitySummary)){

                this.proposalActivity = []



                if (proposalActivitySummary.activity){
                    this.proposalActivity.push({
                        id: 'activityBlock1',
                        label : "The activity is being<br>conducted at:",
                        description : proposalActivitySummary.activity
                    })
                }

                if (proposalActivitySummary.proposedActivityDesc){
                    this.proposalActivity.push({
                        id: 'activityBlock2',
                        label : "Description of<br>Proposed Activity:",
                        description : proposalActivitySummary.proposedActivityDesc
                    })
                }

                if (proposalActivitySummary.feeChargedInd == "Y"){
                    this.proposalActivity.push({
                        id : 'acitivityBlock3',
                        iconLabel : true,
                        iconLabelClass : 'dollar',
                        icon :'fa-usd',
                        wordLabel : 'Charge Fee',
                        description : "This activity includes charging for an entry or participation fee, or selling a good or service."
                    })
                }

                if (proposalActivitySummary.participants){
                    this.proposalActivity.push({
                        id : 'acitivityBlock4',
                        iconLabel : true,
                        iconLabelClass : 'users',
                        icon :'fa-users',
                        wordLabel : 'Multiple Participants',
                        description : proposalActivitySummary.participants
                    })
                }

                if (proposalActivitySummary.fsFacilityDesc){
                    this.proposalActivity.push({
                        id : 'acitivityBlock5',
                        iconLabel : true,
                        iconLabelClass : 'home',
                        icon :'fa-home',
                        wordLabel : 'Use FS Facility',
                        description : proposalActivitySummary.fsFacilityDesc
                    })
                }

                if (proposalActivitySummary.rightOfWay){
                    this.proposalActivity.push({
                        id : 'acitivityBlock6',
                        iconLabel : true,
                        iconLabelClass : 'road',
                        icon :'fa-road',
                        wordLabel : 'Use FS Road',
                        description : proposalActivitySummary.rightOfWay
                    })
                }

                if (proposalActivitySummary.fsLandUseReason){
                    this.proposalActivity.push({
                        id: 'activityBlock7',
                        label : "It is necessary to operate on<br>National Forest Service<br>land because",
                        description : proposalActivitySummary.fsLandUseReason
                    })
                }

                }


                return config;
            },

            events: $.extend({},
                PanelView.prototype.events,
                PanelView.prototype.changeEvents, {
                    'click .summaryModalCloseBtn' : function () {
                        $('.summaryOverlay',this.$el)
                            .fadeOut()
                            .removeClass('loaded');
                    }

                }),


            highlightRegion : function (regionId) {
                var css =("fill", "#a5be00"),
                    selector = '.summaryOverlay .headerSection.locale svg';

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

            /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
             'change:width': 'calculateMiles'
             'change:width': 'calculateMiles'
             }),*/

            render : function () {
                PanelView.prototype.render.apply(this, arguments);
                var model = this.model.toJSON();

                var templateData = _.extend({}, this, model);


                this.listenTo(this, {
                    'renderComplete': function() {

                        this.rendered = true;
                        this.setElement(this.$el.closest('.modal'));
                        this.$el.html(summaryTemplate(templateData));

                        setTimeout(function() {
                            $('.summaryOverlay',this.$el).addClass('loaded');

                        }, 200);

                        this.highlightRegion(model.regionId);
                    }
                });

            },

            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            /*startListening: function() {
                PanelView.prototype.startListening.apply(this,arguments);


                this.listenTo(this, {
                    'renderComplete': function() {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function

                        this.rendered = true;
                        this.setElement(this.$el.closest('.modal'));
                        this.$el.html(summaryTemplate(_.extend({}, { recordId: /!*this.model.get('recordId')*!/ 'hello World'}
                            )
                        ));


                    }
                });

            },*/

        });
    });