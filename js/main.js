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




// load dataset tornadoData.geojason using Ajax call
function getData(map){
    $.ajax("data/tornadoData.geojson", {
        dataType: "json",
        success: function(response){
            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(response).addTo(map);
        }
    });
}











$(document).ready(createMap);