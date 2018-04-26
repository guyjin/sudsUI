define(['../..', '../panelView', "jquery", "nrm-ui", 'underscore', 'backbone', 'app/models/authSelectionModel'],
    function (Suds, PanelView, $, Nrm, _, Backbone, AuthSelectionModel) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',

            getConfig: function () {
                debugger
                var config = PanelView.prototype.getConfig.apply(this, arguments);

                var authorization = this.model.toJSON();
                var deferred = new $.Deferred();
                var self = this;
                //this.model = new BasicInfoModel;`

                var authSelectionModel = new AuthSelectionModel({
                    id: authorization.authorizationCn
                });

                authSelectionModel.fetch({
                    success: function(model, resp, options){

                        var tabNames = ['Quick Answers']
                        config.controls = [
                            {
                                type: 'common/soloTabSummaryHeader',
                                screenName: {
                                    tabNames: tabNames
                                }
                            }, {
                                id: "level1Screening",
                                type: 'screening/level2Screening'
                            }
                        ]
                        deferred.resolve(config);
                        console.log(config.controls);
                    },
                    error: function(model, resp, options){
                        deferred.reject()
                    }
                });



                /*config.controls=[
                 {
                 "id": "primaryUseCodeContainer",
                 "nameAttr": "primaryUseCodeContainer",
                 "type": "authoritySelection/test-use-code-authority-combinations",
                 "tabHeading": "PRIMARY USE CODE: ### - Name of Use Code",
                 "items": [
                 {
                 "id": "primaryUseCodeBadgeCardContainer",
                 "type": "authoritySelection/test-badge-cards",
                 "items": [
                 {
                 "id": "authorityCard1",
                 "type": "authoritySelection/test-authority-card",
                 "authorityName": "FLPMA",
                 "isPrimary": true,
                 "items":[
                 {
                 "id": "infoBlock1",
                 "type": "authoritySelection/test-info-block",
                 "label": "Type",
                 "value": "Permit"
                 },
                 {
                 "id": "infoBlock2",
                 "type": "authoritySelection/test-info-block",
                 "label": "MAX TERM",
                 "value": "20/yrs"
                 },
                 {
                 "id": "infoBlock3",
                 "type": "authoritySelection/test-info-block",
                 "label": "TEMPLATE",
                 "value": "FS-2700-4b (Forest)"
                 }
                 ]
                 }
                 ]

                 }
                 ]

                 },
                 {
                 "id": "primaryUseCodeContainer",
                 "nameAttr": "primaryUseCodeContainer",
                 "type": "authoritySelection/test-use-code-authority-combinations",
                 "tabHeading": "SECONDARY USE CODE: ### - Name of Use Code",
                 "items": [
                 {
                 "id": "secondaryUseCodeBadgeCardContainer",
                 "type": "authoritySelection/test-badge-cards",
                 "items": [
                 {
                 "id": "authorityCard2",
                 "type": "authoritySelection/test-authority-card",
                 "authorityName": "Wilderness Act of 1964",
                 "isPrimary": false,
                 "items":[
                 {
                 "id": "infoBlock1",
                 "type": "authoritySelection/test-info-block",
                 "label": "Type",
                 "value": "Permit"
                 },
                 {
                 "id": "infoBlock2",
                 "type": "authoritySelection/test-info-block",
                 "label": "MAX TERM",
                 "value": "20/yrs"
                 },
                 {
                 "id": "infoBlock3",
                 "type": "authoritySelection/test-info-block",
                 "label": "TEMPLATE",
                 "value": "FS-2700-4b (Forest)"
                 }
                 ]
                 },


                 ]

                 }
                 ]

                 }
                 ]*/

                return deferred.promise();
            },

            events: {},

            modelEvents: {},

            render: function () {

                // this.model.set('uiAttributeOrder2',this.model.get('uiAttributeOrder18'));
                return PanelView.prototype.render.apply(this, arguments);


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
                    }
                });

            }

        });
    });