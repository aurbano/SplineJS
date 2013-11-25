/*!
 * SplineJS JavaScript Library v0.0.1
 * https://github.com/aurbano/SplineJS
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */
(function() {
	// "use strict";
	// Reference to global object
	var root = this;
	// Previous value of SplineJS just in case
	var previousSpline = root.Spline;
	// Create local references to array methods we'll want to use later.
	var array = [];
	var push = array.push;
	var slice = array.slice;
	var splice = array.splice;
	// Top-level namespace. It will get exported
	var Spline;
	if(typeof exports !== 'undefined'){
		Spline = exports;
	}else{
		Spline = root.Spline = {};
	}
	
	// Current version
	Spline.VERSION = '0.0.1';
	
	// noConflict mode
	Spline.noConflict = function(){
		root.Spline = previousSpline;
		return this;
	};
	
	// Test it
	Spline.test = function(){
		console.log("Spline v"+Spline.VERSION+" is working");
	};
	
	/**
	 * Create a new figure in the specified selector 
	 */
	Spline.newFigure = function(name, selector){
		
	};
	
	/**
	 * Create a new figure in the specified selector
	 * @param {String} selector
	 */
	Spline.figure = function(name){
		
	};
	
	/**
	 * Plot the data 
	 * @param {Array} x values
	 * @param {Array} y values
	 * @param {Object} linespec: Line parameters (Color and thickness)
	 */
	Spline.plot = function(x, y, linespec){
		
	};
	
}).call(this);