dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("dojox.widget.TitleGroup");
dojo.require("dijit.TitlePane");
dojo.require("dijit.form.Button");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dojo.parser");
dojo.require("dijit.form.Textarea");
dojo.require("dijit.form.DropDownButton");
dojo.require("dijit.TooltipDialog");
dojo.require("dijit.form.TextBox");
dojo.require("esri.layers.osm");
dojo.require("dijit.form.DropDownButton");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.dijit.Legend");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.tasks.query");
dojo.require("dojox.charting.themes.Julie");
dojo.require("esri.tasks.geometry");
dojo.require("esri.dijit.Popup");
dojo.require("dijit.dijit");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.arcgis.utils");
dojo.require("dijit.Tooltip");
dojo.require("dijit.form.Slider");


var breakCount = 0; // keep track of how many individual breaks have been created, used to fetch the correct field values
var featureLayer; // the active data overlay
var diagramLayer; // the active clickable diagram layer
var map, queryTask, query, template, disconHandler;
var attributeFields = ["Kreisname", "'2010$'.Lebendgeborene", "'2010$'.Gestorbene", "Tabelle1$.Fortgezogene", "Katholisch", "'2005$'.Leistungsempfänger Pflegeversicherung I"]; // used fields from the raw data 
var diagramFields = new Array(attributeFields.length);

var activeLayer = 1; // which layer is active at the beginning
var legend;
/**
 * at this point the min and max values have to be entered manually for each layer.
 * this is not a good approach, they should be obtained directly from the data on the server
 * please change this! 
 */
var maxValues = [0, 5107, 7552, 23852];  
var minValues = [0, 1031, 1382, 3432];
/**
 * due to a bug in ArcGIS where invoking any method that re-centers the map a onPan() event is fired,
 * this counter is used to prevent an infinite loop of re-centering between the two maps in split-mode.
 */
var counter = 0;

function init() {
    addTooltips(); //the mouse-over tooltips are created programmatically
    initDiagramFields(); //initialize which fields should be used for which diagram layer
    var popup = new esri.dijit.Popup(null, dojo.create("div")); //ini popups for diagrams

    esri.config.defaults.io.proxyUrl = "/arcgisserver/apis/javascript/proxy/proxy.ashx";

    var extent = new esri.geometry.Extent(413447, 6487669, 1269542, 7099165, new esri.SpatialReference({
        wkid: 102100
    })); //initial map extent
    
    for (var i = 0; i < parent.frames.length; i++) {
        if (parent.frames[i].name != self.name) {
            extent = parent.frames[i].map.extent; //in split-mode get extent from other map
        }
    }

    map = new esri.Map("map", {
        extent: extent,
        infoWindow: popup,
        slider: true
    });

    createBasemapGallery();

    //add Layer overlay
    dojo.connect(map, "onLoad", initOperationalLayer);
    
    //various map events
    dojo.connect(map, "onPanEnd", reLocate);
    dojo.connect(map, "onZoomEnd", reLocate); 

    dojo.connect(map, "onMouseDown", function () {
        for (var i = 0; i < parent.frames.length; i++) {
            parent.frames[i].counter = 0; //the counter is used if any pan related events occured onMouseDown
        }

    });
    
    dojo.connect(map, "onMouseWheel", function () {
        for (var i = 0; i < parent.frames.length; i++) {
            parent.frames[i].counter = 0;
        }
    });

    dojo.connect(map, 'onLayersAddResult', function (results) {
        var layerInfo = dojo.map(results, function (layer, index) {
            return {
                layer: layer.layer,
                title: layer.layer.name
            };
        });

        //add the legend 
        legend = new esri.dijit.Legend({
            map: map,
            layerInfos: layerInfo
        }, "legend");
        legend.startup();
    });
    
    dojo.connect(map, 'onZoomEnd', function() { //generalize vector map for faster loading, see calcOffset() documentation
      map.maxOffset = calcOffset();
      featureLayer.setMaxAllowableOffset(map.maxOffset);
    });



    //resize the map when the browser resizes
    dojo.connect(dijit.byId('map'), 'resize', map, map.resize);

    //Scalebar
    dojo.connect(map, 'onLoad', function (theMap) {
        var scalebar = new esri.dijit.Scalebar({
            map: map,
            scalebarUnit: 'metric',
            attachTo: "bottom-left"
        });
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });

    //Baselayer
    tiledMapServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
    osmLayer = new esri.layers.OpenStreetMapLayer();
    map.addLayer(osmLayer);


    onLoadCheck();

	initialColorization();
}


