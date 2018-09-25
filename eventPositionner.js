$(document).ready(initiatePage);

function initiatePage(){
	
//TODO: get these data from a configuration file
var geoJson = "data/medium_scale_cultural_countries.geojson";
var resultat = d3.json(geoJson)
    .then(function(parsedJson) {
	    drawMap(parsedJson);
		initiateColors();
		drawLegend();
	})
    .catch(function(error) {
	    alert("erreur!!!!\n" + error);
	});

	$("#dataInput").on("change",function(){
		var domFileObject = $("#dataInput").get(0).files[0];
		var fileName = domFileObject.name;
		var fileExtension = fileName.substring(fileName.lastIndexOf('.')+1, fileName.length);
		if (fileExtension !== "csv"){
			alert("please enter a csv file.");
		}
	});

	
	function initiateColors(){
		$("#red, #green, #blue").slider({
			range: "true",
			min: 1,
			max: 255,
			value: 1
		});
		$("#green").slider("option","value",255);
	}

	function drawLegend(){
		var legendData = [1,25,50,75];
		var g = d3.select("g");
		var legend =g.selectAll(".legend")
						.data(legendData)
						.enter()
						.append("rect")
						.attr("class", "legend")
						.attr("transform", function(d,i){
							return "translate("+d+","+20+")";
						})
						.attr("width",20)
						.attr("height",20);

	}
	
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
    .attr("height", "100%");
    
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
			.style("left", d3.event.pageX-400 + "px")
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
		colorTable(d,oStats);
	});

	var countersObject = {};
	function constructTable(d, oStats) {
		//we destroy the previous table before recreating a new one
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
		//TODO: get this value with a submit button
		var iColorPlages = $("#colorPlagesInput").val();
	}
}
