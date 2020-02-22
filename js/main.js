/*
Tornadoes by Month for the 48 States
Author: Kyle Roebling
Date: 2/5/2020
This project takes monthly averages for tornadoes each state from the years 1989 to 2011 using
leaftet mapping api
*/

// Global map variables
var center = [38.50,-98.00]
var tileLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
var attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
var months = ['January','February','March','April','May','June','July','August','September','October','November','December']
index = 0


// Function to create map object, tile map background and load data to map
function createMap(){ 
    
    // Create an instance of the leaflet mapping object
    var map = L.map('mapid',{
        center: center,
        zoom: 4
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
        updatePoints(map, months[index]);
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
                console.log(props[month]);
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
            
            panel_list(layer.feature,month);
        
        };
});
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
            updatePoints(map,months[sliderIndex]);
            
        };
    });
    
};
    


// load dataset tornadoData.geojason using Ajax call
function getData(map){
    
    $.when(pointData(), polygonData()).done(function(responsePoints, responsePolygons){
            statePoints = createPoints(map,responsePoints,months);
            statePolygons = createPolygons(map,responsePolygons,months[0]);
            createSequenceControls(map,months);;
            checkRadio(map,statePoints,statePolygons,months[index]);
            
            
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