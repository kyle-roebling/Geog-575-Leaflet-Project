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
    
    //load data to the map
    getData(map);

};

// function that creates marker symbols and creates a geoJson layer to add to the map
function createMarkers(map,response){
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
}
        //create a Leaflet GeoJSON layer and add it to the map
        L.geoJson(response, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                    }
        }).addTo(map);
}


// load dataset tornadoData.geojason using Ajax call
function getData(map){
    $.ajax("data/tornadoData.geojson", {
        dataType: "json",
        success: function(response){
            createMarkers(map,response);
        }
    });
}



$(document).ready(createMap);