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

	$("#dataInput").on("change",function(){
		var domFileObject = $("#dataInput").get(0).files[0];
		var fileName = domFileObject.name;
		var fileExtension = fileName.substring(fileName.lastIndexOf('.')+1, fileName.length);
		if (fileExtension !== "cv"){
			alert("please enter a csv file.");
		}
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
        .attr("id", function(d, i) {
		return "country" + d.properties.NAME;
	    })
        .attr("class", "country");
    
    //TODO?: get NAME and modify style of hovered object only once into a mouseover, then call the .on("mousemove"? Might be more optimized.
    countries.on("mousemove", function(data){
	    //The tooltip has to track the mouse and change its style/content.
	    mouse = d3.mouse(this);
	    x = mouse[0];
	    y = mouse[1];
		tooltip.html(data.properties.NAME)
			.style("left", d3.event.pageX-400 + "px")
			.style("top", d3.event.pageY-150 + "px")
			.attr("width", 200)
			.attr("height", 200);
	    tooltip.transition()
			.duration(100)
			.style("opacity", 1);
	    //the country also has to change its style to make it clear it is under observation.
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

	var clickedCountry;
	var table = $(".table");
	countries.on("click",function(data){
		clickedCountry = data.properties.NAME
		if (table.children().length === 0){
			var thCountry = "<th>Pays:</th>";
			var thNumber = "<th>Nombre:</th>";
			table.append("<thead><tr>"+ thCountry + thNumber +"</tr></thead><tbody id='tableBody'></tbody>");
		}
		if ($("td#" + data.properties.NAME).length <1){
			var tdCountry ="<td id="+data.properties.NAME+">"+data.properties.NAME+"</td>";
			var tdCountryNumber ="<td id="+data.properties.NAME+"Counter>"+1+"</td>" 
			$("#tableBody").append("<tr>"+tdCountry+tdCountryNumber+"</tr>");			
		}
		else{
			var currentValue = Number($("#"+data.properties.NAME+"Counter").text());
			$("#"+data.properties.NAME+"Counter").text(currentValue+1);
		}
		//after updating the table of counters, we update colorations as well
		mapColoration();
	});

	var countersObject = {};
	function mapColoration(){
		//TODO:check the right way to get its value. Unsure it is this way.
		var colorPlages =  Number($("#colorPlagesInput").val());
		//I chose to put the counters on a custom object to make it populable both by a .csv or by looking at the table, according to the user's choice.
		var counters = $("[id*=Counter]");
		counters.each(function(k,v){
			countersObject[v.id.split("Counter")[0]] = v.innerHTML;
		});
		countersObject
	}
}
