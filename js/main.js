/*
Tornadoes by Month for the 48 States
Author: Kyle Roebling
Date: 2/5/2020
This project takes monthly averages for tornadoes each state from the years 1989 to 2011 using
leaftet mapping api
*/

// Global map variables
var center = [38.50,-98.00]
//var tileLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
var tileLayer = 'https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoia3JvZWJsaW5nIiwiYSI6ImNqeXczaGplMjB3YjgzYmxyZGU1OG90bXUifQ.ItIrq8YGHvZIilkcx-U8Ag'

var attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
var months = ['January','February','March','April','May','June','July','August','September','October','November','December']
index = 0
var point = true;
var polygon = false;


// Function to create map object, tile map background and load data to map
function createMap(){ 
    
    $('#main_header').height(window.innerHeight * .09);
    $('#mapid').height(window.innerHeight * .91);
    
    // Create an instance of the leaflet mapping object
    var map = L.map('mapid',{
        center: center,
        zoom: 4.25
    });
    

    //add base tilelayer
    L.tileLayer(tileLayer, {
        attribution: attribution
    }).addTo(map);
    
    //load data from source files
    getData(map);
    
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 50;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map,month){
    //start with min at highest possible and max at lowest possible number
    var min = 1,
        max = -Infinity;

    map.eachLayer(function(layer){

        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[month]);


            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

// function that creates marker symbols and creates a geoJson layer to add to the map
function pointToLayer(feature,latlng, months){
    
    // Assign Attribute field to show
    var attribute = months[0];
    
    //create marker options
    var options = {
        radius: 8,
        fillColor: "Red",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8

}

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    
    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<h4>"+ months[0] + "</h4>"+ "<p><b>State:</b> " + feature.properties.State + "</p>" + "<p> <b>Tornadoes: </b>" +  feature.properties[attribute]  +"</p>"

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius)
    });
    
    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });
    
    panel_list(feature,attribute);
        

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

function createPoints(map,data, months){
    //create a Leaflet GeoJSON layer and add it to the map
    return  L.geoJson(data, {

                pointToLayer: function(feature, latlng){
                    return pointToLayer(feature, latlng, months);
                }

                });
}

function mapControls(map,months){
    
    var SequenceControl = L.Control.extend({
        options:{
            position: 'topright'
        },
        
        onAdd: function(map){
            
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'mapControls');
            
            // add radio controls for Proportional Symbol and Chropleth
            $(container).append('<input type="radio" id="point" name="point" value="Proportional" checked="checked">')
             $(container).append('<label for="point">Proportional Symbol</label><br>')
            
            $(container).append('<input type="radio" id="polygon" name="polygon" value="Choropleth" >')
            $(container).append('<label for="polygon">Choropleth</label><br>')

        
            return container;
        }
            
    });
    
    map.addControl(new SequenceControl());
    
}

function createSequenceControls(map,months){
    var SequenceControl = L.Control.extend({
        options:{
            position: 'bottomleft'
        },
        
        onAdd: function(map){
            
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            
            //Foward and Reverse Buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse"> <img src="img/reverse.png"> </button>');
            $(container).append('<button class="skip" id="forward" title="Forward"> <img src="img/forward.png"> </button>');
    
            return container;
        }
    });
    
    map.addControl(new SequenceControl());
              
    //set slider attributes
    $('.range-slider').attr({
            max: 11,
            min: 0,
            value: 0,
            step: 1
        });
    
     //input listener for slider
    $('.range-slider').click(function(){
        // starting index value
        index = $('.range-slider').val();
        clearPanel();
        updatePoints(map, months[index]);;
    });
    
    //input listener for buttons
    $('.skip').click(function(){
        //Assign slider index value
        index = $('.range-slider').val();
        
        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //if past the last attribute, wrap around to first attribute
            index = index > 11 ? 0 : index;
            clearPanel();
            updatePoints(map, months[index]);
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //if past the first attribute, wrap around to last attribute
            index = index < 0 ? 11 : index;
            clearPanel();
            updatePoints(map, months[index]);
        };
        
        //update slider
        $('.range-slider').val(index);
        
   
    });  
}

function createLegend(map,months){

    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        
    onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            // add title to hold month value
            $(container).append('<div id="month-legend">')
            
            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')
        
            return container;
        }
    });

    map.addControl(new LegendControl());
    legendSymbol(map,months[index]);
    
}

function legendChoropleth(month){
    
    $('#month-legend').html(month);
    
    grades = [1,7,14]
    
    $('#temporal-legend').empty();
    
    for (var i = 0; i < grades.length; i++) {
        $('#temporal-legend').append( ' <i style="background:' + color(grades[i] + 1) + '"></i>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+')); 
    };
}