function createBasemapGallery() {
    //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
    var basemapGallery = new esri.dijit.BasemapGallery({
        showArcGISBasemaps: true,
        bingMapsKey: 'Enter Bing Maps Key',
        map: map
    }, "basemapGallery");

    basemapGallery.startup();

    dojo.connect(basemapGallery, "onError", function (msg) {
        console.log(msg)
    });
}


/**
 * opacity für FeatureLayer
 */
function setFeatureLayerOpacity(opacity) {
    featureLayer.setOpacity(opacity);
}


function initDiagramFields() {
    diagramFields[4] = new Array(4);
    diagramFields[4][1] = "Katholisch";
    diagramFields[4][2] = "Evangelisc";
    diagramFields[4][3] = "Andere";
    diagramFields[4][4] = "Keine";
    diagramFields[5] = new Array(3);
    diagramFields[5][1] = "'2005$'.Leistungsempfänger Pflegeversicherung I";
    diagramFields[5][2] = "'2005$'.Leistungsempfänger Pflegeversicherung II";
    diagramFields[5][3] = "'2005$'.Leistungsempfänger Pflegeversicherung III";
}

/**
 * FeatureLayer Overlay
 */
function initOperationalLayer() {


    featureLayer = new esri.layers.FeatureLayer("http://giv-learn.uni-muenster.de/ArcGIS/rest/services/LWL/lwl_collection/MapServer/" + activeLayer, {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"], //use all available fields in the data
        maxAllowableOffset: calcOffset(),
        opacity: .50
    });
    featureLayer.setSelectionSymbol(new esri.symbol.SimpleFillSymbol());
    map.addLayers([featureLayer]);

}


/**
* see http://help.arcgis.com/en/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/best_practices_feature_layers.htm
*/
function calcOffset() {
  return (map.extent.getWidth() / map.width);
}


/**
 * additionally to the standard overlay, this can add an invisible,
 * but clickable diagram layer
 */
function initDiagramLayer() {
    diagramLayer = new esri.layers.FeatureLayer("http://giv-learn.uni-muenster.de/ArcGIS/rest/services/LWL/lwl_collection/MapServer/" + activeLayer, {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"],
        opacity: .0
    });
    diagramLayer.setSelectionSymbol(new esri.symbol.SimpleFillSymbol());
    map.addLayers([diagramLayer]);
}

/**
 * Creates a QueryTask to show diagrams on certain layers onClick
 */
function connectDiagramFunc(layerNr) {
    disconHandler = dojo.connect(map, "onClick", executeQueryTask);

    queryTask = new esri.tasks.QueryTask("http://giv-learn.uni-muenster.de/ArcGIS/rest/services/LWL/lwl_collection/MapServer/" + layerNr);

    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.outSpatialReference = map.spatialReference;
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;

    var diagramF = new Array(diagramFields[layerNr].length - 1);
    for (i = 0; i < diagramFields[layerNr].length - 1; i++) {
        diagramF[i] = diagramFields[layerNr][i + 1];

    }

    //Reference the chart theme here too
    template = new esri.dijit.PopupTemplate({
        title: "Verteilung in {Kreisname}",
        mediaInfos: [{
            type: "piechart",
            value: {
                fields: diagramF,
                theme: "Julie"
            }
        }]
    });

}

/**
 * This method can assign a new color scheme to a layer
 * as used for individual breaks
 */
function colorChange(count) {

    symbol = new esri.symbol.SimpleFillSymbol();
    symbol.setColor(new dojo.Color([150, 150, 150, 0.75]));
    var renderer = new esri.renderer.ClassBreaksRenderer(symbol, attributeFields[activeLayer]);
    for (var i = 1; i <= breakCount; i++) {
        var element = document.getElementById("breakFrom" + i);
        if (element) {
            renderer.addBreak(document.getElementById("breakFrom" + i).value,
            document.getElementById("breakTo" + i).value,
            new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color("#" + document.getElementById("cp" + i).value)));
        }
    }


    featureLayer.setRenderer(renderer);
    featureLayer.refresh();

    legend.refresh();
}


