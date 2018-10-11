$(document).ready(initiatePage);

function initiatePage(){
    
    //TODO: get these data from a configuration file
    var geoJson = "data/medium_scale_cultural_countries.geojson";
    var resultat = d3.json(geoJson)
	.then(function(parsedJson) {
		drawMap(parsedJson);
		
	    })
	.catch(function(error) {
		alert("erreur!!!!\n" + error);
	    }); 
    
};

function drawMap(parsedJson){
    var height = 500;
    var coordinates = [0, 0];
    var x = coordinates[0];
    var y = coordinates[1];
    var projection = d3.geoMercator()
	.center([0, 45])
	.scale(170);
    
    var geoGenerator = d3.geoPath()
	.projection(projection);
    var path = geoGenerator(parsedJson); // path is used to set d
    
    
    var svg = d3.select(".map-parent").append("svg")
	.attr("id", "map")
	.attr("width", "100%")
	.attr("height", height);
    var zoomListener = d3.zoom()
    	.on("zoom",function() {
		g.attr("transform",d3.event.transform)
	    });
    svg.call(zoomListener);
    
    var background = svg.append("rect")
	.attr("class", "background")
	.attr("width", "100%")
	.attr("height", "100%")
	.on("click",function(){
		initiateOrBindSliderColors(this.getAttribute("class"));
	});
    
    var g = svg.append("g");
    
    
    var tooltip = d3.select(".map-parent").append("div")
	.attr("class", "tooltip")
	.style("opacity", 1);
    
    var countries = g.selectAll("path")
        .data(parsedJson.features)   
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr("id", (d) => "sov" + d.properties.SOVEREIGNT + d.properties.NAME)
	.attr("class", "sov")
	.attr("name", (d) => d.properties.NAME)
	.attr("cont", (d) => d.properties.CONTINENT);//TODO: name and cont might be simpler to set here.
    
    //TODO?: get NAME and modify style of hovered object only once into a mouseover, then call the .on("mousemove"? Might be more optimized.
    var tooltipText;
    countries.on("mousemove", function(d){
	    //The tooltip has to track the mouse and change its style/content.
	    mouse = d3.mouse(this);
	    x = mouse[0];
	    y = mouse[1];
	    if (d.properties.SOVEREIGNT !== d.properties.NAME)
		tooltipText = d.properties.SOVEREIGNT + "</br>(" + d.properties.NAME+")"
		else
		    tooltipText = d.properties.SOVEREIGNT + "</br>";
	    tooltip.html(tooltipText)
		.style("left", d3.event.pageX-460 + "px")
		.style("top", d3.event.pageY-150 + "px")
		.attr("width", 200)
		.attr("height", 200);
	    tooltip.transition()
		.duration(100)
		.style("opacity", 1);
	    //the sov also has to change its style to make it clear it is under observation.
	    //TODO: find another change of style which would be more stylish (coloration change?)
	    d3.select(this).transition()
		.duration(200)
		.attr("opacity", 0.9);
	});
    
    countries.on("mouseout",function(){
	    tooltip.transition()
		.duration(200)
		.style("opacity", 0);
	    d3.select(this).transition()
		.duration(200)
		.attr("opacity", 1);
	})
	
	var oStats = {};
    countries.on("click",function(d){
	    oStats = updateClickHistory(d, oStats);
		constructTable(d,oStats);
		drawLegend(oStats);
	bindDomListeners(oStats);
		colorSovs(oStats, {"tableColored": getConfig()["tableColored"]}); // may change the country class and thus bind SliderColors to the new one.
		initiateOrBindSliderColors(this.getAttribute("class"));
	});
	
    initiateOrBindSliderColors("sov");
    
    function constructTable(d, oStats) {
		if ($('p#noTable').length !== 0) {
			$('p#noTable').remove();
			$("h2").after("<button id='tableColored' class='btn btn-default'>Décolorer le tableau</button>");
		}
	//Destroy the previous table before recreating a new one
	$("tr:not(tr:first-child),td").remove();
	var isFirstClick;
	var sov = Object.keys(oStats);
		isFirstClick = (sov.length === 1 && oStats[sov]["sovTotal"] === 1 ? true : false);
		if (isFirstClick) {
		    var thSov = "<th>Souveraineté:</th>";
		    var thName = "<th>Nom:</th>";
		    var thNumber = "<th>Nombre:</th>";
		    $("table").append("<thead><tr>" + thSov + thName + thNumber + "</tr></thead><tbody></tbody>");
		}
		//sorting sovTotals
		var sovTotalsOrdered = [];
		for (var sov in oStats){
		    sovTotalsOrdered.push(oStats[sov]["sovTotal"]);
		}
		//TODO: Currently, when several names of same sov catches up another sov, it is not stable if it is written before or after this other one. 
		//So, it may be useful to set a rule for which one should be written first in evenly cases.
		sovTotalsOrdered.sort();
		//sorting sov:
		var sovOrdered = Object.keys(oStats);
		sovOrdered.sort(function(a,b){
			return oStats[b]["sovTotal"]-oStats[a]["sovTotal"];
		    })
		    
		    var nameSorted;
		for (var i=0; i<sovOrdered.length; i++){
		    nameSorted = Object.keys(oStats[sovOrdered[i]]);
		    nameSorted.splice(nameSorted.indexOf("sovTotal"),1)
			nameSorted.sort(function(a,b){
				return oStats[sovOrdered[i]][b] - oStats[sovOrdered[i]][a];
			    });
		    var isSovSpanned = false;
		    for (var j=0; j<nameSorted.length; j++){
			if (nameSorted.length > 1 && j===0){
			    var tdSov = constructTableTag("td",sovOrdered[i],nameSorted[j], sovOrdered[i], nameSorted.length);
			    var tdSovTotal = constructTableTag("td", sovOrdered[i],nameSorted[j], oStats[sovOrdered[i]]["sovTotal"], nameSorted.length);
			    isSovSpanned = true;
			}
			else if (!isSovSpanned){
			    var tdSov = constructTableTag("td",sovOrdered[i],nameSorted[j], sovOrdered[i]);
			    var tdSovTotal ="";
			}
			else if (isSovSpanned){
			    var tdSov = "";
			    var tdSovTotal ="";
			}
			var tdName = constructTableTag("td",sovOrdered[i],nameSorted[j], nameSorted[j]);
			var tdNameCounter = constructTableTag("td",sovOrdered[i],nameSorted[j], oStats[sovOrdered[i]][nameSorted[j]]);
			$("table").append("<tr>"+tdSov+tdName+tdNameCounter+tdSovTotal+"</tr>");
		    }
		}
    }
    
    function updateClickHistory(d, oStats){
	var sov = d.properties.SOVEREIGNT;
	var name = d.properties.NAME;
	if (sov in oStats === false){
	    var o = {};
	    o[name] = 1;
	    o["sovTotal"] = 0; //incremented at the end of the function
	    oStats[sov] = o
		}
	else if (name in oStats[sov]){
	    oStats[sov][name] += 1;
	}
	else
	    oStats[sov][name] = 1;
	oStats[sov]["sovTotal"] += 1;
	//oStats has all the infos to construct the table.
	return oStats;
    }
    
    
    function constructTableTag(tagType, clickedSov,clickedName, content, optionRowSpan){
	if (optionRowSpan)
	    return "<"+tagType+" data-sov='" + clickedSov + "' data-name='" + clickedName + "' rowspan='"+optionRowSpan+"'>" + content + "</"+tagType+">";
	else
	    return "<"+tagType+" data-sov='" + clickedSov + "' data-name='" + clickedName + "'>" + content + "</"+tagType+">";
	
    }
    
    function colorTable(d,oStats){
	//
    }
    
    function initiateOrBindSliderColors(classElementToBind){
		//I had problems when an element with several classes bound to colors. Thus only the last one is used for binding.
		classElementToBind = classElementToBind.split(" ");
		classElementToBind = classElementToBind[classElementToBind.length-1];
		var oCurrentColor = getRGB($("."+classElementToBind.replace(" ", ",")).css("fill"));
		var sliders = $("#red, #green, #blue");
		if ($(".ui-slider").length>0)//Reinitiate sliders by destroying previous listeners
		{
			sliders.off( "slide");
		}
			sliders.slider({
			range: "true",
				min: 1,
				max: 255,
				});
		//each time the user click onto the map, the sliders remind the actual value of newly bind element
		$("#red").slider("option","value",oCurrentColor["red"]);
		$("#green").slider("option","value",oCurrentColor["green"]);
		$("#blue").slider("option","value",oCurrentColor["blue"]);
		sliders.on( "slide", function( event, ui ) {
			var newRed = $( "#red" ).slider( "value" );
			var newGreen = $( "#green" ).slider( "value" );
			var newBlue = $( "#blue" ).slider( "value" );
			var newColor = "rgb("+newRed+","+newGreen+","+newBlue+")";
			//again, I cannot afford several classes to be bound. The last one is used.
			$("[class$='"+classElementToBind+"']").css("fill", newColor);
			$("[class$='"+classElementToBind+"']").css("background-color", newColor);
		} )
	}
	
	function colorSovs(oStats, opt){
		var sovs = Object.keys(oStats);
		for (var i=0; i<sovs.length; i++){
			oStats[sovs[i]]
		}
		var distribution = getMedianAndQuartiles(oStats);
		var max = distribution[0];
		var quartileSup = distribution[1];
		var median = distribution[2];
		var quartileInf = distribution[3];
		var min = distribution[4];

		$('.legendText0').text("De " + max + " (max) à " + quartileSup + "(quartile supérieur)");		
		$('.legendText1').text("De " + quartileSup + " (exclus) à " + median + "(médiane)");
		$('.legendText2').text("De " + median + " (exclus) à " + quartileInf + "(quartile inférieur)");		
		$('.legendText3').text("De " + quartileInf + "(exclus)" + min + " (min)");

		var pattern = /(legendRect[0-3])/g; //Will be used to remove legend classes previously determinated.
		Object.keys(oStats).forEach(function(sov){
		var processingSov = oStats[sov]["sovTotal"];

		var pathSov = $("path[id^='sov"+sov+"']");
		pathSov.removeClass(pathSov.attr("class").match(pattern));
		var tdSov = $("td[data-sov='"+sov+"']");
		if (opt["tableColored"] === false){
			tdSov.removeClass(pathSov.attr("class").match(pattern));
			tdSov.css("background-color","");
		}
		pathSov.css("fill",$(".sov").css("fill"));

		if (processingSov >= quartileSup ){
			pathSov.addClass("legendRect0");
			pathSov.css("fill",$("rect.legendRect0").css("fill"));
			if (opt["tableColored"] === true)
				tdSov.addClass("legendRect0");
		}
		else if (processingSov >= median ){
			pathSov.addClass("legendRect1");
			pathSov.css("fill",$("rect.legendRect1").css("fill"));
			if (opt["tableColored"] === true)
				tdSov.addClass("legendRect1");
		}
		else if (processingSov >= quartileInf ){
			pathSov.addClass("legendRect2");
			pathSov.css("fill",$("rect.legendRect2").css("fill"));
			if (opt["tableColored"] === true)
				tdSov.addClass("legendRect2");
		}
		else{
			pathSov.addClass("legendRect3");
			pathSov.css("fill",$("rect.legendRect3").css("fill"));
			if (opt["tableColored"] === true)
				tdSov.addClass("legendRect3");
		}
		if (opt["tableColored"] === true)
			tdSov.css("background-color",pathSov.css("fill"));

		$("g.legend").each(function(i,v){
			positionTextLegend(v);
			});
		})
	}
		
		function drawLegend(oStats){
			if ($(".legend").length !== 0){
				return; //avoid resetting the legend colors after a click on a country
			}
			var oConfig = getConfig();
			var width = oConfig["width"];
			var height = oConfig["height"];
		var spacing = oConfig["spacing"];//to separate g legends (1 g = 1 rect + 1 text)
		var legendSpacing = oConfig["legendSpacing"];//to separate legend texts from their rect
		var legendData = [];// [[x,y], ...] of each legend rect
		var y = 0;
		if (oConfig["horizontal"] === "left"){
			var x = 0;
		}
		else{
			var x = $("#map").width() - width;
		}
		for (var i=0;i<4;i++){
			var coord = [x,y];
			legendData.push(coord);
			y += spacing;
		}
		var svg = d3.select("svg");
		svg.selectAll(".legend").remove();//before drawing a new legend, remove the previous one
		var legend = svg.selectAll(".legend")
			.data(legendData)
			.enter()
			.append("g")
			.attr("class", (d,i)=>"legend legend"+i)
			.attr("transform", function(d){
				return "translate("+d[0]+","+d[1]+")";
			})
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));
			var legendRect = legend.append("rect")
			.attr("width",width)
			.attr("height",height)
			.attr("class", (d,i)=>"legend" + i +" legendRect"+i)
			.on("click", function(){
				initiateOrBindSliderColors(this.getAttribute("class"));
			});
			legend.append("text")
			.text("TODO: adapt the legend here")
			.attr("class", (d,i)=>"legend" + i +" legendText"+i)
			.attr("x",function(){
				if (getConfig()["horizontal"] ==="right"){
					var legendWidth=this.getBBox().width;
					return -legendWidth-legendSpacing;
				}
				return width + legendSpacing;
			})
			.attr("y",height-5);
	}

	function positionTextLegend(gLegendNode){
		var oConfig = getConfig()
		var legendSpacing = oConfig["legendSpacing"];
		var sLegendTextDir = oConfig['sLegendTextDir'];
		var rectWidth = oConfig['width'];
		var mapWidth = $("#map").width();
		var legendText = d3.select(gLegendNode).select("text")
		var textLegendNode = gLegendNode.children[1];
		var legendWidth=textLegendNode.getBBox().width;
		//I used to get x with d3.event.x but I also have to reposition legend text from radio button, thus the 3 following lines.
		var currentTransform = gLegendNode.getAttribute("transform").split(",");
		var currentX = parseInt(currentTransform[0].split('(')[1]);
		//var currentY = currentTransform[1].split(')')[0];//TODO: use it to offer to reposition the text in up and down positions
		var isTooCloseFromLeft = (currentX - legendWidth - legendSpacing)<0;
		var isTooCloseFromRight = (currentX + legendWidth + rectWidth + legendSpacing)>mapWidth;
		if (isTooCloseFromLeft){
			legendText.attr("x",rectWidth + legendSpacing);
		}
		else if(isTooCloseFromRight){
			legendText.attr("x",-legendWidth-legendSpacing);
		}
		else{
			sLegendTextDir==="right"?
			legendText.attr("x",rectWidth +legendSpacing)
			: legendText.attr("x",-legendWidth-legendSpacing);
		}
	}

	function dragstarted(d) {
		d3.select(this).raise().classed("active", true);
	  }
	  
	  function dragged(d) {
		  positionTextLegend(this);
		  d3.select(this).attr("transform","translate("+d3.event.x+","+d3.event.y+")");
	  }
	  
	  function dragended(d) {
		d3.select(this).classed("active", false);
	  }

	function bindDomListeners(oStats){
		$("#tableColored").click(function(){
			if ($("#tableColored").attr("class") === "btn btn-default"){
				$("#tableColored").attr("class", "btn btn-info");
				$("#tableColored").text("Colorer le tableau");
				colorSovs(oStats, {"tableColored": false});
			}
			else{
				$("#tableColored").attr("class", "btn btn-default");
				$("#tableColored").text("Décolorer le tableau");
				colorSovs(oStats, {"tableColored": true});
			}
		})
		var inputLegendTextDirs = $("input[name='legendTextDir']")
								.change(function(){
									$("g.legend").each(function(i,v){
										positionTextLegend(v);
									});
								});

	}
	
	function getRGB(str){
		var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
		return match ? {
		  red: match[1],
		  green: match[2],
		  blue: match[3]
		} : {};
	  }

	  function getMedianAndQuartiles(oStats){
		var quartileInf;
		var quartileSup;
		var median;
		var sovTotals = [];
		var sovs = Object.keys(oStats)
		for (var i =0; i<sovs.length; i++){
			sovTotals.push(oStats[sovs[i]]["sovTotal"]);
		};
		sovTotals.sort(function(a,b){
			return a-b;
		  });
		  median = getMedian(sovTotals);
		  //Firstly, determining very specific cases such as 0, 1 or 2 data
		  if (sovTotals.length === 0) return;
		  if (sovTotals.length === 1){
			quartileInf = sovTotals[0], quartileSup = sovTotals[0];
		  }
		  else if (sovTotals.length === 2){
			quartileInf = sovTotals[0], quartileSup = sovTotals[1]
		  }
		  //then we should get normal values from a more reasonable distribution
		  else{

			  lowerHalf = [];
			  upperHalf = [];
			  var distLen = sovTotals.length;
			  var halfFloor = Math.floor(distLen/2);
			  var halfCeiling = halfFloor+1;
			  if (distLen %2===0){
				  for (var i=0 ; i<distLen/2 ; i++){
					  lowerHalf.push(sovTotals[i]);
					}
					for (var i=distLen/2 ; i<distLen ; i++){
						upperHalf.push(sovTotals[i]);
					}
				}
				else{
					for (var i=0; i<halfFloor; i++){
						lowerHalf.push(sovTotals[i]);
					}
					for (var i=halfCeiling; i<distLen; i++){
						upperHalf.push(sovTotals[i]);
					}
				}
				var quartileInf = getMedian(lowerHalf);
				var quartileSup = getMedian(upperHalf);
			}
				return [Math.max.apply(Math,sovTotals), quartileSup, median, quartileInf, Math.min.apply(Math,sovTotals)];
			}
			
		function getMedian(sovTotalsArray){
			var arrayLength = sovTotalsArray.length;
			sovTotalsArray.sort(function(a,b){
				return a-b;
			  });
			if(arrayLength ===0) return 1;
			else if(arrayLength ===1) return sovTotalsArray[0];
			var half = arrayLength/2;
			if (arrayLength %2 !==0){
				var median = sovTotalsArray[(arrayLength - 1) / 2];
			}
			else{
				var median = (sovTotalsArray[arrayLength / 2 - 1] + sovTotalsArray[arrayLength / 2]) / 2;
			}
			return median;
		}
}

function getConfig(){
	//TODO: get values in a form
	var tableColored = ($("#tableColored").attr("class") === "btn btn-default" ? true : false);  // default=colored table
    var sHorizontal = $('div#horizontal input:checked').val();
    var sLegendTextDir = $('div#legendTextDir input:checked').val();
    return {"spacing" : 25,
			"legendSpacing" : 5,
			"horizontal" : sHorizontal,
			"sLegendTextDir" : sLegendTextDir,
			"width" : 20,
			"height" : 20,
			"tableColored" : tableColored};
}