/**
 * @file        NRM Shape Editor jQuery plugin
 * @see module:nrm-map/nrmShapeEditor
 */
/** 
 * @module nrm-map/nrmShapeEditor
 * 
 */

define([
    'jquery', 
    'underscore', 
    'hbs!dropdown', 
    'nrm-ui',
    'nrm-ui/views/baseView', 
    'hbs!select',
    'nrm-ui/plugins/nrmContextMenu', 
    './collections/flmDataSourceCollection', 
    './views/flmView', 
    './models/flm',
    'nrm-ui/views/modalView',
    'esri/undoManager',
    'esri/geometry/geometryEngine',
    'esri/geometry/jsonUtils',
    'esri/geometry/Geometry',
    './nrmUndoOperation'
    ], 
function(
        $, 
        _, 
        template, 
        Nrm, 
        BaseView, 
        SelectTemplate,
        NrmContextMenu, 
        FLMDataSourceCollection, 
        FLMView, 
        FLM,
        ModalView,
        UndoManager,
        geometryEngine,
        geometryJsonUtils,
        Geometry,
        NrmUndoOperation
        ) {
    function getShapeTooltip(shapeVal, options, el) {
        var text = "";
        function formatUnit(msg, unit) {
            var lbl = unit && (unit.label || unit.unit || unit);
            if (_.isString(lbl)) msg += " in " + lbl;
            return msg;
        }
        if (!shapeVal) {
           text = (options && options.defaultTitle) || "Displays information about the geometry";
        } else if (shapeVal.x) {
            text = "Displays Longitude and Latitude coordinates of the point";
        } else if (shapeVal.paths) {
            text = formatUnit("Displays length of the line", options.lengthUnit);
        } else if (shapeVal.rings) {
          text = formatUnit("Displays area of the polygon", options.areaUnit);
        } else if (shapeVal.points) {
          text = "Displays number of points in the geometry";
        } else {
            text = "Unrecognized shape type";
        }
        if (el.prop('required')) {
            text = BaseView.formatRequiredFieldTitle(text);
        }
        return text;
    }
    function getModelId($el, options) {
        return (options && options.modelId) || $el.data('nrmShapeEditorModelId');
    }
    function getShapeVal($el, options) {
        var shapeVal = (options && options.shapeVal) || $el.data('nrmShapeEditorValue');
        return shapeVal && _.has(shapeVal, "shape") ? shapeVal.shape : shapeVal;
    }
    function getShapeString($el) {
        return $el.data('nrmShapeEditorStrvalue');
    }
    function getShapeAttributes(options, useShapeName) {
       var model = options.model;
       if (useShapeName && model && model.shapeName) {
           return model.get(model.shapeName);
       } else if (model) {
            if (options.nestedShape) {
                return Nrm.app.getModelVal(model, options.prop);
            } else {
                return {
                    shape: Nrm.app.getModelVal(model, options.prop),
                    dataSource: Nrm.app.getModelVal(model, options.flmDataSource),
                    revisionDate: Nrm.app.getModelVal(model, options.flmRevDate),
                    accuracy: Nrm.app.getModelVal(model, options.flmAccuracy)
                };
            }
       } else if (options.value && _.has(options.value, "shape")) {
           return options.value;
       } else if (!options.value || !_.isEmpty(options.value)) {
           return { shape: options.value };
       } else {
           return {};
       }
    }
    function flmHeaderTitle(options) {
        var shape = getShapeAttributes(options, !options.triggerFlmChange); //options.model.get(options.model.shapeName);
        var ds = "", dsModel;
        if (shape && shape.dataSource) {
            ds = shape.dataSource;
            if (this.flmDataSourceCollection) {
                dsModel = this.flmDataSourceCollection.get(shape.dataSource);
                ds += ": " + ((dsModel && dsModel.get('description')) || "");
            }
        }
        var prefix = this.readonly ? "" : (Nrm.app.shapeIsEmpty(shape && shape.shape) ? "Geometry is required to edit " : "Click to edit ");
        return prefix + "Feature Level Metadata"
               + "\n Data Source: " + (ds || "") 
               + "\n Revision Date: " + ((shape && Nrm.app.formatValue(shape.revisionDate, "date")) || "")
               + "\n Accuracy: " + ((shape && shape.accuracy) || "");
    }
    function getShapeActions($el, options) {
        var items = [];
        var that = this;

        var ids = options.items ? _.map(options.items, function(item) {
            return item.id;
        }) : [];
        var editItem = {
            id: options.id + "-menu-edit",  
            label: "Edit shape",
            className: "nrm-shape-edit nrm-shape-undo"
        };
        if (options.delegateEvents) {
            this.menuEvents = this.menuEvents || { };
            this.menuEvents["#" + editItem.id] = function(e) {
                e.preventDefault();
                $el.nrmShapeEditor("activateShapeEditTool", options);
            };
        }
        if ($.inArray(editItem.id, ids) <= -1)
            items.push(editItem); 
        
        var rtypes = options.spatialTypes;
    
        var alignSubmenu = options.alignRightSubmenu || "pull-left",
                submenuClass = "dropdown-submenu" + (alignSubmenu === true ? "" : " " + alignSubmenu);
        if (rtypes && rtypes.length > 0) {
            var activateToolFunc = function(rowtype) {
                return function(e) {
                    e.preventDefault();
                    $el.nrmShapeEditor("activateShapeTool", { shapeType: rowtype, control: options });
                };
            };
            var createItem, createReplaceParent;
            if (rtypes.length > 1) {
                createItem = {
                    id: options.id + "-menu-create-submenu",
                    label: "Create shape",
                    className: submenuClass + " nrm-shape-replace",
                    items: createReplaceParent = []
                };
            } else {
                createReplaceParent = items;
            }
            for (var i = 0; i < rtypes.length; i++) {
                var rtype = rtypes[i];
                if (rtype === "point" || rtype === "multipoint" ||
                    rtype === "line" || rtype === "polygon" || rtype === "rectangle") {
                    var id = options.id + "-menu-create-" + rtype;
                    if ($.inArray(id, ids) <= -1) {
                        createReplaceParent.push({
                            id: id,  
                            className: options.allowReplace ? "nrm-shape-replace" : "nrm-shape-create",
                            //label: "Create" + ((rtypes.length > 1) ? " as " + rtype : " shape"),
                            label: ((rtypes.length > 1) ? "as " + rtype : "Create shape"),
                            group: rtypes.length === 0 && i === 0
                        });
                    }
                    if (options.delegateEvents) {
                        this.menuEvents["#" + id] = activateToolFunc(rtype);
                    }
                }
            }
            if (rtypes.length > 1)
                items.push(createItem);     
        }
        
        if (options.allowMultipart) {
            var partSubmenu = {
                id: options.id + "-part-submenu",
                label: "Edit multipart features",
                className: submenuClass, //"dropdown-submenu pull-left",
                items: []
            };
            var addPartItem = {
                id: options.id + "-addpart",  
                label: "Add a part",
                title: "Add a part to a multipart feature",
                //group: true,
                className: "nrm-shape-addpart nrm-shape-edit"
            };
            partSubmenu.items.push(addPartItem);
            //items.push(addPartItem);
            if (options.delegateEvents) {
                var addPartEventHandler = function(e) {
                    var attributes = {
                         id: getModelId($el, options),
                         elemId: options.id
                         ,selectionHandler: function(graphic){console.log("selectionHandler", graphic);}
                     };
                     if (options.subtype)
                         attributes.subtype = options.subtype;
                    e.preventDefault();
                    /**
                     * Application initialized event, triggered once during startup.
                     * @param {Object} options
                     * @param {module:nrm-map/nrmShapeEditor~Geometry} options.geometry The geometry object
                     * @param {Object} options.attributes Attributes to set on the graphic
                     * @event module:nrm-ui/event#map:addPart
                     */
                    Nrm.event.trigger("map:addPart", {
                       //model: options.model,
                       //prop: options.prop,
                       geometry: getShapeVal($el, options),
                       attributes: attributes
                    });
                };
                this.menuEvents["#" + addPartItem.id] = addPartEventHandler;
            }
            
            if (options.allowBuffer) {
                addPartItem = {
                    id: options.id + "-addbufferpart",
                    label: "Add a part via Buffer",
                    title: "Add to a multipart polygon by creating a buffer",
                    className: "nrm-shape-addpart nrm-shape-edit nrm-shape-addbufferpart"
                };
                partSubmenu.items.push(addPartItem);
                if (options.delegateEvents) {
                    var addPartBufferEventHandler = function(e) {
                        var shape = getShapeVal($el, options);
                        options.geometry = shape;
                        var attributes = {
                            appendTo: shape, //prjUtils.geographicToWebMercator(shape);
                            shapeType: "polygon",
                            id: getModelId($el, options),
                            elemId: options.id
                        };
                        if (options.subtype) {
                            attributes.subtype = options.subtype;
                        }

                        e.preventDefault();
                        /**
                        * Launch buffer workflow view.
                        * @event module:nrm-ui/event#map:buffer
                        * @param {Object} options.attributes Attributes to set on the graphic.
                        * @param {external:module:esri/Geometry} [options.attributes.appendTo] Geometry new part will be added to.
                        * @param {external:module:esri/Geometry} geometry Initial geometry for buffer workflow.
                        * @returns {undefined}
                        */
                        Nrm.event.trigger("map:buffer", {
                            caption: "Add Part Via Buffer",
                            attributes: attributes,
                            geometry: null
                        });
                    };                
                    this.menuEvents["#" + addPartItem.id] = addPartBufferEventHandler;
                }
            }
            
            var deletePartItem = {
                id: options.id + "-deletepart",  
                label: "Delete a part", 
                title: "Delete part of a multipart feature",
                group: false,
                className: "nrm-shape-delpart nrm-shape-edit"
            };
            partSubmenu.items.push(deletePartItem);
            //items.push(deletePartItem);
            if (options.delegateEvents) {
                var deletePartEventHandler = function(e) {
                    var attributes = {
                         id: getModelId($el, options),
                         elemId: options.id
                         ,selectionHandler: function(graphic){console.log("selectionHandler", graphic);}
                     };
                     if (options.subtype)
                         attributes.subtype = options.subtype;
                    e.preventDefault();
                    /**
                     * Activate a tool to delete a part from a geometry.
                     * @event module:nrm-ui/event#map:deletePart
                     * @param {Object} options
                     * @param {module:nrm-map/nrmShapeEditor~Geometry} options.geometry The geometry object
                     * @param {Object} options.attributes Attributes to set on the graphic
                     * @returns {undefined}
                     */
                    Nrm.event.trigger("map:deletePart", {
                       //model: options.model,
                       //prop: options.prop,
                       geometry: getShapeVal($el, options),
                       attributes: attributes
                    });
                };                
                this.menuEvents["#" + deletePartItem.id] = deletePartEventHandler;
            }
            items.push(partSubmenu);
         }
        
        var importSubmenu = options.allowCopy && options.allowImport ? 
                {
                    id: options.id + "-import-submenu",
                    label: "Import",
                    className: submenuClass, //"dropdown-submenu pull-left",
                    items: []
                } : false,
            importItems = importSubmenu ? importSubmenu.items : items;
        if (options.allowCopy) {
            var copyFeatureItem = {
                id: options.id + "-copyfeature",  
                label: "Copy from map layer",
                group: !importSubmenu
            };
            importItems.push(copyFeatureItem);
            if (options.delegateEvents) {
                var copyFeatureEventHandler = function(e) {
                    //console.log("copyFeatureEventHandler", e);
                    var attributes = {
                         id: getModelId($el, options),
                         elemId: options.id
                         ,selectionHandler: function(graphic){console.log("selectionHandler", graphic);}
                         ,callback: function(graphic){console.log("callback", graphic);}
                     };
                     if (options.subtype)
                         attributes.subtype = options.subtype;
                    e.preventDefault();
                    /**
                     * Copy feature from a map service
                     * @event module:nrm-ui/event#map:copyFeature
                     * @param {Object} options
                     * @param {string[]} [options.geometryTypes] - Enable selection of "point", "line", and/or "polygon"
                     * @param {Object} options.attributes
                     * @param {string} options.attributes.elemId Element id of the 
                     * {@link module:nrm-map/nrmShapeEditor|nrmShapeEditor} input field.
                     */
                    Nrm.event.trigger("map:copyFeature", {
                    //Nrm.event.trigger("context:mapSelect", {
                       attributes: attributes
                       ,callback: attributes.callback
                       ,geometryTypes:options.allowMultipart && options.spatialTypes.indexOf("point") > -1 ?
                                            options.spatialTypes.concat("multipoint") :
                                            options.spatialTypes
                    });
                };                
                this.menuEvents["#" + copyFeatureItem.id] = copyFeatureEventHandler;
            }
        } 
        if (options.allowImport) {
            var importShapefileItem = {
                id: options.id + "-importshapefile",  
                label: "Import from shapefile",
                group: !importSubmenu
            };
            importItems.push(importShapefileItem);
            if (options.delegateEvents) {
                var importShapefileEventHandler = function(e) {
                    var attributes = {
                         id: getModelId($el, options),
                         geometryTypes:options.spatialTypes,
                         elemId: options.id
                     };
                     if (options.subtype)
                         attributes.subtype = options.subtype;
                    e.preventDefault();
                    
                    /**
                     * Import from a shapefile
                     * @event module:nrm-ui/event#map:importShapefile
                     * @param {Object} options Options that will be passed to the "map:endDraw" event when the user 
                     * selects a feature to import
                     * @param {Object} options.attributes
                     * @param {string} options.attributes.elemId Element id of the 
                     * {@link module:nrm-map/nrmShapeEditor|nrmShapeEditor} input field.
                     */
                    Nrm.event.trigger("map:importShapefile", {
                       attributes: attributes
                    });
                };                
                this.menuEvents["#" + importShapefileItem.id] = importShapefileEventHandler;
            }
        }
        if (importSubmenu)
            items.push(importSubmenu);
        
        if (options.allowBuffer) {
            var bufferItem1 = {
                id: options.id + "-buffer",
                label: "Buffer",
                className: "nrm-shape-buffer nrm-shape-edit"
            };

            if ($.inArray(editItem.id, ids) <= -1)
                if ($el[0].id !== "bufferShape") {
                    items.push(bufferItem1);
                }
             
            if (options.delegateEvents) {
                var bufferFeatureEventHandler = function(e) {
                    var shape = getShapeVal($el, options);
                    options.geometry = shape;
                    var attributes = {
                         id: getModelId($el, options),
                         elemId: options.id //"bufferShape" 
                     };
                     if (options.subtype) {
                         attributes.subtype = options.subtype;
                     }
                    
                    e.preventDefault();
                    Nrm.event.trigger("map:buffer", {
                        attributes: attributes,
                        geometry: shape
                    });
                };                
                this.menuEvents["#" + bufferItem1.id] = bufferFeatureEventHandler;
            }
        } 
        if (options.allowClear) {
            var removeItem = {
                id: options.id + "-menu-clear",
                label: "Clear shape",
                group: items.length > 0,
                className: "nrm-shape-edit"
            };
            if ($.inArray(removeItem.id, ids) <= -1)
                items.push(removeItem);  
            if (options.delegateEvents) {
                this.menuEvents["#" + removeItem.id] = function(e) {
                    e.preventDefault();
                    var attributes = {
                        id: getModelId($el, options),
                        elemId: options.id
                    };
                    if (options.subtype)
                        attributes.subtype = options.subtype;
//                    Nrm.event.trigger("map:featureEdit", {
                    Nrm.event.trigger("map:endDraw", {
                       geometry: null,
                       attributes: attributes
                    });
                    $el.nrmShapeEditor("deactivateShapeTool", { clearForm: true });
                };
            }
        }
        if (options.items && options.items.length > 0) {
            var group = items.length > 0;
            _.each(options.items, function(item) {
                if (group) {
                    item.group = true;
                    group = false;
                }
                items.push(item);
            });
        }
        if (options.allowFlm) {
            var flmHeader = {
                id: options.id + "-menu-flmHeader",
                group: items.length > 0,
                title: flmHeaderTitle.call(this, {
                    value: $el.data('nrmShapeEditorValue')
                }),
                label: "Feature level metadata",
                className: "nrm-shape-edit"
            };
            this.flmHeaderSelector = "#" + flmHeader.id;
            items.push(flmHeader);
            if (options.delegateEvents) {
                var flmEventHandler = function(e) {
                    var useShapeName = options.model && options.model.shapeName && !options.triggerFlmChange;
                    var shape = getShapeAttributes(options, useShapeName) || { }; //options.model.get(options.model.shapeName);
                    e.preventDefault();
                    that.flmModel = new FLM({ //at runtime: fn.nrmShapEditor! 
                        dataSource: shape.dataSource,
                        revisionDate: shape.revisionDate,
                        accuracy: shape.accuracy
                        //,persist: options.persist ? true : false
                    });
                    that.flmModel.on('change', function(){
                        var k, v, changedPairs = _.pairs(this.changed);
                        for (var i = 0; i < changedPairs.length; i++) {
                            k = changedPairs[i][0];
                            v = changedPairs[i][1];
                            shape[k] = v;
                            //Nrm.app.setModelVal(options.model, k, v);
                        }
                        $el.nrmShapeEditor("updateFlm", { 
                            model: useShapeName ? null : options.model, 
                            attributes: shape, 
                            triggerChange: !useShapeName
                        });
                    });
                    that.flmView = new FLMView({model: that.flmModel, dataSources: that.flmDataSourceCollection });
                    Nrm.event.trigger("app:modal", {
                        caption: "Feature Level Metadata",
                        buttons: ModalView.UPDATE_CANCEL,
                        backdrop: "static",
                        view: that.flmView,
                        focusEl: '#' + options.id,
                        callback: function(modal, btn) {
                            if (btn.is(".saveModal")) {
                                that.flmModel.set(that.flmView.model.attributes);
                            }
                        }
                    });
                };
                this.menuEvents[this.flmHeaderSelector] = flmEventHandler;
            }
        }
        return items;      
    }
    function renderShape($el, options) { //shapeValue, attributes, options) {
        var shape = getShapeVal($el, options);
        if (shape) {
            /**
             * Display a graphic in the map
             * @event module:nrm-ui/event#map:addGraphic
             * @param {module:nrm-map/nrmShapeEditor~Geometry} geometry The geometry to edit
             * @param {Object} attributes The attributes to set on the graphic
             * @param {options} options
             * @param {Boolean} [options.zoomTo=true] Zoom to the geometry to edit.
             * @param {Boolean} [options.select=true] Add selection graphic for the geometry to edit.
             * @param {Boolean} [options.sticky=true] Sets the "sticky" edit graphic, which is not removed if the user 
             * clicks the map outside of the geometry to edit.
             * @param {Boolean} [options.disableSelection=true] Disable selection on all layers.
             */
            Nrm.event.trigger("map:addGraphic", shape, { id: getModelId($el, options) }, { sticky: true });
        }
    }
    function activateShapeTool($el, options) {
        options = $.extend({ }, this.options, options);
        var rowtype = options.shapeType;
        var shapeProp = options.control.prop || options.propName;
        var valid = shapeProp && (options.control.spatialTypes ? $.inArray(rowtype, options.control.spatialTypes) > -1 :
           (rowtype === "point" || rowtype === "polygon" || rowtype === "line" || rowtype === "multipoint"));
        if (valid) {
            var attributes = { 
                     id: getModelId($el, options),
                     elemId: $el.attr("id"),
                     propName: shapeProp
                 };
            if (options.control.subtype)
                attributes.subtype = options.control.subtype;
            var options = { stickyGraphic: true };
            /**
             * Activate the Draw tool to sketch a geometry
             * @event module:nrm-ui/event#map:activateDrawMode
             * @param {string} geomType Geometry type, supported values include "point", "multipoint", "line", 
             * "polygon", and "rectangle"
             * @param {Object} attributes Attributes to set on the graphic
             * @param {Object} options
             * @param {Boolean} [options.stickyGraphic=false] Reset the "sticky" edit graphic so that it is cleared or
             * set to the new graphic when the draw tool completes.
             * @param {Boolean} [options.disableSelection=true] Disable selection on all layers.
             */
            Nrm.event.trigger("map:activateDrawMode", rowtype, attributes, options);
        }
       
    }
    function deactivateShapeTool($el, options) {
        console.info("nrmShapeEditor.deactivateShapeTool", arguments);
        var opt;
        if (options && options.clearForm)
            opt = { clearFeatures: true, id: getModelId($el, options) };
        /**
         * Deactivate the active tool in the map.
         * @event module:nrm-ui/event#map:disableEditing
         * @param {Object} options
         * @param {Boolean} [options.clearFeatures=false] Remove graphics 
         * @param {string|Number} [options.id] Only remove the graphic with matching id.
         */
        Nrm.event.trigger("map:disableEditing", opt);
        
    }
    function activateShapeEditTool($el, options) {
        var shapeVal = $el.nrmShapeEditor.val($el), shape = shapeVal && shapeVal.shape;
        // Create deep copy of the shape using $.extend because esri.Graphic passing JSON object by reference.
        // Without the deep copy, all edits to the graphic will be reflected in the model attribute,
        // and while that might seem like a convenient side-effect, it means the model won't trigger the expected change event.
        var geometry = (Nrm.app.shapeIsEmpty(shape)) ? null : $.extend(true, { }, shape);
        var attributes = { 
            id: getModelId($el, options),
            elemId: $el.attr("id"),
            propName: options.prop,
            // JS 10/25/2017: preserve original FLM data source, maybe not appropriate in all cases, but probably 
            // better than resetting to 00: Unknown in most cases.
            flmDataSource: shapeVal && shapeVal.dataSource
        };
        /**
         * Activate the geometry edit tool.
         * @event module:nrm-ui/event#map:activateEditMode
         * @param {external:module:esri/geometry/Geometry|Object} geometry The geometry to edit
         * @param {Object} attributes The attributes to set on the graphic
         * @param {options} options
         * @param {Boolean} [options.zoomTo=true] Zoom to the geometry to edit.
         * @param {Boolean} [options.select=true] Add selection graphic for the geometry to edit.
         * @param {Boolean} [options.sticky=true] Sets the "sticky" edit graphic, which is not removed if the user 
         * clicks the map outside of the geometry to edit.
         * @param {Boolean} [options.disableSelection=true] Disable selection on all layers.
         */
        Nrm.event.trigger("map:activateEditMode", geometry, attributes, {
            undoManager: this.undoManager,
            zoomTo: {suppressIfPartial: true}
        });
    }
    function applyShapeValue(el, options) {
        options = $.extend({ }, this.options, options);
        var strvalue, 
                modelId = (options.model && (options.model.id || options.model.cid)) || options.modelId, 
                shapeValue = getShapeAttributes(options), 
                shapeJson = shapeValue && shapeValue.shape,
                existingShape = getShapeString(el),
                existingShapeValue = el.data('nrmShapeEditorValue'),
                existingId = getModelId(el),
                flmChanged = false,
                shapeChanged = false,
                shapeEl,
                readOnly = this.readonly,
                editComplete = options.editComplete !== false,
                shapeValSelector = editComplete && el.attr('data-target-shape');
        
        if (options.readonly !== undefined) {
            this.readonly = options.readonly;
        }
        if (shapeJson) {
            if (typeof shapeJson === 'string' ||  shapeJson instanceof String) {
                strvalue = shapeJson;
                try {
                  shapeJson = JSON.parse(shapeJson);
                } catch (error) {
                    console.warn("JSON parse error: " + error);
                    shapeJson = undefined;
                }
            }
            if (!options.updating) {
                shapeJson = cleanupGeometry(shapeJson);
            }
            strvalue = JSON.stringify(shapeJson);
        } else if (shapeJson !== undefined) {
            strvalue = "";
            shapeJson = null;
        } else {
            shapeJson = existingShapeValue && existingShapeValue.shape;
        }
        // use _.extend here instead of $.extend to ensure object has shape key even if shapeJson is undefined
        shapeValue = _.extend({}, shapeValue, {shape: shapeJson});
        
        if (shapeValSelector && strvalue !== undefined) {
            // If it exists, the data-target-shape element is a hidden input used for data binding.
            // The value only updates when an editing operation is completed.
            shapeEl = $(shapeValSelector, el.parent());
            if (shapeEl.val() !== strvalue) {
                shapeEl.val(strvalue);
                if (options.triggerChange) {
                    shapeEl.trigger('change');
                }
            }
        }
        
        // check for changed FLM attributes
        flmChanged = options.allowFlm && editComplete &&
                _.find(['dataSource', 'revisionDate', 'accuracy'], function(key) {
                    var newVal = shapeValue[key], oldVal = existingShapeValue && existingShapeValue[key];
                    return newVal !== undefined && newVal !== oldVal;
                });
        
        shapeChanged = strvalue !== undefined && strvalue !== existingShape;
        
        if (modelId !== undefined && modelId !== existingId) {
            el.data('nrmShapeEditorModelId', modelId);
        }
        
        if (shapeChanged) {
            el.data('nrmShapeEditorStrvalue', strvalue);
        } else if (!existingShapeValue) {
            shapeChanged = true;
        }
        
        if (flmChanged || shapeChanged) {
            // use $.extend here instead of _.extend to keep existingShapeValue.shape if shapeValue.shape is undefined
            existingShapeValue = (existingShapeValue && $.extend(existingShapeValue, shapeValue)) || shapeValue;
            el.data('nrmShapeEditorValue', existingShapeValue);
        }
        
        if (flmChanged) {
            // update FLM internals like hidden control values and menu item title tag without triggering change events
            this.updateFlm(el, {
                attributes: shapeValue,
                triggerChange: false
            });
        }

        if (readOnly === this.readonly && !shapeChanged) {
            // the remainder of this method changes geometry-related state so we are done here if shape did not change.
            return this;
        }
        
        if (shapeChanged) {
            // update display value
            if (!shapeJson) {
                el.val("");
            } else if (shapeJson.x || (shapeJson.points && shapeJson.points.length === 1)) {
                var x = shapeJson.x || shapeJson.points[0][0];
                var y = shapeJson.y || shapeJson.points[0][1];
                if ($.isNumeric(x)) {
                    el.val(x.toFixed(4) + ", " + y.toFixed(4));
                } else {
                    el.val("Empty");
                }
            } else if (shapeJson.points) {
                 el.val("# Points: " + shapeJson.points.length);                   
            }
            else if (shapeJson.rings || shapeJson.paths) {
                el.val("Loading...");
                var isPolygon =  shapeJson.rings;
                var unit = isPolygon ? options.areaUnit : options.lengthUnit;
                var esriUnit = (unit && unit.unit) || (_.isString(unit) && unit);
                function geomCalcFailed() {
                    el.val((isPolygon ? "Area" : "Length") + " not available" );
                }
                if (esriUnit) {
                    function esriGeodesicCalc(fn, type) {
                        try {
                            var m = fn([new type(shapeJson)], esriUnit);
                             if (m && m.length > 0)
                                el.val(Math.abs(m[0].toFixed(3)) + " " + unit.abbr || esriUnit);
                            else
                                geomCalcFailed();
                        } catch (error) {
                            console.warn(error);
                            geomCalcFailed();
                        }
                    }
    //                if (esri && esri.geometry) {
    //                    isPolygon ? esriGeodesicCalc(esri.geometry.geodesicAreas, esri.geometry.Polygon) :
    //                            esriGeodesicCalc(esri.geometry.geodesicLengths, esri.geometry.Polyline);
    //                } else {
                        require(["esri/geometry/geodesicUtils", isPolygon ? "esri/geometry/Polygon" : "esri/geometry/Polyline"], function(geodesicUtils, type) {
                           esriGeodesicCalc(isPolygon ? geodesicUtils.geodesicAreas : geodesicUtils.geodesicLengths, type); 
                        });
                    //}
                } else {
                    geomCalcFailed();
                }
            }
        }
        if (el && el.length > 0) {
            var parent = el.parent();
            el.attr("title", getShapeTooltip(shapeJson, options, el));
            if (!this.readonly) {
                var editItem = $(".nrm-shape-edit", parent);
                var createItem = $(".nrm-shape-create", parent);
                //var addPartItem = $(".nrm-shape-edit", parent);
                var deletePartItem = $(".nrm-shape-delpart", parent);
                var empty = Nrm.app.shapeIsEmpty(shapeJson);
                if (empty) {
                    BaseView.setControlEnabled(editItem.not(".nrm-shape-create,.nrm-shape-undo,.nrm-shape-buffer"), false);
                    BaseView.setControlEnabled(editItem.filter(".nrm-shape-undo"), (this.undoManager.canUndo || this.undoManager.canRedo));
                    BaseView.setControlEnabled(createItem, true);
                } else {
                    BaseView.setControlEnabled(editItem, true);
                    BaseView.setControlEnabled(createItem.not(".nrm-shape-edit"), false);
                    // enable deletePart only if there's more than one part
                    var enableDeletePart = false,
                        enableBufferPart = false;
                    if (shapeJson.paths && shapeJson.paths.length > 1) {
                        enableDeletePart = true;
                    } else if (shapeJson.rings) {
                        if (shapeJson.rings.length > 1) {
                            enableDeletePart = true;
                        }
                        if (options.allowBuffer && shapeJson.rings.length > 0) {
                            enableBufferPart = true;
                        }
                    } else if (shapeJson.points && shapeJson.points.length > 1) {
                        enableDeletePart = true;
                    }
                    BaseView.setControlEnabled($(".nrm-shape-addbufferpart", parent), enableBufferPart);
                    if (!enableDeletePart) {
                        BaseView.setControlEnabled(deletePartItem, false);
                    }
                }
                BaseView.setControlEnabled(editItem.filter(".nrm-shape-buffer"), options.spatialTypes.indexOf("polygon") > -1);
            } else {
                var disableItems = $("ul.dropdown-menu>li", parent).not(".nrm-enable-readonly,.divider,.dropdown-header,.dropdown-submenu");
                BaseView.setControlEnabled(disableItems, false);
            }
            var replaceItems = $(".nrm-shape-replace", parent);
            $.each(replaceItems, function() {
                var $this = $(this);
                var content = $this.html();
                var newContent = content.replace(empty ? "Replace" : "Create", empty ? "Create" : "Replace");
                if (newContent !== content)
                    $this.html(newContent);
            });
//            var $flmSelector = $(".nrm-shape-flmsource", parent);
//            if ($flmSelector.length && options.model) {
//                var newVal = Nrm.app.getModelVal(options.model, options.flmDataSource);
//                $flmSelector.val(newVal);
//                if (this.options.items) {
//                    _.each(this.options.items, function(item) {
//                       if (item.id === this.options.flmDataSourceId) 
//                           item.value = newVal;
//                    }, this);
//                }
//                var onChange = function(e){
//                    console.log('flmSelector.change to ' + e.target.value,e, options);
//                    // Note: this assumes "nested" shape, which might not be correct.
//                    options.model.attributes.shape.dataSource = e.target.value;
//                    //$('#flmHeader').prop('title', that.flmHeaderTitle());
//                    that.updateFlmHeaderTitle(el, options);
//                };
//                $flmSelector.on('change', onChange);
//            }
//            if (options.readonly)
//                BaseView.setControlEnabled($flmSelector, false);

        }
        return this;
    }
    function updateFlm(el, options) {
        options = $.extend({ }, this.options, options);
        if (options.allowFlm !== false) {
            var changed = false,
                    flmOptions = {
                        dataSource: 'flmDataSource',
                        revisionDate: 'flmRevDate',
                        accuracy: 'flmAccuracy'
                    },
                    shapeValue = el.data('nrmShapeEditorValue') || {},
                    flmAttributes = _.pick(options.attributes, _.keys(flmOptions));

            if (!flmAttributes.revisionDate && flmAttributes.revisionDate !== null) {
                flmAttributes.revisionDate = new Date().toISOString();
            }
            
            _.each(flmAttributes, function(value, attr) {
                if (value === undefined) {
                    return;
                }
                var $target, targetSelector = el.attr('data-target-' + attr);
                if (!changed) {
                    changed = shapeValue[attr] === value;
                }
                shapeValue[attr] = value;
                if (options.model && !options.nestedShape) {
                    Nrm.app.setModelVal(options.model, options[flmOptions[attr]], value);
                }
                if (targetSelector) {
                    $target = $(targetSelector, el.parent());
                    if ($target.val() !== value) {
                        $target.val(value);
                        if (options.triggerChange) {
                            $target.trigger('change');
                        }
                    }
                }
            });
            if (changed && options.model && options.nestedShape) {
                Nrm.app.setModelVal(options.model, options.prop, shapeValue);
            }

            if (changed && options.triggerChange) {
                el.data('nrmShapeEditorValue', shapeValue).trigger("flmChange.nrm.shapeEditor");
            } else {
                el.data('nrmShapeEditorValue', shapeValue);
            }
            this.updateFlmHeaderTitle(el);
        }
    }
    function updateFlmHeaderTitle($el, options) {
        var flmHeader = this.flmHeaderSelector && $(this.flmHeaderSelector, $el && $el.parent());
        if (!flmHeader || !flmHeader.length)
            return;
        
        flmHeader.prop('title', flmHeaderTitle.call(this, options || {
            value: $el.data('nrmShapeEditorValue')
        }));
    }
    function cleanupGeometry(geometry) {
        if (geometry) {
            if (!(geometry instanceof Geometry)) {
                geometry = geometryJsonUtils.fromJson(geometry);
            }
            if (!geometryEngine.isSimple(geometry)) {
                geometry = geometryEngine.simplify(geometry);
            }
            geometry = geometry.toJson();
        }
        return geometry;
    }
    function updateShape(el, options) {
        options = $.extend({
            triggerChange: true,
            editComplete: true,
            updating: true
        }, this.options, options);
        var shapeValSelector, shapeEl, data = options.graphic || {};
        var shape = options.editComplete ? cleanupGeometry(data.geometry) : data.geometry && data.geometry.toJson();
        var shapeProp = options.prop;
        var atts = data.attributes,
            flmSource = shape === null ? null : FLM.getDataSource(data.attributes), //data.attributes && (data.attributes["data_source"] || data.attributes["dataSource"]);// dataSource ebodin 2014/12/02
            flmRevDate = shape === null ? null : FLM.getRevDate(data.attributes), //new Date().toISOString();
            flmAccuracy = shape === null ? null : FLM.getAccuracy(data.attributes), //data.attributes && data.attributes["accuracy"];
            shapeTypeProp = atts && atts.subtype;

        var shapeIsCopy = false;
        if (shape && options.wkid === 4269 && shape.spatialReference.wkid === 4326) {
            // We are assuming WGS 84 (srid 4326) and NAD 83 (srid 4269) are close enough for no-op transformation.
            // TODO: if we add proj4j library, should we actually "reproject" instead of just setting the srid?
            shape = $.extend(true, { }, shape);
            shape.spatialReference.wkid = 4269;
            shapeIsCopy = true;
        }
        options.value = {shape: shape};
        options.modelId = (options.model && (options.model.id || options.model.cid)) || options.modelId;
        applyShapeValue.call(this, el, _.omit(options, 'model'));
        
        if (options.model && shapeProp && options.editComplete) {
            if (options.nestedShape) {
                Nrm.app.setModelVal(options.model, shapeProp, el.data('nrmShapeEditorValue'));
            } else if (shape && options.stringifyShape) {
                Nrm.app.setModelVal(options.model, shapeProp, JSON.stringify(shape));
            } else if (!shapeIsCopy && shape) {
                // must use deep clone or further editing will not trigger change
                Nrm.app.setModelVal(options.model, shapeProp, $.extend(true, { }, shape));
            } else {
                // already cloned
                Nrm.app.setModelVal(options.model, shapeProp, shape);
            }
        }
        
        if (options.editComplete) {
            this.updateFlm(el, { 
                model: options.model, 
                attributes: {
                    dataSource: flmSource,
                    revisionDate: flmRevDate,
                    accuracy: flmAccuracy
                },
                triggerChange: options.triggerChange
            });
        }
        
        if (shapeTypeProp) {
            var shapeType = null;
            if (!shape) {
            } else if (shape.x) {
                shapeType = "Point";
            } else if (shape.points) {
                shapeType = "MultiPoint";
            } else if (shape.paths) {
                shapeType = "Line";
            } else if (shape.rings) {
                shapeType = "Polygon";
            }
            if (options.model) {
                Nrm.app.setModelVal(options.model, shapeTypeProp, shapeType);
            }
            shapeValSelector = options.editComplete && el.attr('data-target-subtype');
            if (shapeValSelector) {
                shapeEl = $(shapeValSelector, el.parent());
                shapeEl.val(shapeType); 
                if (options.triggerChange) {
                    shapeEl.trigger('change');
                }
            }
        }
    }
    
    /**
     * Create a new instance of the NrmShapeEditor plugin.  Only used internally because we are following the JQuery
     * plugin pattern where the plugin instance is cached in the JQuery data and only accessed via $.fn.nrmShapeEditor.
     * @class NrmShapeEditor
     * @private
     * @param {HTMLElement} element The DOM element.
     * @param {Object} [options] Options to override defaults. 
     */    
    var NrmShapeEditor = function(element, options) {
        var defaults = {
            "allowBuffer" : true,
            "allowReshape": true, // LW: Added for reshape
            "allowMultipart" : true,
            "allowCopy" : true,
            "allowImport" : true,           
            "allowFlm": true,
            "flmDataSource" : "flmDataSource",
            "flmRevDate" : "flmRevDate",
            "flmAccuracy" : "flmAccuracy",
            "helpContext" : "888",
            "wkid": 4269,
            "delegateEvents": true,
            "renderMenu": true,
            "label": "Geometry",
            "prop": "shape",
            "alignRight": true,
            "alignRightSubmenu": false,
            "spatialTypes": ["point", "line", "polygon"],
            "lengthUnit": {
                unit: "esriKilometers",
                label: "Kilometers",
                abbr: "KM"
            },
            "areaUnit": {
                unit: "esriAcres", 
                label: "Acres",
                abbr: "Ac"
            } 
         };
         var $this = $(element);
         
         
         var opt = $.extend({ }, defaults, options);
         
         opt.id = element.id;
         if (!opt.id) {
             opt.id = _.uniqueId('nrmshape');
             $this.attr('id', opt.id);
         }
         
         // create hidden input fields for data binding
         if ($this.is('[data-nrmprop')) {
            function createInput(prop, modelProp, type, label) {
                var nested = opt.nestedShape && prop !== 'subtype', attr = {
                    'id': opt.id + '-' + prop,
                    'type': 'hidden',
                    'data-nrmprop': nested ? prop : modelProp,
                    'aria-label': label,
                    'data-target-display': '#' + opt.id
                };
                if (type) {
                    attr['data-nrmprop-type'] = type;
                }
                var newEl = $('<input>').attr(attr).data('nrm-control', opt);
                $this.attr('data-target-' + prop, '#' + attr.id);
                return newEl;
            }
            
            // set type to geometry
            // opt.nestedShape indicates the data-nrmprop represent a "nested" shape object
            // in that case, assume format is {shape: {...}, dataSource: "##", revisionDate: "####-##-##", accuracy: #}
            var $input = createInput('shape', opt.prop, opt.stringifyShape ? null : 'geometry', opt.label);
            var dependencies = $this.attr('data-nrmprop-dependencies');
            if (dependencies) {
                $input.attr('data-nrmprop-dependencies', dependencies);
            }
            $input.insertAfter($this);
            
            if (opt.allowFlm) {
                $input = createInput('dataSource', opt.flmDataSource, null, 'FLM Data Source').insertAfter($input);
                // not setting date type on this because it should already be formatted at this point.
                $input = createInput('revisionDate', opt.flmRevDate, null, 'FLM Revision Date').insertAfter($input);
                $input = createInput('accuracy', opt.flmAccuracy, 'number', 'FLM Accuracy').insertAfter($input);
            }
            if (opt.subtype) {
                $input = createInput('subtype', opt.subtype, null, 'Geometry Type').insertAfter($input);
            }
            if (opt.nestedShape) {
                $this.parent().attr({'data-nrmprop': opt.prop, 'data-nrmprop-type': 'object'});
            }
        }
         
         // set default title
         var title = $this.attr('title');
         
         // LW: The UndoManager instance
         this.undoManager = new UndoManager({ maxOperations: 100 });
         
         $this.addClass("nrm-help-provider").attr("data-nrm-help-context", opt.helpContext).on("shapechange.nrmShapeEditor", null, this, function(event, options){
            if((options.event !== "onDeactivate") && (options.event !== "onUndo") && (options.event !== "onRedo")) {
                var shapeVal = $this.nrmShapeEditor.val($this);
                if (!options.suppressUndo) {
                    var operation = new NrmUndoOperation.AddGraphic(
                       shapeVal.shape,
                       $.extend({}, options, { 
                           oldFlmValues: {
                               flmDataSource: shapeVal.dataSource,
                               flmRevDate: shapeVal.revisionDate,
                               flmAccuracy: shapeVal.accuracy != null ? shapeVal.accuracy : null
                           },
                           newFlmValues: function() {
                               // get values at time of undo
                               var currentVal = $this.nrmShapeEditor.val($this);
                               return {
                                    flmDataSource: currentVal.dataSource,
                                    flmRevDate: currentVal.revisionDate,
                                    flmAccuracy: currentVal.accuracy != null ? currentVal.accuracy : null
                                };
                           },
                           undoManager: event.data.undoManager
                       })                
                    );
                    event.data.undoManager.add(operation); // LW: Where the magic ACTUALLY happens. This is the only place where the underlying UndoManager is actually called to add to its stack
                }
            }
         });
         
         opt.defaultTitle = title;
         if (opt.allowFlm && !opt.flmDataSourceId)
             opt.flmDataSourceId = opt.id + "-select-flmDataSource";
         this.readonly = opt.readonly;
         if (opt.renderMenu) {
           //var initMenu = function() {
            // initialize menu items
            opt.items = getShapeActions.call(this, $this, opt);
            //var template = Handlebars.templates["dropdown"];
            var $x = $('.input-group-btn', $this.parent());
            $x.addClass("nrm-help-provider").attr("data-nrm-help-context", opt.helpContext);
            var $menu = $x.children('.dropdown-menu');
            var $btn = $x.children('.btn');
            if ($menu.length > 0)
                $menu.replaceWith(template(opt));
            else {
                $btn.addClass("dropdown-toggle");
                $btn.attr("data-toggle", "dropdown");
                $x.append(template(opt));
            }
            $btn.nrmContextMenu();
           //};
           if (opt.allowFlm) {
                // use shared context configuration for FLM data sources if specified.
                $.when(FLM.getFlmDataSourceLov({ apiKey: opt.flmApiKey })).done(_.bind(function(collection) {
                   this.flmDataSourceCollection = collection;
                   this.updateFlmHeaderTitle($this, opt);
                }, this));
           }
         }
         
         this.options = _.omit(opt, "model", "value");
         applyShapeValue.call(this, $this, opt);
         if (opt.delegateEvents && this.menuEvents) {
             var parentEl = $this.parent();
             $.each(this.menuEvents, function(key, value) {
                  parentEl.on("click.nrm.shapeEditor", key, function(e) {
                      if ($(e.target).parent().is(".disabled"))
                          e.preventDefault();
                      else
                          value.apply(this, arguments);
                  });
             });          
         }
//         this.$el = $this.parent();
//         if (this.flmControl) {
//            var initFlmControl = function(ctx) {
//               BaseView.initLov.call(this, this.flmControl, ctx, this.options.flmInitCallback, 
//                   function(data, response) {
//                       BaseView.onLovError(ctx, data, response);
//                   });
//            };
//
//            if (opt.flmApiKey) {
//                $.when(Nrm.app.getContext({ apiKey: opt.flmApiKey }, this)).done(initFlmControl).fail(function(data) {
//                       BaseView.onLovError(null, data);
//                   });
//            } else {
//                 //initFlmControl.call(this, flmDefaultCtx);
//            }
//         }
    };
    
    NrmShapeEditor.prototype = 
    /** @lends module:nrm-map/nrmShapeEditor.prototype */{
        /**
         * Add or replace the edit graphic in the map
         * @function
         * @param {Object} [options] Usually it is best to use the default values cached on the element, but the 
         * following options are also supported:
         * @param {module:nrm-map/nrmShapeEditor~ShapeValue} [options.shapeVal] The shape value to render, or if not
         * defined as an option, use the current shape value cached in the element data from initial value binding.
         * @param {string|Number} [options.modelId] The id to set in the graphic attributes, or if not defined as an
         * option, use the current model id cached in the element data from initial value binding.
         */
        renderShape: renderShape,
        /**
         * Set the shape value displayed in the control, which also updates the enabled status of the menu items.  
         * If the values to set should be obtained from the model option, the attribute names will be determined by
         * the following {@link module:nrm-map/nrmShapeEditor~ShapeControlConfig|plugin initialization options}:
         * <ul>
         * <li>prop</li>
         * <li>flmDataSource</li>
         * <li>flmRevDate</li>
         * <li>flmAccuracy</li>
         * </ul>
         * If these options were not provided when the plugin was initialized which is recommended, they can be 
         * provided to this function instead.
         * @function
         * @todo This function will also accept several additional options from the 
         * {@link module:nrm-map/nrmShapeEditor~ShapeControlConfig|plugin options} which will override the original 
         * options that were provided when initializing the plugin instance:<br/><br/>
         * areaUnit, lengthUnit, defaultTitle, label, required<br/><br/>
         * However, this will only work as expected if the geometry or model id changes, and except for the readonly
         * option the new options might not persist.  We either need to ensure the new options are set, or do not 
         * support these options here and maybe provide a distinct method for changing those things. 
         * @param {module:nrm-map/nrmShapeEditor~ShapeControlConfig} options Additional configuration options that
         * may affect the outcome of this method will get their default values from the initialization options and
         * can be omitted when calling this function, except for the following:
         * @param {external:module:backbone.Model} [options.model] The model that provides the new shape value and id
         * attribute for the edit graphic, either this or the value option is required.
         * @param {module:nrm-map/nrmShapeEditor~ShapeValue|module:nrm-map/nrmShapeEditor~Geometry} [options.value] The 
         * new shape or geometry value, required if model option is not set.
         * @param {Boolean} [options.readonly] Sets the readonly state of the actions menu items.
         * @param {Boolean} [options.updating=false] True indicates being called by updateShape and to simplify geometry.
         */
        applyShapeValue: applyShapeValue,
        /**
         * Set the shape and FLM values in the control, and also update model attributes.  This function will also 
         * accept several options from the {@link module:nrm-map/nrmShapeEditor~ShapeControlConfig|plugin options} 
         * which will override the original options that were provided when initializing the plugin instance:
         * <ul>
         * <li>prop</li>
         * <li>stringifyShape</li>
         * </ul>
         * @function
         * @param {Object} options In addition to the options listed here, the options are also passed to
         * {@link module:nrm-map/nrmShapeEditor#applyShapeValue|applyShapeValue function} so refer to that method
         * for documentation of additional options that might affect the result.
         * @param {external:module:backbone.Model} [options.model] The model to update.  This option is now
         * deprecated in favor of data binding via "data-nrmprop" attribute.
         * @param {external:module:esri/Graphic} options.graphic The graphic with new geometry and FLM attributes.
         * @param {Boolean} [options.editComplete=true] Indicates that an edit operation is complete, which will trigger
         * change event if the "data-nrmprop" attribute is set. This option can be used to update the state of the plugin
         * without updating the model attribute.
         */
        updateShape: updateShape,
        /**
         * Set the FLM values in the control, and also update model attributes.  This function will also 
         * accept several options from the {@link module:nrm-map/nrmShapeEditor~ShapeControlConfig|plugin options} which 
         * will override the original options that were provided when initializing the plugin instance:
         * <ul>
         * <li>allowFlm</li>
         * <li>triggerChange</li>
         * <li>prop</li>
         * <li>flmDataSource</li>
         * <li>flmRevDate</li>
         * <li>flmAccuracy</li>
         * </ul>
         * @function
         * @param {Object} options
         * @param {external:module:backbone.Model} options.model The model to update
         * @param {module:nrm-map/nrmShapeEditor~ShapeValue} options.attributes The new FLM attribute values to set
         */
        updateFlm: updateFlm,
        /**
         * Update the title attribute (tooltip) on the Feature Level Metadata menu item.  This function will also 
         * accept several options from the {@link module:nrm-map/nrmShapeEditor~ShapeControlConfig|plugin options} 
         * which will override the original options that were provided when initializing the plugin instance:
         * <ul>
         * <li>prop</li>
         * <li>flmDataSource</li>
         * <li>flmRevDate</li>
         * <li>flmAccuracy</li>
         * </ul>
         * @function
         * @param {Object} options
         * @param {external:module:backbone.Model} [options.model] The model that provides the new shape value and id
         * attribute for the edit graphic, either this or the value option is required.
         * @param {module:nrm-map/nrmShapeEditor~ShapeValue|module:nrm-map/nrmShapeEditor~Geometry} [options.value] The
         *  new shape or geometry value.
         */
        updateFlmHeaderTitle: updateFlmHeaderTitle,
        /**
         * Activate the Draw tool in the map to create a new shape.
         * @todo The options for this function are all messed up.
         * @function
         * @param {Object} options
         * @param {string} options.shapeType The geometry type, default allowed values include "point", "polyline", 
         * "polygon" and "multipoint", but may be constrained by the control.spatialTypes option
         * @param {Object} options.control This is required, even if none of the optional properties are set:
         * @param {string} [options.control.prop] The shape attribute name, either this or propName option are required.
         * @param {string[]} [options.control.spatialTypes] A list of shape types that are valid.
         * @param {string} [options.propName] The shape attribute name, either this or control.prop option are required.
         * @param {string|Number} [options.modelId] The id to set in the graphic attributes, or if not defined as an
         * option, use the current model id cached in the element data from initial value binding.
         */
        activateShapeTool: activateShapeTool,
        /**
         * Activate the Edit tool in the map to edit an existing shape.  
         * @function
         * @param {Object} [options] Usually it is best to use the default values cached on the element, but the 
         * following options are also supported:
         * @param {module:nrm-map/nrmShapeEditor~ShapeValue} [options.shapeVal] The shape value to render, or if not
         * defined as an option, use the current shape value cached in the element data from initial value binding.
         * @param {string|Number} [options.modelId] The id to set in the graphic attributes, or if not defined as an
         * option, use the current model id cached in the element data from initial value binding.
         * @param {string} [options.prop] Name of the shape attribute, or if not defined as an option here, use the 
         * plugin initialization option.
         */
        activateShapeEditTool: activateShapeEditTool,
        /**
         * Deactivate any active editing tool in the map.
         * @function
         * @param {Object} [options]
         * @param {Boolean} [options.clearForm=false] Remove the edit graphic
         * @param {string|Number} [options.modelId] The id of the graphic to remove, or if not defined as an option, 
         * use the current model id cached in the element data from initial value binding.
         */
        deactivateShapeTool: deactivateShapeTool
    };
    
    /**
     * A "nested" shape object comprised of a geometry and FLM attributes.
     * @typedef {Object} ShapeValue
     * @property {module:nrm-map/nrmShapeEditor~Geometry} shape The geometry value
     * @property {string} dataSource The FLM data source value
     * @property {string} revDate The FLM rev date as a string formatted as yyyy-MM-dd, yyyy-MM-ddThh:mm or a full ISO
     *  date and time string yyyy-MM-ddThh:mm:ss.fffZ.
     * @property {Number} accuracy The FLM accuracy
     */
    
    /**
     * Plain object representation of a geometry.  
     * @typedef {Object} Geometry
     * @see {@link http://resources.arcgis.com/en/help/rest/apiref/geometry.html|ArcGIS Server REST API geometry object}
     * for documentation of expected properties.
     */
    
    /**
     * Plugin options for the NrmShapeEditor plugin.
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} ShapeControlConfig
     * @property {string} [prop="shape"] The geometry attribute or function name defined on the model
     * @property {Boolean} [nestedShape=false] Indicates that the geometry attribute refers to a "nested" shape object 
     * with shape, dataSource, revisionDate and accuracy properties.
     * @property {Boolean} [readonly=false] If the control is readonly, editing options should be disabled.
     * @property {Boolean} [required=false] Field is required, may be used together with the label to generate a default 
     * tooltip.
     * @property {Boolean} [allowReplace=false] Allow replacing the geometry once it is created
     * @property {Boolean} [allowMultipart=true] Allow multipart geometries
     * @property {Boolean} [allowBuffer=true] Enable Buffer and Add part via Buffer tools
     * @property {Boolean} [allowCopy=true] Enable copying geometry from other layers
     * @property {Boolean} [allowImport=true] Enable importing geometry from a shapefile
     * @property {Boolean} [allowFlm=true] Enable FLM attribute editing
     * @property {Boolean} [allowClear=false] Allow clearing the geometry once it is set.
     * @property {string[]} [spatialTypes] List of geometry types supported, see shapeType option for
     * {@link module:nrm-map/nrmShapeEditor#activateShapeTool|activateShapeTool function} for expected/default values.
     * @property {string} [defaultTitle] Tooltip to display when the geometry is empty
     * @property {Number} [wkid=4269] Spatial reference WKID accepted by the server.
     * @property {module:nrm-ui/views/baseView~MenuItemConfig[]} [items] Custom menu items.
     * @property {Boolean} [delegateEvents=true] Hook up the default event handlers on the dropdown menu items.
     * @property {Boolean} [renderMenu=true] Render the default dropdown menu.
     * @property {Boolean} [alignRight=true] Dropdown menu should be aligned to the right edge of the button.
     * @property {Boolean} [alignRightSubmenu=false] Submenus should open to the left of the dropdown menu.
     * @property {module:nrm-map/nrmShapeEditor~UnitOfMeasure} [lengthUnit] Length unit to display for polylines.  
     * Default is Kilometers.
     * @property {module:nrm-map/nrmShapeEditor~UnitOfMeasure} [areaUnit] Area unit to display for polygons.  Default
     * is Acres.
     * @property {string} [flmDataSource="flmDataSource"] FLM data source attribute or function name
     * @property {string} [flmRevDate="flmRevDate"] FLM rev date attribute or function name
     * @property {string} [flmRevDate="flmRevDate"] FLM accuracy attribute or function name
     * @property {Boolean} [stringifyShape=false] Set shape attribute in model as a JSON string instead of an object.
     * @property {Boolean} [triggerChange=false] Trigger the "flmChange.nrm.shapeEditor" event when the FLM attributes
     * are updated.
     */
    
    /**
     * 
     * @typedef {Object} UnitOfMeasure
     * @property {string} unit The unit of measure as an 
     * {@link https://developers.arcgis.com/javascript/3/jsapi/units-amd.html|ESRI unit constant}
     * @property {string} abbr The abbreviation to display in the readonly text field.
     * @property {string} label Name of the unit to display in a tooltip.
     */
    
    /**
     * This is actually the plugin function (jQuery.fn.nrmShapeEditor) and module return value, not a constructor.  
     * See the example below for usage.
     * @todo Add prototype methods for each of the menu items, so that application developers can trigger the actions
     * without simulating a click on the menu item.
     * @class
     * @alias module:nrm-map/nrmShapeEditor
     * @classdesc JQuery plugin providing a shape and Feature Level Metadata (FLM) editing plugin. The module adds the
     *  nrmShapeEditor function to the jQuery plugin namespace.
     * @param {string|module:nrm-map/nrmShapeEditor~ShapeControlConfig} option If this parameter is a string, it represents 
     * the plugin implementation prototype function to call.  If the parameter is an object, it represents an options 
     * hash to pass to the plugin implementation when initializing a new instance of the plugin.
     * @param {Object} e Options to pass to the prototype function if the first argument was a string.
     * @returns {external:module:jquery}
     *  The initial jQuery selector to allow for chaining.
     * 
     * @example <caption>Plugin usage</caption>
     * // given a DOM structure as follows:
     * // <div class="input-group nrm-shape input-group-sm">
     * //   <input type="text" class="form-control" id="site-shape" title="Create or edit site geometry" readonly>
     * //   <div class="input-group-btn">
     * //      <button type="button" id="site-shape-btn" class="btn btn-default nrm-enable-readonly" title="Options for editing the geometry">  
     * // 	    Actions <span class="caret"></span>
     * //      </button>
     * //   </div>
     * // </div>
     * require(['jquery', 'nrm-map/nrmShapeEditor', 'nrm-ui', 'underscore', 'backbone'], 
     *          function($, NrmShapeEditor, Nrm, _, Backbone) {
     *   // initialize the nrmShapeEditor plugin on the readonly input text field
     *   // note that the code seen here would normally be distributed across multiple view methods, 
     *   // with more user interaction in between.
     *   var shapeAttr = 'shape', model = new Backbone.Model();
     *   var shapeEl = $('#site-shape').nrmShapeEditor({
             prop: shapeAttr,
             model: model,
             allowReplace: true, // allow replacing with a different geometry type
             allowClear: true // only set this if the geometry is not required!
     *   });
     *   // activate the draw tool to draw a polygon
     *   // normally the plugin would do this for us when the user clicks the menu item... 
     *   shapeEl.nrmShapeEditor('activateShapeTool', { 
     *       shapeType: 'polygon', 
     *       control: { prop: shapeAttr }
     *   });
     *   // in the real world, use view.listenTo(Nrm.event, 'map:endDraw', ...), never Nrm.event.on(...)
     *   Nrm.event.on('map:endDraw', function(graphic) {
     *      // in a scenario where there might be more than one shape field active at the same time, 
     *      // use the elemId attribute to identify which field raised the event.
     *      if (graphic.attributes.elemId === 'site-shape') {
     *          // update both the model attributes and the state of the plugin instance...
     *          shapeEl.nrmShapeEditor('updateShape', {
     *              model: model,
     *              graphic: graphic
     *          });
     *          // we can get "nested" shape value from a static function...
     *          var shapeVal = NrmShapeEditor.val('#site-shape');
     *          var geometry = shapeVal.shape, 
     *              flmDataSource = shapeVal.dataSource, 
     *              flmRevDate = shapeVal.revDate, 
     *              flmAccuracy = shapeVal.accuracy; 
     *          // this conditional statement is just for demonstration purposes...
     *          if (_.isEqual(geometry, model.get('shape')) {
     *              console.log('it worked!');
     *              // normally this would happen in a Save button click handler, not immediately
     *              // after completing the sketch, but as a simplified example:
     *              model.save(null, {
     *                  success: function() {
     *                      // after saving a new model, always call the applyShapeValue function to 
     *                      // refresh the state of the plugin instance with the server attributes...
     *                      shapeEl.nrmShapeEditor('applyShapeValue', {
     *                          model: model
     *                      });
     *                  }
     *              }
     *          }
     *      }
     *   });
     *   
     * });
     */
    $.fn.nrmShapeEditor = function (option, e) {
        return this.each(function () {
          var $this = $(this);
          var data  = $this.data('nrmShapeEditor');
          var isFunc = typeof option === "string";
          if (!data) $this.data('nrmShapeEditor', (data = new NrmShapeEditor(this, isFunc ? e : option)));
          if (isFunc) data[option].call(data, $this, e);
        });
      };

      $.fn.nrmShapeEditor.Constructor = NrmShapeEditor;
      
      /**
       * Get the "nested" shape value for an element that has been initialized with the nrmShapeEditor plugin.
       * @name module:nrm-map/nrmShapeEditor.val
       * @function
       * @param {string|external:module:jquery|Element} selector A selector or JQuery object or DOM node
       * @param {external:module:jquery|Element} context If first argument is a selector, this provides 
       * the context as described in 
       * {@link http://api.jquery.com/jQuery/#jQuery-selector-context|jQuery(selector [, context])}
       * @returns {module:nrm-map/nrmShapeEditor~ShapeValue}
       * The current nested shape value of the element.
       */
      $.fn.nrmShapeEditor.val = function(selector, context) {
          //return getShapeVal($(selector, context));
          // returns { shape: ..., dataSource: ..., revisionDate: ..., accuracy: ... }
          return $(selector, context).data('nrmShapeEditorValue');
      };
    return $.fn.nrmShapeEditor;
});