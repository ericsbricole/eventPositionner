//TODO: get these data from a configuration file
var geoJson = "./data/medium_scale_cultural_countries.geojson";
var resultat = d3.json(geoJson)
    .then(function(parsedJson) {
	    drawMap(parsedJson);
	})
    .catch(function(error) {
	    alert("erreur!\n" + error);
	});

function drawMap(parsedJson){
    var width = 1400;
    var height = 1400;
    var coordinates = [0, 0];
    var x = coordinates[0];
    var y = coordinates[1];
    var projection = d3.geoMercator()
	.center([0, 45 ])
	.scale(190)
	.translate([width/2, height/2]);
    
    var geoGenerator = d3.geoPath()
	.projection(projection);
    var path = geoGenerator(parsedJson); // path is used to set d
    
    var svg = d3.select("body").append("svg")
	.attr("id", "map")
	.attr("width", width)
	.attr("height", height)
	.call(d3.zoom().on("zoom", function () {
		    svg.attr("transform", d3.event.transform)
		})
	    );
    
    var g = svg.append("g")
	
	g.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", width)
	.attr("height", height);
    
    var tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);
    
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
	    coordinates = d3.mouse(this);
	    x = coordinates[0];
	    y = coordinates[1];
	    tooltip.html(data.properties.NAME)
		.style("left", x + "px")
		.style("top", y + "px");
	    tooltip.transition()
		.duration(200)
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
	
	}
