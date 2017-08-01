   
import * as MedialAxisConvex from './MedialAxisConvex';
import * as diagram from './PowerDiagram';
import {Vertex} from './ConvexHull';


var epsilon = 1E-10;
   
   function getBoundingSites(width,height) {
      var boundingSites = [],
          xExtent, yExtent,
          minX, maxX, minY, maxY,
          x0, x1, y0, y1;

        xExtent = [0,width];
        yExtent = [0,height];

      minX = xExtent[0];
      maxX = xExtent[1];
      minY = yExtent[0];
      maxY = yExtent[1];
      x0 = minX - maxX;
      x1 = 2 * maxX;
      y0 = minY - maxY;
      y1 = 2 * maxY;

      var result = [];
      result[0] = [x0, y0];
      result[1] = [x1, y0];
      result[2] = [x1, y1];
      result[3] = [x0, y1];

      for (var i = 0; i < result.length; i++){
        boundingSites.push( new Vertex(result[i][0], result[i][1], null, epsilon, new Vertex(result[i][0], result[i][1], null, epsilon, null, true), true));
      }

      return boundingSites;
    }

function make_regular_polygon(width, height, border, sides) {
	//var center = [width*0.5, height*0.5],
    var center = [0,0],
		width_radius = (width - 2*border) * 0.5,
		height_radius = (height - 2*border) * 0.5,
		radius = Math.min( width_radius, height_radius ),
		angle_radians = 2*Math.PI / sides,
		initial_angle = sides%2==0 ? -Math.PI/2 -angle_radians*0.5 : -Math.PI/2, // subtract angles
		result = [];    
	
	// special case few sides
	if (sides == 3) {
		center[1] += height_radius / 3.0; // can always do this (I think?)
	
		var radius_for_width = width_radius * 2 / Math.sqrt(3);
		var radius_for_height = height_radius * 4.0 / 3.0;
		radius = Math.min(radius_for_width, radius_for_height);
	}
	else if (sides == 4) {
		radius *= Math.sqrt(2);
	}
	
	for (var i = 0; i < sides; i++) {
		result.push([center[0] + radius * Math.cos(initial_angle - i * angle_radians), center[1] + radius * Math.sin(initial_angle - i * angle_radians)]);
	}

	return result;
}

export class VariationalDiskPackingAlgorithm{

    private epsilon = 0.000001;
    private k = 1;

    public formatedSites;
    private boundingSites;
    private clippingPolygon;
    public radius;
    public debugSvg;
    public polygons;
    public totalK=1;
    constructor(radius: number) {
        this.radius = radius;
        var diameter = radius*2;
        this.clippingPolygon = make_regular_polygon(diameter,diameter,0,100);
        this.boundingSites = getBoundingSites(diameter,diameter);
    }
    public calculate(formatedSites)
    {
        this.formatedSites=formatedSites;
        this.step();
        this.step();
        this.step();
        
        var i =0;
        while(this.epsilon<Math.abs(this.step()) && i++ < 999 );

        return this.k;
    }

    public step(){
        //Steps
        //1. Calculate the power diagram
        this.polygons = diagram.computePowerDiagramIntegrated(this.formatedSites,this.boundingSites,this.clippingPolygon,this.radius);
        
        //2. For each region compute its maximum inscribed circle
        var newSites = [],
        factors = [],i;

        for(i=0; i< this.formatedSites.length; i++)
        {
            var mac = new MedialAxisConvex.MedialAxisConvex();
            var site = mac.calculate(this.formatedSites[i].polygon);
            newSites.push(site);
            factors.push(site.time/Math.sqrt(this.formatedSites[i].weight));
        }

        //3. Search smallest scale factor and scale circles
        
        var k = Math.min(...factors);
        //4. return epsilon

        for(i = 0; i< newSites.length; i++)
        {
            this.formatedSites[i] = new  Vertex(newSites[i].coordinates[0], newSites[i].coordinates[1], null, this.formatedSites[i].weight*k*k, newSites, false);
        }

        var result = (this.k-k)/this.k;
        this.k = k;
        this.totalK *= k;
        return result;
    }

}