/**
 * This method is used to initially set classes - only used at startup! 
 */
function initialColorization(){
	addEqualBreaks(3, "FF0000", "00FF00");
}

/**
 * Method for changing the active overlay layer
 */
function layerChange(layerNr) {
	//disconnect and connect click handlers for diagrams based on checkboxes
    if (layerNr == 4 && !(document.getElementById("religionChk").checked)) {
        dojo.disconnect(disconHandler);
        map.removeLayer(diagramLayer);
        diagramLayer = null;
    } else if (layerNr == 4 && document.getElementById("religionChk").checked) {
        dojo.disconnect(disconHandler);
        connectDiagramFunc(layerNr);
        document.getElementById("pflegehilfeChk").checked = false;
        if (diagramLayer != null) {
            map.removeLayer(diagramLayer);
            diagramLayer = null;
        }
        initDiagramLayer();
    } else if (layerNr == 5 && !(document.getElementById("pflegehilfeChk").checked)) {
        dojo.disconnect(disconHandler);
        map.removeLayer(diagramLayer);
        diagramLayer = null;
    } else if (layerNr == 5 && document.getElementById("pflegehilfeChk").checked) {
        dojo.disconnect(disconHandler);
        connectDiagramFunc(layerNr);
        document.getElementById("religionChk").checked = false;
        if (diagramLayer != null) {
            map.removeLayer(diagramLayer);
            diagramLayer = null;
        }
        initDiagramLayer();
    } else {
		//following applies if only a 'normal' layer change happens
        activeLayer = layerNr; //setting the new layer
        var d = document.getElementById("breaksPane_pane");
        var olddiv = document.getElementById("Breaks");
        d.removeChild(olddiv); //remove previously made class breaks
        var addBreaksTable = document.createElement("table");
        addBreaksTable.setAttribute("id", "Breaks");
        d.appendChild(addBreaksTable);
        breakCount = 0;
        legend.destroy();
        var legendDiv = document.getElementById("legendDiv");
        var leg = document.createElement("div");
        leg.setAttribute("id", "legend");
        legendDiv.appendChild(leg);

        map.removeLayer(featureLayer);
        featureLayer = null;
        initOperationalLayer();
    }
}

/**
 * method for automatic (equal) breaks
 */
function addEqualBreaks(number, colorStart, colorEnd) {
    var breakStep = (maxValues[activeLayer] - minValues[activeLayer]) / (number);
    var colorArray = generateColor(colorStart, colorEnd, number-1);
    colorArray.reverse();

    symbol = new esri.symbol.SimpleFillSymbol();
    symbol.setColor(new dojo.Color([150, 150, 150, 0.75]));
    var renderer = new esri.renderer.ClassBreaksRenderer(symbol, attributeFields[activeLayer]);
    
    for (var i = 0; i < number; i++) {
        renderer.addBreak(Math.round((minValues[activeLayer] + i * breakStep) / 10) * 10,
        Math.round((minValues[activeLayer] + (i + 1) * breakStep) / 10) * 10,
        new esri.symbol.SimpleFillSymbol().setColor(dojo.colorFromHex('#' + colorArray[i])));
    }

	var breaksList = document.getElementById("Breaks");
	breaksList.innerHTML = '';
	breakCount = 0;
    featureLayer.setRenderer(renderer);
    featureLayer.refresh();

    legend.refresh();
}


/** 
 * executed onClick on a diagram layer
 */
function executeQueryTask(evt) {
    query.geometry = evt.mapPoint;

    var deferred = queryTask.execute(query);

    deferred.addCallback(function (response) {
        // response is a FeatureSet
        // Let's return an array of features.
        return dojo.map(response.features, function (feature) {
            feature.setInfoTemplate(template);
            return feature;
        });
    });

    // InfoWindow expects an array of features from each deferred
    // object that you pass. If the response from the task execution 
    // above is not an array of features, then you need to add a callback
    // like the one above to post-process the response and return an
    // array of features.
    map.infoWindow.setFeatures([deferred]);
    map.infoWindow.show(evt.mapPoint);
}

