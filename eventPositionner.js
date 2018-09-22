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

	var clickedSov;
	var clickedName;
	var table = $(".table");
	countries.on("click",function(d,i,li){
		clickedSov = d.properties.SOVEREIGNT;
		clickedName = d.properties.NAME
		if (table.children().length === 0){
			var thSov = "<th>Souveraineté:</th>";
			var thName = "<th>Nom:</th>";
			var thNumber = "<th>Nombre:</th>";
			table.append("<thead><tr>" + thSov + thName + thNumber +"</tr></thead><tbody id='tableBody'></tbody>");
		}
		if ($("td[data-name='"+clickedName+"']").length <1){
			var tdSov = "<td data-sov='"+clickedSov+"' data-name='"+clickedName+"'>"+clickedSov+"</td>";
			var tdName = "<td data-sov='"+clickedSov+"' data-name='"+clickedName+"'>"+clickedName+"</td>";
			var tdSovNumber ="<td data-sov='"+clickedSov+"' data-name='"+clickedName+"'>"+1+"</td>" 
			$("#tableBody").append("<tr>"+tdSov+tdName+tdSovNumber+"</tr>");			
		}
		else{
			var currentValue = parseInt($("td[data-name="+clickedName+"]").last().text());
			$("td[data-name="+clickedName+"]").last().text(currentValue+=1);
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
	}
}
