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

// Create slider of the sequence interaction with the user
function createSequenceControls(map,months){
    //Slider
    $('#slider').append('<input class="range-slider" type="range">');
    //Foward and Reverse Buttons
    $('#slider').append('<button class="skip" id="reverse">Reverse</button>');
    $('#slider').append('<button class="skip" id="forward">Skip</button>');
    //Add icons for Foward and Reverse
    $('#reverse').html('<img src="img/reverse.png">');
    $('#forward').html('<img src="img/forward.png">');
    
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
        var index = $('.range-slider').val();
        clear_panel();
        updatePoints(map, months[index]);
    });
    
    //input listener for buttons
    $('.skip').click(function(){
        //Assign slider index value
        var index = $('.range-slider').val();
        
        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //if past the last attribute, wrap around to first attribute
            index = index > 11 ? 0 : index;
            clear_panel();
            updatePoints(map, months[index]);
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //if past the first attribute, wrap around to last attribute
            index = index < 0 ? 11 : index;
            clear_panel();
            updatePoints(map, months[index]);
        };
        
        //update slider
        $('.range-slider').val(index);
        
    });
}

function panel_list(feature,month){
    
    if (feature.properties[month] > 0){
         // Add tornado data to the side panel
        $("#state_list").append("<li>" + feature.properties.State + "  "  +  feature.properties[month]  + "</li>");
    
    };
};

function clear_panel(){
    $("ul").empty();
};

// Update the symbols as the months change
function updatePoints(map, month){

    map.eachLayer(function(layer){

        if (layer.feature && layer.feature.properties['State']){

            //access feature properties
            var props = layer.feature.properties;
        
            //For each feature, determine its value for the selected attribute
            var newValue = Number(props[month]);
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(newValue);
            layer.setRadius(radius);
            
            //build popup content string
            var popupContent = "<h4>"+ month + "</h4>"+"<p><b>State:</b> " + props.State + "</p>" + "<p> <b>Tornadoes: </b>" +  props[month]  +"</p>"

            //bind the popup to the circle marker
            layer.bindPopup(popupContent);
            
            panel_list(layer.feature,month);
        
        };
});
}


function createPolygons(map,data){
    return L.geoJSON(data);
}

function checkRadio(map,statePoints,statePolygons){
    // add points to map first
    statePoints.addTo(map);
    
    // if choropleth is selected remove proportional symbols and add choropleth
    $("#polygon").on( "click", function(){
        console.log('polygon');
        $("#point").prop("checked", false)
        if ($("input:checked" ).val() === "Choropleth"){
            $("#polygon").prop("checked", true);
            console.log($("input:checked" ).val());
            statePoints.remove();
            statePolygons.addTo(map);
        };
    });
    
    // if proportional is selected remove choropleth symbols and add proportional
    $("#point").on( "click", function(){
        $("#polygon").prop("checked", false)
        console.log('point');
        if ($( "input:checked" ).val() === "Proportional"){
            $("#point").prop("checked", true)
            $("#polygon").prop("checked", false);
            statePolygons.remove();
            statePoints.addTo(map);
        };
    });
    
};
    


// load dataset tornadoData.geojason using Ajax call
function getData(map){
    
    $.when(pointData(), polygonData()).done(function(responsePoints, responsePolygons){
            statePoints = createPoints(map,responsePoints,months);
            statePolygons = createPolygons(map,responsePolygons);
            createSequenceControls(map,months);
            checkRadio(map,statePoints,statePolygons);
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