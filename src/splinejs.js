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
	 * A set of interpolation functions 
	 */
	Spline.interpolate = {
		/**
		 * Calculate the Lagrange polynomials for a set of x values
		 * @param {Array} Points array [x1, x2,...]
		 * @return {Array} Matrix where each row i is the lagrange polynomial associated to x(i)
		 */
		lagrange_polynomials : function(x){
			var m = x.length,
				c = [];
				
			for(var i = 0; i<m; i++){
				var ll=[1];
				for(var j=0;j<m;j++){
					if(j==i) continue;
					ll = Spline.conv(ll,[1, -x[j]]).map(function(a) { return a / (x[i]-x[j]); });
				}
				c.push(ll.reverse());   
			}
			return c;
		}
	};
	
	/**
	 * Evaluate polynomial. It returns the value of the polynomial P evaluated
	 * at X. P is a vector of length N+1 whose elements are the coefficients of the polynomial
	 * in descending powers.
	 * Example:
	 * 	p(x) = 3x^2+2x+1 at x = 5,7, and 9:
	 * 	p = [3, 2, 1];
	 * 	Spline.polyval(p,[5, 7, 9]);
	 * 
	 * @param {Array} Coefficients of the polynomial in descending powers.
	 * @param {Array} Values of X to evaluate
	 * @return {Array} The corresponding Y values Y=P(X)
	 */
	Spline.polyval = function(P,x){
		var y = [];
		for(var val=0; val<x.length; val++){
			var sum = 0;
			for(var coef=0; coef<P.length; coef++){
				sum += P[coef]*Math.pow(x[val], P.length-1-coef);
			}
			y.push(sum);
		}
		return y;
	};
	
	/**
	 * Convolution and polynomial multiplication
	 * The resulting vector is length Math.max(A.length + B.length -1, Math.max(A.length, B.length))
	 * If A and B are vectors of polynomial coefficients, convolving them is equivalent to multiplying the two
	 * polynomials.
	 * 
	 * @author Alejandro U. Alvarez
	 * @param {Array} Vector A
	 * @param {Array} Vector B
	 * @return {Array} Result vector 
	 */
	Spline.conv = function(a, b){
		var m = Math.max(a.length, b.length),
			c = [];
			
		var padA = Spline.zeros(b.length-1).concat(a.concat(Spline.zeros(b.length-1)));

		for(var n=0; n<padA.length-1; n++){
			var row = [];
			for(var k=0; k<b.length; k++){
				row.push(padA[n+k]*b[k]);
			}
			c.push(Spline.arraySum(row));
		}
		return c;
	};
	
	/**
	 * Create a vector of 0's of size n
	 * @param {int} Vector size
	 * @return {Array} Zeros vector
	 */
	Spline.zeros = function(n){
		var v = [];
		for(var i=0;i<n;i++) v.push(0);
		return v;
	};
	
	/**
	 * Return the sum of the elements in the array.
	 * Requires ECMAScript 5+
	 * @param {Array} Array to sum
	 * @return {int} Sum
	 */
	Spline.arraySum = function(array){
		return array.reduce(function(a, b) { return a + b; }, 0);
	};
	
	/**
	 * Display data in tables 
	 */
	Spline.table = {
		create : function(){},
		/**
		 * Fill a table with data
		 * @param {String} DOM selector
		 * @param {Array} Data to fill the table, in a multidimensional array, one inner array per column: [[col1 data], [col2 data]]
		 * @param {int} Number of decimal positions for rounding. Don't specify or set to -1 to display the full number 
		 */
		fill : function(selector, data, round){
			var total = data[0].length,
				table = $(selector);
			if(typeof(round)=='undefined'){
				round = -1;
			}
			for(var i=0; i<total; i++){
				var row = '<tr>';
				for(var r=0; r<data.length; r++){
					if(round>1)
						row += '<td>'+d3.round(data[r][i],round)+'</td>';
					else
						row += '<td>'+data[r][i],round+'</td>';
				}
				row += '</tr>';
				table.append(row);
			}
		}
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
			for(var i=0; i<A.length; i++){
				console.log(A[i]);
			}
		},
		solve : function(A, x){	// in Matrix, out solutions
			var m = A.length;
			for(var k=0; k<m; k++){	// column
				// pivot for column
				var i_max = 0; var vali = Number.NEGATIVE_INFINITY;
				for(var i=k; i<m; i++){
					if(A[i][k]>vali) { i_max = i; vali = A[i][k]; }
				}
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