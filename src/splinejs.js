/*!
 * SplineJS JavaScript Library v0.0.1
 * https://github.com/aurbano/SplineJS
 * 
 * @author Alejandro U. Alvarez <http://urbanoalvarez.es>
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */
(function() {
	// "use strict";
	
		// Reference to global object
	var root = this,
		// Previous value of SplineJS just in case
		previousSpline = root.Spline,
		// Create local references to array methods we'll want to use later.
		array = [],
		push = array.push,
		slice = array.slice,
		splice = array.splice,
		// Top-level namespace. It will get exported
		Spline;
		
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
	
	/**
	 * Generates a row vector y of n points linearly spaced between and including a and b. For n = 1, linspace returns b.
	 * @param {int} Initial point
	 * @param {int} Final point
	 * @param {int} Number of points to return
	 * @return {Array} Row vector of n points between a and b (included) 
	 */
	Spline.linspace = function(a,b,n){
		if(typeof(n)=='undefined') n = 100;
		if(n==1) return b;
		var ret = [],
			inc = (b-a)/(n-1);
	    for (var i = a; i <= b; i+=inc) {
	    	ret.push(i);
	    }
	    // Just in case the rounding was different
	    ret[n-1] = b;
	    return ret;
	};
	
	/**
	 * Create a new figure in the specified selector
	 * @param {String} DOM selector
	 * @param {Array} Array of values for the x axis.
	 * @return {Object} Object containing a reference to the d3 object, the dimensions of the container and other data.
	 */
	Spline.figure = function(selector, xValues){
		var w = $(selector).width(),
			h = $(selector).height(),
			x = d3.scale.linear().domain([d3.min(xValues), d3.max(xValues)]).range([0, w]);
			
		var graph = d3.select(selector)
			.append("svg:svg")
				//.attr('preserveAspectRatio','xMinYMin')
				.attr("viewBox", "0 0 " + (w+70) + " " + (h+30) )
				//.attr("preserveAspectRatio", "xMidYMid")
				.attr("preserveAspectRatio", "none")
			.append("g")
				.attr("transform", "translate(" + 50 + "," + 10 + ")");
		
		// Create x axis
		var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true);
		// Add the x-axis.
		graph.append("svg:g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + h + ")")
		      .call(xAxis);
				      
		return {
			selector: selector,
			w: w,
			h: h,
			g: graph
		};
	};
	
	/**
	 * Plot data into a figure.
	 * 
	 * @see Spline.figure
	 * 
	 * @param {Object} An object returned by Spline.figure()
	 * @param {Array} x values
	 * @param {Array} y values
	 * @param {Int} Line thickness
	 * @param {String} Line color in HTML format
	 */
	Spline.plot = function(figure, xValues, yValues, interpolation, color, style, width){
		// y scale
		var x = d3.scale.linear().domain([d3.min(xValues), d3.max(xValues)]).range([0, figure.w]),
			y = d3.scale.linear().domain([d3.min(yValues), d3.max(yValues)]).range([figure.h, 0]);
			
		var yAxis = d3.svg.axis().scale(y).ticks(6).orient("left");
		// Add the y-axis to the left
		figure.g.append("svg:g")
		      .attr("class", "y axis")
		      .attr("transform", "translate(-25,0)")
		      .call(yAxis);
		
		var line = d3.svg.line()
		.x(function(d,i) {
			return x(i); 
		})
		.y(function(d) { 
			return y(d); 
		})
		.interpolate(interpolation); // basis, step-before/after, cardinal...
		      
		figure.g.append("svg:path")
			.attr("d", line(yValues))
			.attr("stroke", color)
			.attr("fill", 'none')
			.attr("stroke-width", width)
			.attr("stroke-dasharray", style);
	};
	
	/**
	 * Convert data to the format expected by the plotters
	 * If Y is larger than X only the corresponding part will be returned.
	 * @param {Array} X values
	 * @param {Array} Y values
	 * @return {Array} [{x:,y:,}...] 
	 */
	Spline.formatData = function(x, y){
		var ret = [];
		for(var i=0; i<y.length; i++){
			ret.push({x: x(i), y:y(i)});
		}
		return ret;
	};
	
	/**
	 * Gauss-Jordan matrix solving
	 * @author Ivan Kuckir <http://blog.ivank.net> 
	 */
	Spline.gaussJ = {
		zerosMat : function(r,c) {
			var A = [];
			for(var i=0; i<r; i++) {
				A.push([]);
				for(var j=0; j<c; j++)
					A[i].push(0);
			}
			return A;
		},
		swapRows : function(m, k, l) {
			var p = m[k];
			m[k] = m[l];
			m[l] = p;
		},
		_debug_printMat : function(A){
			for(var i=0; i<A.length; i++)
				console.log(A[i]);
		},
		solve : function(A, x){	// in Matrix, out solutions
			var m = A.length;
			for(var k=0; k<m; k++){	// column
				// pivot for column
				var i_max = 0; var vali = Number.NEGATIVE_INFINITY;
				for(var i=k; i<m; i++) if(A[i][k]>vali) { i_max = i; vali = A[i][k];}
				Spline.gaussJ.swapRows(A, k, i_max);
				
				if(A[i_max][i] == 0) console.log("matrix is singular!");
				
				// for all rows below pivot
				for(var i=k+1; i<m; i++){
					for(var j=k+1; j<m+1; j++)
						A[i][j] = A[i][j] - A[k][j] * (A[i][k] / A[k][k]);
					A[i][k] = 0;
				}
			}
			
			for(var i=m-1; i>=0; i--){	// rows = columns
				var v = A[i][m] / A[i][i];
				x[i] = v;
				for(var j=i-1; j>=0; j--){	// rows
					A[j][m] -= A[j][i] * v;
					A[j][i] = 0;
				}
			}
		}
	};
	
}).call(this);