/**
 * called if in split mode one map is panned
 */
function reLocate() {
	for (var i = 0; i < parent.frames.length; i++) { //go through all frames and re-center
		if (parent.frames[i].name != self.name) {
			parent.frames[i].reCenterAndZoom(map.extent.getCenter(), map.getLevel(), map.extent, i);
		}
	}
}

/**
 * in split mode, synchronize zoom levels between both frames
 */
function syncZoom(extent, zoomFactor, anchor, level) {
    console.log("zoom");
    for (var i = 0; i < parent.frames.length; i++) {
        if (parent.frames[i].name != self.name) { 
            try {
                parent.frames[i].counter = 0;
                console.log(level + "/" + zoomFactor);
                parent.frames[i].map.setLevel(level);
            } catch (err) {
                console.log("zoom failed");
            }
        }
    }
}

/**
 * sync both maps in split mode
 * check counter (check if the pan happened through actual mouse input) and
 * if the centers of both maps aren't identical
 */
function reCenterAndZoom(center, zoom, extent, frameNr) {
	if (counter < 1 && map.extent.getCenter().x != center.x && map.extent.getCenter().y != center.y) {
        map.centerAndZoom(center, zoom);
    }
    counter++; //is only reset to zero on onMouseDown()
}

/**
 * this method check on page creation if this is in split mode
 * if it is then the split-button is removed on the newly created frame
 */
function onLoadCheck() {
    if (self.name == "frame2") {
        document.getElementById("splitDiv").removeChild(document.getElementById("slideAwayButton_split"));
        if(map != null){
          map.setLevel(parent.frames[0].map.getLevel());
        }
    }

}

/**
 * programmatically add onMouseOver-tooltips
 */
function addTooltips() {
    //GeburtenRate Layer
    new dijit.Tooltip({
        connectId: ["geburtenrateInfo"],
        label: "Diese Ebene zeit an wieviele <br>Geburten es im Jahr 2010 gab.<br><b>Einheit: </b>Anzahl der geborenen Babys",
        showDelay: 0
    });
    //Demographie Layer
    new dijit.Tooltip({
        connectId: ["demographieInfo"],
        label: "Diese Ebene zeigt an wieviele <br>Menschen aus den Bezirken im Jahr <br>2010 weggezogen sind.<br><b>Einheit: </b>Anzahl der Forgezogenen",
        showDelay: 0
    });
    //Sterberate Layer
    new dijit.Tooltip({
        connectId: ["sterberateInfo"],
        label: "Diese Ebene zeigt an wieviele <br>Verstorbene es im Jahr 2010 gab.<br><b>Einheit: </b>Anzahl der Verstorbenen",
        showDelay: 0
    });
    //Religion Layer
    new dijit.Tooltip({
        connectId: ["religionInfo"],
        label: "Diese Ebene zeigt die Religionszugehörigkeit an.<br><br><b>Diese Ebene kann nicht eingefärbt <br>(klassifiziert) werden, durch Klicken auf die <br>Bezirke können Diagramme angezeigt werden.</b>",
        showDelay: 0
    });
    //Pflegehilfe Layer	
    new dijit.Tooltip({
        connectId: ["pflegehilfeInfo"],
        label: "Diese Ebene zeigt an wieviele Leistungsempfänger <br>es in den Pflegestufen 1, 2 oder 3 gibt.<br><br><b>Diese Ebene kann nicht eingefärbt <br>(klassifiziert) werden, durch Klicken auf die <br>Bezirke können Diagramme angezeigt werden.</b>",
        showDelay: 0
    });
    //Themenauswahl Menü
    new dijit.Tooltip({
        connectId: ["themenauswahlInfo"],
        label: "In diesem Untermenü kannst du aussuchen,<br>welche Daten als Ebene über die Karte <br>gelegt werden können.",
        showDelay: 0
    });
    //Klasseneinteilung Menü
    new dijit.Tooltip({
        connectId: ["klasseneinteilungInfo"],
        label: "In diesem Untermenü kannst du <br>die Farbgebung der Karte anpassen.",
        showDelay: 0
    });
}

dojo.addOnLoad(init);
