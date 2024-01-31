/**
 * @file
 * @see module:app/models/costRecovery/getCrEstimate
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.UpdateCrp = Backbone.Model.extend({

            url: function(){
                return 'api/recordservice/updateCrpSummary';
            }

            /*toJSON : function () {

                var displayOrderMap = this.get('displayOrderToUiAttribute'),
                    self = this;

                var toBeAddedSpecialistEstimate = {
                    crActivityTypeCn : this.get('role'),
                    name : this.get('name'),
                    processingTimeEst : this.get('processingTimeEst'),
                    monitoringTimeEst : this.get('monitoringTimeEst'),
                    scope : this.get('scope')

                };

                if (displayOrderMap){
                    var nepaCategory =  displayOrderMap[2];

                    _.each(nepaCategory.multipleSelectValues, function(item) {
                        if(item.id == self.get('role')){
                            toBeAddedSpecialistEstimate.role = item.value;
                        }
                    })

                    var nepaCategory =  displayOrderMap[2];

                    _.each(nepaCategory.multipleSelectValues, function(item) {
                        if(item.id == self.get('role')){
                            toBeAddedSpecialistEstimate.role = item.value;
                        }
                    })
                }


                this.set("toBeAddedSpecialistEstimateDto",toBeAddedSpecialistEstimate);

                return _.clone(this.attributes);
            },*/
        });
    });