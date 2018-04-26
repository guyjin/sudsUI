define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2'], function (PanelView, $, Nrm, _,select2) {
    return PanelView.extend({

        genericTemplate: 'selectProposalType',
        className: 'container suds-container',
        getConfig: function () {

            var controls = [
                {
                    id: 'approval-btn',
                    type: 'btn',
                    prop: 'proposalApprovalBtn',
                    btnStyle: "primary",
                    icon: "fa fa-form",
                    className: "proposalTypeSelected",
                    label: 'Standard Proposal Form',
                },
                {
                    id: 'approval-btn',
                    type: 'btn',
                    prop: 'proposalApprovalBtn',
                    btnStyle: "default",
                    icon: "fa fa-check",
                    className: "proposalTypeSelected",
                    label: 'Recreation Event Form',
                },
                {
                    id: 'approval-btn',
                    type: 'btn',
                    prop: 'proposalApprovalBtn',
                    btnStyle: "success",
                    icon: "fa fa-check",
                    className: "proposalTypeSelected",
                    label: 'Temporary Outfitter Guide Form ',
                },
            ]


            $.extend(this.options.config.controls, controls);

            return this.options.config;
        },

        events: {
            'click .approvalBtn' : 'proposalTypeSelected'
                //... other custom events go here...
            },


        proposalTypeSelected : function () {


        },

        render : function () {
            PanelView.prototype.render.apply(this, arguments);



            return this;
        }


    });
});