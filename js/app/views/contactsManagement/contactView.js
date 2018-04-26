define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui", "underscore", "require", "backbone",
    "app/views/contactsManagement/addNewForms/addNewMarriedView"], function (PanelView, $, Nrm, _, require,
                                                   Backbone, AddNewMarriedView) {

    return AddNewMarriedView.extend({

        genericTemplate : "contacts/contactView",

        getContactContentSectionControls: function () {

        },

       /* setModelId: function(){
            this.model.set('id', '69CD9C63-A0D2-4656-9D8C-DBCCBC71C8DE', {silent: true});
        },*/

        render: function () {

            var model = this.model.toJSON();
            this.contactView = true;//come back to this


            if (model){

                this.config.contactType = model.orgType.label;

                $.extend(this.config,model)
                /*if (model.orgRoleUrl){
                    this.config.orgRoleUrl = model.orgRoleUrl;
                }*/

                /*if (model.orgType.code){
                    this.config.contactTypeForm = model.orgType.code;
                    this.config.orgCn = model.id;
                }

                if (model.name){
                    this.config.orgName = model.name;
                }
                if (model.governmentInd){
                    this.config.governmentInd = model.governmentInd;
                }*/


            }





            return AddNewMarriedView.prototype.render.apply(this, arguments);;
        },

        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function () {

            AddNewMarriedView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    var self = this;
                    this.rendered = true;

                    $(".pillDataPointControls",this.$el).hide();
                }
            });

        },
    });
});