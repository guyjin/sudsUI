/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['nrm-map/collections/mapServiceCollection', 'underscore', 'backbone'],
    function(MapServiceCollection, _, Backbone) {

    return MapServiceCollection.extend({

        service: new Backbone.Model({
            "description": "PLSS Intersected is all of the PLSS feature at the atomic or smallest polygon level." +
            " This dataset represents the GIS Version of the Public Land Survey System including both rectangular and non-rectangular surveys. " +
            "The primary source for the data is cadastral survey records housed by the BLM supplemented with local " +
            "records and geographic control coordinates from states, counties as well as other federal agencies such as the " +
            "USGS and USFS. The data has been converted from source documents to digital form and transferred into a GIS " +
            "format that is compliant with FGDC Cadastral Data Content Standards and Guidelines for publication." +
            " This data is optimized for data publication and sharing rather than for specific 'production' or operation and maintenance.",
            "host": "EDW",
            "name": "TOWNSHIP",
            "id": "D75C3CAF604342289ECACA35AD973A04",
            "serviceType": "REST:ArcGIS Layer",
            /*"sourceLayer": "S_USA.AdministrativeForest",
            "status": "UP",*/
            "uri" : "https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/3",
            /*"useProxy": "N"*/
        }),

        model: Backbone.Model.extend({
            /*idAttribute: 'TWNSHPNO'*/
        }),


        translation: {
           /* 'STATEABBR' : 'STATEABBR',
            'TWNSHPNO' : 'TWNSHPNO',
            'TWNSHPFRAC' : 'TWNSHPFRAC',
            'RANGENO' : 'RANGENO',
            'FRSTDIVID' :'FRSTDIVID',
            'FRSTDIVNO' :'FRSTDIVNO',
            'SECDIVID' :'SECDIVID',
            'SECDIVNO' :'SECDIVNO',
            //'QSEC' :'THIRDDIV',
            'QQSEC' : 'THIRDDIV',
            'SURVNO' : 'THIRDDIVNO'*///this is not correct we need to combeack and fix this

            'STATEABBR': 'stateAbbr',
            'PRINMERCD': 'prinMerCd',
            'PRINMER': 'prinMer',
            'TWNSHPNO': 'twnShpNo',
            'TWNSHPFRAC': 'twnShpFrac',
            'TWNSHPDIR': 'twnShpDir',
            'RANGENO': 'rangeNo',
            'RANGEFRAC': 'rangeFrac',
            'RANGEDIR': 'rangeDir',
            'TWNSHPDPCD': 'twnShpDpcd',
            'PLSSID':  'plssId',
            'STEWARD': 'steward',
            'TWNSHPLAB': 'twnshpLab',
            'FRSTDIVID': 'frstDivId',
            'FRSTDIVNO': 'frstDivNo',
            'FRSTDIVDUP': 'frstDivdUp',
            'FRSTDIVTYP': 'frstDivType',
            'FRSTDIVTXT': 'frstDivTxt',
            'FRSTDIVLAB': 'frstDivLab',
            'SECDIVID': 'secDivId',
            'SECDIVNO': 'secDivNo',
            'SECDIVSUF': 'secDivSuf',
            'SECDIVTYP': 'secDivTyp',
            'SECDIVNOTE': 'secDivNote',
            'SECDIVTEXT': 'secDivText',
            'SECDIVLAB': 'secDivLab',
            'SURVTYP': 'survTyp',
            'SURVTYPTEXT': 'survTypText',
            'SURVNO': 'survNo',
            'SURVSUF': 'servSuf',
            'SURVNOTE': 'survNote',
            'SURVLAB': 'survLab',
            'ACRES': 'acres',
            'QSEC': 'qsec',
            'GOVLOT': 'govLot',
            'QQSEC': 'qqSec'

        },


        parse: function() {

            var resp = MapServiceCollection.prototype.parse.apply(this, arguments);

            return resp;
        }
    });

});