function legendSymbol(map,month){
    
        $('#temporal-legend').empty();
    
        //Step 1: start attribute legend svg string
        var svg = '<svg id="attribute-legend" width="180px" height="60px">';
        
        //object to base loop on
        var circles = {
        max: 20,
        mean: 40,
        min: 60
        };

        //loop to add each circle and text to svg string
        for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="red" fill-opacity="0.8" stroke="#000000" cx="30"/>';

            //text string
            svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
            };

        //close svg string
        svg += "</svg>"
    
        //add attribute legend svg to container
        $('#temporal-legend').append(svg);
    
        updateLegend(map,month);
}

function updateLegend(map,month){
   
    $('#month-legend').html(month);
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map,month);
    
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });
        
        //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]) + " Tornadoes");
    }
};

                            
function getIndex(){
    return $('.range-slider').val();
}

function panel_list(feature,month){
    
    if (feature.properties[month] > 0){
         // Add tornado data to the side panel
        $("#state_list").append("<li>" + feature.properties.State + "  "  +  feature.properties[month]  + "</li>");
    
    };
};

function clearPanel(){
    $("ul").empty();
};

// Update the symbols as the months change
function updatePoints(map, month){

    map.eachLayer(function(layer){
        //console.log(layer.feature);
        if (layer.feature && layer.feature.properties['State']){

            //access feature properties
            var props = layer.feature.properties;
        
            //For each feature, determine its value for the selected attribute
            var newValue = Number(props[month]);
            
            if (layer.feature.geometry.type === "Point"){
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(newValue);
                layer.setRadius(radius);
              
            };
            
            if (layer.feature.geometry.type === "MultiPolygon"){
                value = color(props[month]);
                layer.setStyle({fillColor: value})
                
                
                //event listeners to open popup on hover for choropleth
                layer.on({
                    mouseover: function(){
                        this.openPopup();
                    },
                    mouseout: function(){
                        this.closePopup();
                    }
                    });
            };
            
            //build popup content string
            var popupContent = "<h4>"+ month + "</h4>"+"<p><b>State:</b> " + props.State + "</p>" + "<p> <b>Tornadoes: </b>" +  props[month]  +"</p>"

            //bind the popup to the circle marker
            layer.bindPopup(popupContent);
            
            //recreate the panel text for the current month selected
            panel_list(layer.feature,month);
                 
        };
         
    });
    console.log(point);
    console.log(polygon);

    if(point){
         updateLegend(map,month);
    } else if (polygon){
         legendChoropleth(month);
    };

}

function createPolygons(map,data){
    return L.geoJSON(data,{
        style: choropleth,
    });
}

function color(data){
    return data > 14  ? '#f03b20' :
           data > 7   ? '#feb24c' :
           data >= 1   ? '#ffeda0' :
                        '#e0e0d1';
};

function choropleth(feature) {

    return {
        fillColor: color(feature.properties.january),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}


function checkRadio(map,statePoints,statePolygons,month){
    // add points to map first
    statePoints.addTo(map);
    
    // if choropleth is selected remove proportional symbols and add choropleth
    $("#polygon").on( "click", function(){
        console.log('polygon');
        $("#point").prop("checked", false)
        if ($("input:checked" ).val() === "Choropleth"){
            $("#polygon").prop("checked", true);
            statePoints.remove();
            statePolygons.addTo(map);
            clearPanel();
            sliderIndex = getIndex();
            point = false;
            polygon = true;
            console.log(point);
            console.log(polygon);
            updatePoints(map,months[sliderIndex]);
        };
    });
    
    // if proportional is selected remove choropleth symbols and add proportional
    $("#point").on( "click", function(){
        $("#polygon").prop("checked", false)
        if ($( "input:checked" ).val() === "Proportional"){
            $("#point").prop("checked", true)
            $("#polygon").prop("checked", false);
            statePolygons.remove();
            statePoints.addTo(map);
            clearPanel();
            sliderIndex = getIndex();
            console.log(point);
            console.log(polygon);
            point = true;
            polygon = false;
            legendSymbol(map,month)
            updatePoints(map,months[sliderIndex]);
             
        };
    });
    
};
    


// load dataset tornadoData.geojason using Ajax call
function getData(map){
    
    $.when(pointData(), polygonData()).done(function(responsePoints, responsePolygons){
            statePoints = createPoints(map,responsePoints,months);
            statePolygons = createPolygons(map,responsePolygons,months[0]);
            createSequenceControls(map,months);
            mapControls(map,months);
            checkRadio(map,statePoints,statePolygons,months[index]);
            createLegend(map,months);       
    });


    function pointData(){
        return $.ajax("data/tornadoData.geojson", {    
                dataType: "json"  
            })
    };

    function polygonData(){
        return $.ajax("data/Polygon_Tornado.geojson", {
            dataType: "json"
            })
    };
  
    
}

$(document).ready(createMap);