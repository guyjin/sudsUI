// Parent to worker
self.onmessage = function(evt) {
    var //inputs = JSON.parse(evt.data),
        fileListInput = evt.data.fileList;
    if (!fileListInput) {
        return;
    }
    
    evt.data.scripts.forEach(function(s) {
        importScripts(s);
    });
    
    var rootNames = [],
        rootNamesProcessed = [],
        featureCollections = [],
        errors = [],
        percentComplete = 0,
        rootNameDone = function(name, featureCollection, criticalError) {
            //console.log("shapefileWorker.rootNameDone " + name + "   " + criticalError);
            var total = rootNames.length, done = 0;
            if (criticalError) {
                //console.log("  critical error");
                featureCollection = null;
                percentComplete = 100;
                done = total;
                errors.push(criticalError);
                //console.log("  errors after adding criticalError: " + JSON.stringify(errors));
            } else {
                rootNamesProcessed.push(name);
                total = rootNames.length;
                done = rootNamesProcessed.length;
                percentComplete = 100 * done / total;
            }
            //console.log("finished shapefile " + done.toString() + "/" + total.toString() + ": " + name, rootNamesProcessed);
            //console.log("... with " + featureCollections.length.toString() + " featureCollections");
            try {
                postMessage({
                    type: "progress",
                    percentComplete: percentComplete,
                    featureCollection: featureCollection,
                    errors: JSON.stringify(errors)
                });
            } catch (error) {
                featureCollections = null;
                featureCollection = null;
                //console.warn("shapefileWorker.rootNameDone caught exception on postMessage.progress", error);
                errors.push(error);
                done = total;
                percentComplete = 100;
                postMessage({
                    type: "progress",
                    percentComplete: percentComplete,
                    featureCollection: null,
                    errors: JSON.stringify(errors)
                });
            }
            if (done >= total) {
                try {
                    //console.log("shapefileWorker.rootNameDone posting response");
                    postMessage({
                        type: "response",
                        featureCollections: featureCollections,
                        errors: JSON.stringify(errors)
                    });
                } catch (error) {
                    featureCollections = null;
                    featureCollection = null;
                    errors.push(error);
                    //console.warn("shapefileWorker.rootNameDone caught exception on postMessage.response", error);
                    postMessage({
                        type: "response",
                        featureCollections: [],
                        errors: JSON.stringify(errors)
                    });
                } finally {
                    //console.log("shapefileWorker.rootNameDone triggering close");
                    self.close();
                }
            }
        };
    function errorHandler(e, rootName){
        //console.log("shapefileWorker.errorHandler", e, rootName);
        var s = JSON.stringify(e).toLowerCase();
        if (s.indexOf("arraybuffer") > -1) {
            e.message = "Out of memory. " + (e.message || "" );
        }
        rootNameDone(rootName, null, e);
    }

    for (var i = 0; i < fileListInput.length; i++) {
        var file = fileListInput.item(i),
            n = file.name.substr(0, file.name.lastIndexOf("."));
        if (rootNames.indexOf(n) === -1) {
            rootNames.push(n);
        }
    }
    
    rootNames.forEach(function(rootName){
        //console.log("shapefileWorker calling shapefileParser for rootName " + rootName);
        ShapefileParser.loadAsFeatureCollection(fileListInput,
            function(featureCollection){
                try {
                    //console.log("parsed shapefile " + rootName);// + " with " + featureCollection.featureSet.length.toString() + " features", JSON.stringify(featureCollection));
                    if (featureCollection && featureCollection.criticalError) {
                        errorHandler(featureCollection);
                        return;
                    } else if (!featureCollection || !featureCollection.featureSet || featureCollection.featureSet.features.length === 0) {
                        errorHandler({message: "Shapefile is empty: " + rootName}, rootName);
                        return;
                    }

                    featureCollection.layerDefinition.caption = rootName + ".shp";
                    // check projection
                    var outSR = {wkid: 4326},
                        inSR = featureCollection.featureSet.spatialReference,
                        wktObj = {}, isNAD83 = false, isGCS = false;
                    if (inSR.wkt) {
                        inSR.wkt.replace(/"/g,"").toUpperCase().split(",").forEach(
                                function(val){
                                    var v = val.split("[");
                                    if (val.length > 1) {
                                        wktObj[v[0]] = v[1];
                                    }
                                }
                            );
                        isNAD83 = /(WGS_1984|WGS84|NAD83|NAD_1983|NORTH_AMERICAN_1983)/.test(wktObj.DATUM);
                        isGCS = inSR.isProjected !== undefined ? !inSR.isProjected : (wktObj.PROJECTION !== undefined);
                    }
                    if (inSR.wkid && (inSR.wkid === 102100 || inSR.wkid === outSR.wkid)) {
                        //console.log("no projection needed");
                        featureCollections.push(featureCollection);
                    } else if (isNAD83 && isGCS) {
                        //console.log("updating spatial reference without projection ");
                        featureCollection.layerDefinition.spatialReference = outSR;
                        featureCollection.featureSet.spatialReference = outSR;
                        featureCollection.featureSet.features.forEach(function(f){
                            f.geometry.spatialReference = outSR;
                        });
                        featureCollections.push(featureCollection);
                    } else {
                        var outProjection = outSR.wkid ? "EPSG:" + outSR.wkid.toString() : outSR.wkt,
                            inProjection = inSR.wkid || inSR.wkt,
                            project = proj4(inProjection, outProjection);
                        //console.log("needs projection from " + inProjection + " to " + outProjection);
                        featureCollection.featureSet.features.forEach(function(g){
                            var geometry = g.geometry,
                                outGeometry = {spatialReference: outSR, type: geometry.type},
                                coords = [], progressMessage;
                            switch (geometry.type) {
                                case "point":
                                    coords = project.forward([geometry.x, geometry.y]);
                                    outGeometry.x = coords[0];
                                    outGeometry.y = coords[1];
                                    break;
                                case "multipoint":
                                    outGeometry.points = [];
                                    geometry.points.forEach(function(point){
                                        outGeometry.points.push(project.forward([point[0], point[1]]));
                                    });
                                    break;
                                case "polyline":
                                    outGeometry.paths = [];
                                    geometry.paths.forEach(function(path){
                                        coords = [];
                                        path.forEach(function(point){
                                            coords.push(project.forward([point[0], point[1]]));
                                        });
                                        outGeometry.paths.push(coords);
                                    });
                                    break;
                                case "polygon":
                                    outGeometry.rings = [];
                                    geometry.rings.forEach(function(ring){
                                        coords = [];
                                        ring.forEach(function(point){
                                            coords.push(project.forward([point[0], point[1]]));
                                        });
                                        outGeometry.rings.push(coords);
                                    });
                                    break;
                                default:
                                    progressMessage = "ProjectionWorker found unhandled geometry type: " + geometry.type;
                                    break;
                            }
                            g.geometry = outGeometry;
                            percentComplete += 100 / featureCollection.featureSet.features.length / rootNames.length / 2; // projection is half of process
                            postMessage({
                                type: "progress",
                                percentComplete: percentComplete
                            });
                        });
                        //console.log("projected features", featureCollection);
                        featureCollections.push(featureCollection);
                    }
                } catch (e) {
                    console.log("error in shapefileworker: " + e.message);
                    errors.push(e);
                } finally {
                    //console.log("finally running rootNameDone");
                    rootNameDone(rootName, featureCollection);
                }
            },
            function(e){
                //console.log("shapefileWorker.loadAsFeatureCollection errorHandler", e);
                var s = JSON.stringify(e).toLowerCase();
                if (s.indexOf("arraybuffer") > -1 || s.indexOf("undefined or null reference") > -1) {
                    console.log("   e.description: " + e.description);
                    console.log("   e.msg: " + e.msg);
                    console.log("   e.detail: " + e.detail);
                    console.log("   e.details: " + e.details);
                    e.description = "Out of memory. " + (e.description || "" );
                }
                rootNameDone(rootName, null, e);
            },
            {
                rootName: rootName, 
                progressCallback: function(marginalPercentComplete) {
                    percentComplete += marginalPercentComplete / rootNames.length / 2; // shapefile is half of process
                    //console.log("progressCallback set percentComplete to " + percentComplete.toString());
                    postMessage({
                        type: "progress",
                        percentComplete: percentComplete
                    });
                }
            }
        );
    });
        
    
    
    
    
    
    
};
