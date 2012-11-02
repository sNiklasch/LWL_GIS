dojo.require("dojo.fx");

var breite = window.innerWidth - 450;
var classesBtn = null;
var legendBtn = null;



dojo.ready(function () {
    var slideAwayButton_layer = dojo.byId("slideAwayButton_layer"),
        slideBackButton_layer = dojo.byId("slideBackButton_layer"),
        slideTarget_layer = dojo.byId("slideTarget_layer"),

        slideAwayButton_classes = dojo.byId("slideAwayButton_classes"),
        slideBackButton_classes = dojo.byId("slideBackButton_classes"),
        slideTarget_classes = dojo.byId("slideTarget_classes"),

        slideAwayButton_legend = dojo.byId("slideAwayButton_legend"),
        slideBackButton_legend = dojo.byId("slideBackButton_legend"),
        slideTarget_legend = dojo.byId("slideTarget_legend"),
        
        slideAwayButton_split = dojo.byId("slideAwayButton_split");

	
    var layerBtnClicked = false;
    dojo.connect(slideAwayButton_layer, "onclick", function (evt) {
        if (!layerBtnClicked) {
            dojo.fx.combine([
            dojo.fadeIn({
                node: slideTarget_layer
            }),
            dojo.fx.slideTo({
                node: slideTarget_layer,
                left: map.width - 450,
                top: "0"
            })]).play();
            layerBtnClicked = true;
        } else {
            dojo.fx.combine([
            dojo.fx.slideTo({
                node: slideTarget_layer,
                left: map.width + 50,
                top: "0"
            }),
            dojo.fadeOut({
                node: slideTarget_layer
            })]).play();
            layerBtnClicked = false;
        }
    });
    dojo.connect(slideBackButton_layer, "onclick", function (evt) {
        dojo.fx.combine([
        dojo.fx.slideTo({
            node: slideTarget_layer,
            left: map.width + 50,
            top: "0"
        }),
        dojo.fadeOut({
            node: slideTarget_layer
        })]).play();
        layerBtnClicked = false;
    });



	
    
	var classesBtnClicked = false;    
    dojo.connect(slideAwayButton_classes, "onclick", function (evt) {
        if (!classesBtnClicked) {
            dojo.fx.combine([
            dojo.fadeIn({
                node: slideTarget_classes
            }),
            dojo.fx.slideTo({
                node: slideTarget_classes,
                left: map.width - 450,
                top: "150"
            })]).play();
            classesBtnClicked = true;
        } else {
            dojo.fx.combine([
            dojo.fx.slideTo({
                node: slideTarget_classes,
                left: map.width + 50,
                top: "150"
            }),
            dojo.fadeOut({
                node: slideTarget_classes
            })]).play();
            classesBtnClicked = false;
        }
    });
    dojo.connect(slideBackButton_classes, "onclick", function (evt) {
        dojo.fx.combine([
        dojo.fx.slideTo({
            node: slideTarget_classes,
            left: map.width + 50,
            top: "220"
        }),
        dojo.fadeOut({
            node: slideTarget_classes
        })]).play();
        classesBtnClicked = false;
    });


	var legendBtnClicked = false;
	dojo.connect(slideAwayButton_legend, "onclick", function (evt) {
        if (!legendBtnClicked) {
            dojo.fx.combine([
            dojo.fadeIn({
                node: slideTarget_legend
            }),
            dojo.fx.slideTo({
                node: slideTarget_legend,
                left: 25,
                top: map.height - 300
            })]).play();
            legendBtnClicked = true;
        } else {
            dojo.fx.combine([
            dojo.fx.slideTo({
                node: slideTarget_legend,
                left: - 50,
                top: map.height - 300
            }),
            dojo.fadeOut({
                node: slideTarget_legend
            })]).play();
            legendBtnClicked = false;
        }
    });
    
    dojo.connect(slideBackButton_legend, "onclick", function (evt) {
		console.log("click legend");
        dojo.fx.combine([
        dojo.fx.slideTo({
            node: slideTarget_legend,
            left: "-500",
            top: "300"
        }),
        dojo.fadeOut({
            node: slideTarget_legend
        })]).play();
        legendBtnClicked = false;
    });
    var dualView = false;
    dojo.connect(slideAwayButton_split, "onclick", function (evt) {
        if (dualView) {
            var fs = parent.document.getElementById("frameset");
            fs.removeChild(parent.document.getElementById("frame2"));
            var fs = parent.document.getElementById("frameset");
            fs.cols = "100%";
            dualView = false;
        } else {
            var fs = parent.document.getElementById("frameset"),
                f2 = top.document.createElement('frame');
            fs.cols = "50%,50%";
            f2.name = "frame2";
            f2.id = "frame2";
            f2.src = "map.html";
            fs.appendChild(f2);
            dualView = true;
        }
    });

});
