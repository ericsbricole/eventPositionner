$(document).ready(initiatePage);

function initiatePage(){
    
    //TODO: get these data from a configuration file
	let geoJson = "data/medium_scale_cultural_countries.geojson";
    let resultat = d3.json(geoJson)
	.then(function(parsedJson) {
		drawMap(parsedJson);		
	    })
	.catch(function(error) {
		alert("the following error occured:n" + error);
	    }); 
    
};

function drawMap(parsedJson){
    let height = 500;
    let coordinates = [0, 0];
    let x = coordinates[0];
    let y = coordinates[1];
    let projection = d3.geoMercator()
	.center([0, 45])
	.scale(170);
    
    let geoGenerator = d3.geoPath()
	.projection(projection);
    let path = geoGenerator(parsedJson);
    
    let svg = d3.select(".map-parent").append("svg")
	.attr("id", "map")
	.attr("width", "100%")
	.attr("height", height);
    let zoomListener = d3.zoom()
    	.on("zoom",function() {
		g.attr("transform",d3.event.transform)
	    });
    svg.call(zoomListener);
    
    let background = svg.append("rect")
	.attr("class", "background")
	.attr("width", "100%")
	.attr("height", "100%")
	.on("click",function(){
		initiateOrBindSliderColors(this.getAttribute("class"));
	});

	function descending(a, b) {
		return b.properties.VALUE < a.properties.VALUE ? -1 : b.properties.VALUE > a.properties.VALUE ? 1 : b.properties.VALUE >= a.properties.VALUE ? 0 : NaN;
	  }
    
	let g = svg.append("g");
	
	let tooltip = d3.select(".map-parent").append("div")
				.attr("class", "tooltip text-center")
				.style("opacity", 1);
	
	parsedJson.features.forEach( (feature) => {
		feature["properties"]["VALUE"] = 0
		if (feature["properties"]["SOVEREIGNT"] === feature["properties"]["NAME"])
		feature["properties"]["TOTAL"] = 0;
		feature["properties"]["NAMESWITHVALUES"] = 0
	});

    let countries = g.selectAll("path")
        .data(parsedJson.features)   
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr("id", (d) => "sov" + d.properties.SOVEREIGNT + d.properties.NAME)
        .attr("sov", (d) => d.properties.SOVEREIGNT)
		.attr("class", "sov noData")
		.attr("name", (d) => d.properties.NAME)
    
    countries.on("mousemove", function(d){
		d3.mouse(this);
		refreshTooltipContent(d);
		tooltip.style("left", d3.event.pageX-400 + "px")
				.style("top", d3.event.pageY-250 + "px")				
				.attr("width", 200)
				.attr("height", 200)
			tooltip.transition()
				.duration(200)
				.style("opacity", 1);

		$(this).addClass("active");
	});
    drawLegend();
    countries.on("mouseout",function(){
		$(this).removeClass("active");
		tooltip.transition()
		.duration(200)
		.style("opacity", 0);
		tooltip.html("");
	})

	var unit = "click"//by default, the app will count clicks on countries

	countries.on("click", (d) => {
		refreshTooltipContent(d);
		if (d3.event.ctrlKey) {
			if (d.properties.VALUE<=0)
				d.properties.VALUE = 0
			else
				 d.properties.VALUE --;
		}
		else
			d.properties.VALUE++;
		
		runMapAndTable(d);
	});

	 function runMapAndTable(d){
		d3.selectAll("path")
		.sort( descending );
		constructTable(d);
		updateLegendText();
		reColorSovs();
	};

	

	// function getSov(sov){
	// 	return properties.NAME === sov && properties.SOVEREIGNT === sov;
	// }
	
	$("input#userFile").change(function(event){
		let csvFile = event.target.files[0];
		if (csvFile){
			$("#userFileLabel").text(csvFile.name);
			let reader = new FileReader();
			reader.readAsText(csvFile);
			reader.onloadend = function(event) {
				csvData = reader.result;
				let rows = csvData.split(/\r?\n|\r/);
				let headers = rows[0].split(",").splice(1);
				let radiosDiv = $(".radiosDiv").empty(); //empty allows to remove old radioButtons in the case of a new file is entered
				radiosDiv.prepend("<span class='text-success'>Les données suivantes ont été trouvées dans votre fichier. Choisissez laquelle visualiser et cliquez ensuite sur le bouton Chargez les données.<br/>");
				headers.forEach( (header) => {
					radiosDiv.append("<div class='radio'> <label><input type='radio' name=userDefinedLegend value='" + header +"'>" + header +"</label>");
				});
				$("#userFileLoad").removeAttr("hidden");			
		}
	}

		
		$("#userFileLoad").click( function() { 
			if ( $(".radiosDiv input:checked").length >0 ){
				$(".radiosDiv span").removeClass("text-danger");
				runMapAndTable();
			}
			else{
				$(".radiosDiv").addClass("alert alert-danger");
				$(".radiosDiv span").addClass("text-danger")
									.text("Choisissez une donnée à visualiser parmi les choix suivants.");
			}
		
		});
	});

	
	
	initiateOrBindSliderColors("noData");
	bindDomListeners();

	function refreshTooltipContent(d){
		let tooltipContent = d.properties.NAME;
		let tooltipContentUnderFlag = "";
		let flagClass = "center-block flag flag-" + d.properties.ISO_A2;
		flagClass = flagClass.toLowerCase();
		tooltipContent += "</br><img src='data/blank.gif' class='" +flagClass + "' alt='No image to load'/></div></br>";
		
		if( d.properties.VALUE !== 0){
			tooltipContentUnderFlag += "<p>	"+unit+" :</br>";
			tooltipContentUnderFlag +=  d.properties.VALUE;
		}
		else{
			tooltipContentUnderFlag += "</br><p>	Aucune donnée disponible</p>";
		}
			
		tooltipContent += tooltipContentUnderFlag += "</p>";
		tooltip.html(tooltipContent);
	}
    
    function constructTable(d) {
		if ($('p#noTable').length !== 0) {
			$('p#noTable').remove();
			$("button#tableColored").removeAttr("hidden");
		}
		//Destroy the previous table before recreating a new one
		$("tr:not(tr:first-child),td").remove();
		let isFirstClick = ($("th").length === 0 );
		if (isFirstClick) {
		    let thSov = "<th>Souveraineté:</th>";
		    let thName = "<th>Nom:</th>";
		    let thNumber = "<th>" + unit +":</th>";
		    $("table").append("<thead><tr>" + thSov + thName + thNumber + "</tr></thead><tbody></tbody>");
		}

	let sovWithData = d3.selectAll("path.sov")
						.filter( (data) => parseInt(data.properties.VALUE) > 0 )
						.attr("class","sov"); //remove the "noData" class
	let valuesOnly = sovWithData.data().map( (data => data.properties.VALUE) );
	let quartileInf = d3.quantile(valuesOnly, 0.75);
	let median = d3.quantile(valuesOnly, 0.5);
	let quartileSup = d3.quantile(valuesOnly, 0.25);

		let tbody = d3.select("tbody");
		tbody.selectAll("tr").data(sovWithData.data()).enter().append("tr");
			let tr = d3.select("tbody").selectAll("tr");
			tr.append("td")
			.text( function(d) { 
				return d.properties.SOVEREIGNT})
			tr.append("td")
				.text( function(d) { return d.properties.NAME})
			tr.append("td")
				.text( function(d) { return d.properties.VALUE});
		colorTable();
	}
	
	function colorTable(){
		let mustColorTable = $("#tableColored").attr("class").includes("btn-default");
		if (mustColorTable){

			let distribution = getMedianAndQuartiles();
			let quartileSup = distribution["quartileSup"];
			let median = distribution["median"];
			let quartileInf = distribution["quartileInf"];
			
			d3.select("tbody").selectAll("tr").attr( "class",
							function(d) {
								if (d.properties.VALUE >= quartileSup){
									return "legendRect0" }
								else if (d.properties.VALUE >= median)
									return "legendRect1";
								else if (d.properties.VALUE >= quartileInf)
									return "legendRect2";
								else if (d.properties.VALUE >= 0)
									return "legendRect3";
					});
			reColorSovs(); // Unsure why, but without it, countries with data loses their classes
		}
		else{
			d3.selectAll("tr").attr("class", "");
		}
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
	
	function reColorSovs(){

		$("g.legend").show();
		let distribution = getMedianAndQuartiles();
		let quartileSup = distribution["quartileSup"];
		let median = distribution["median"];
		let quartileInf = distribution["quartileInf"];

		let sovWithData = d3.selectAll("path.sov")
						.filter( (data) => parseInt(data.properties.VALUE) > 0 );
		if (!isNaN(median)){
			sovWithData.attr("class", function(d){
					if (d.properties.VALUE >= quartileSup)
						return "sov legendRect0";
					else if (d.properties.VALUE >= median)
						return "sov legendRect1";
					else if (d.properties.VALUE >= quartileInf)
						return "sov legendRect2";
					else if (d.properties.VALUE < quartileInf)
						return "sov legendRect3";
				});
		}
		else{
			d3.selectAll(".sov").attr("class", "sov noData"); //for some reasons, it does not work
		}

		// uncolor countries which had data
		d3.selectAll("path.sov")
			.filter( (data) => data.properties["VALUE"] === 0 )
			.attr("class", "sov noData");
	}
		
		function drawLegend(){
			if ($(".legend").length !== 0){
				return; //avoid resetting the legend colors after a click on a country
			}
			let distrib = getMedianAndQuartiles();
			var oConfig = getConfig();
			var width = oConfig["width"];
			var height = oConfig["height"];
			var spacing = oConfig["spacing"];//to separate g legends (1 g = 1 rect + 1 text)
			var legendSpacing = oConfig["legendSpacing"];//to separate legend texts from their rect
			var legendData = [];// [[x,y], ...] of each legend rect
			var y = 0;
			var x = 0;
			// var x = $("#map").width() - width; // if I want rectangles at the right
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
				legend.append("rect")
				.attr("width",width)
				.attr("height",height)
				.attr("class", (d,i)=>"legend" + i +" legendRect"+i)
				.on("click", function(){
					initiateOrBindSliderColors(this.getAttribute("class"));
				});
				legend.append("text")
				.text( (d,i) => {
					switch (i){
						case 0: return "de " + distrib["max"] + "(max) à " + distrib["quartileSup"] +"(quartile sup)" ; break;
						case 1: return "de " + distrib["max"] + "(quartileSup) à " + distrib["median"] +"(median)"; break;
						case 2: return "de " + distrib["max"] + "(median) à " + distrib["quartileInf"] +"(quartile inf)"; break;
						case 3: return "de " + distrib["quartileInf"] + "(quartileInf) à " + distrib["min"] +"(min)"; break;
					}
				} )
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
	
	function updateLegendText(){
		distrib = getMedianAndQuartiles();
		svg.selectAll("text").text( (d,i) => {
			switch (i){
				case 0: return "de " + distrib["max"] + "(max) à " + distrib["quartileSup"] +"(quartile sup)" ; break;
				case 1: return "de " + distrib["max"] + "(quartileSup) à " + distrib["median"] +"(median)"; break;
				case 2: return "de " + distrib["max"] + "(median) à " + distrib["quartileInf"] +"(quartile inf)"; break;
				case 3: return "de " + distrib["quartileInf"] + "(quartileInf) à " + distrib["min"] +"(min)"; break;
			}
		});
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
		d3.select(this).classed("active", true);
	  }

	  function dragged(d) {
		  positionTextLegend(this);
		  d3.select(this).attr("transform","translate("+d3.event.x+","+d3.event.y+")");
	  }

	  function dragended(d) {
		d3.select(this).classed("active", false);
	  }

	function bindDomListeners(){

		$(".radiosDiv").change( () => {
			$(".radiosDiv").removeClass("alert alert-danger");
			$(".radiosDiv span").removeClass("text-danger").addClass("text-success");
			unit = $(".radiosDiv input:checked").val();
			let csvFile = document.getElementById("userFile").files[0];
			if (csvFile){
				let reader = new FileReader();
				reader.readAsText(csvFile);
				reader.onloadend = function(event) {
					let csvData = reader.result;
					let rows = csvData.split(/\r?\n|\r/);
					let headers = rows[0].split(",");
					let indexOfUnit = headers.indexOf(unit);

					//before setting values read on the csv, we have to reset the previouses ones at 0
					let previousData = d3.selectAll(".sov").data();
					previousData.forEach( (data) => data.properties.VALUE = 0 );
					d3.selectAll(".sov").data(previousData)

					for (let i = 1; i<rows.length; i++){
						let row = rows[i];
						row = row.split(",");
						let countryName = row[0];
						let value = parseInt(row[indexOfUnit]);
						let d3Country = d3.selectAll(".sov")
						.filter( (d) => d.properties.NAME === countryName );
						if (!d3Country.empty()){
							let countryData = 	d3Country.data();
							countryData[0].properties.VALUE = value;
							d3Country.data( countryData[0] );
						}
					}
				}
			}
		});

		$("#tableColored").click(function(){
			if ($(this).attr("class") === "btn btn-default"){
				$(this).attr("class", "btn btn-info");
				$(this).text("Colorer le tableau");
			}
			else{
				$(this).attr("class", "btn btn-default");
				$(this).text("Décolorer le tableau");
			}
			colorTable();
		});

		$(function(){
			$("[data-toggle=popover]").popover();
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

	  function getMedianAndQuartiles(){
		let sovWithData = d3.selectAll("path.sov")
		.filter( (data) => parseInt(data.properties.VALUE) > 0 )
		.attr("class","sov"); //remove the "noData" class
		let valuesOnly = sovWithData.data().map( (data => data.properties.VALUE) );
		let max = d3.max(valuesOnly);
		let quartileSup = d3.quantile(valuesOnly, 0.25);
		let median = d3.quantile(valuesOnly, 0.5);
		let quartileInf = d3.quantile(valuesOnly, 0.75);
		let min = d3.min(valuesOnly);
		return {"max" : max === undefined ? 0 : max,
				"quartileSup" : quartileSup === undefined ? 0 : quartileSup,
				"median" : median === undefined ? 0 : median,
				"quartileInf" : quartileInf === undefined ? 0 : quartileInf,
				"min" : min === undefined ? 0 : min};
	  }
}

function getConfig(){
	//TODO: get values in a form
	let tableColored = ($("#tableColored").attr("class") === "btn btn-default" ? true : false);  // default=colored table
	let sLegendTextDir = $('div#legendTextDir input:checked').val();
    return {"spacing" : 25,
			"legendSpacing" : 5,
			"sLegendTextDir" : sLegendTextDir,
			"width" : 20,
			"height" : 20,
			"tableColored" : tableColored};
}