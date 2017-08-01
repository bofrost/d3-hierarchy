export class Point{
    coordinates: number[];
    public toVector(line){
        return [line.coordinates[0]-this.coordinates[0],line.coordinates[1]-this.coordinates[1]];
    }
}



export class Circle extends Point
{
    radius:number;
    weight:number;
    intersections=[];
    public clip(polygon:[number[]]):any[]
    {
        var i:number=0, wasInCircle:boolean=true, isInCircle:boolean, resultingPolygon=[], startAngle=NaN, endAngle, endAngle2, numSteps, stepAngle, len = polygon.length, intersection;
        if(!this.weight) this.weight = this.radius*this.radius;
        wasInCircle = polygon[len-1][0]*polygon[len-1][0]+polygon[len-1][1]*polygon[len-1][1]<=this.weight;
        for(;i<polygon.length;i++)
        {
            isInCircle = polygon[i][0]*polygon[i][0]+polygon[i][1]*polygon[i][1]<=this.weight;
            if(isInCircle)
            {
                if(wasInCircle)
                {
                    resultingPolygon.push(polygon[i]);
                }
                else
                {
                    intersection = this.getCircleLineIntersectionPoint(polygon[(len+i-1)%len],polygon[i],this.coordinates,this.radius);
                    this.intersections.push(intersection[0]);
                    endAngle = Math.atan2(intersection[0].coordinates[1],intersection[0].coordinates[0]);
                    if(isNaN(startAngle)) endAngle2=endAngle;
                    else{
                        this.approxCircle(resultingPolygon,startAngle,endAngle);
                    }
                    resultingPolygon.push(polygon[i]);
                    wasInCircle=true;
                }
            }
            else
            {
                if(wasInCircle)
                {
                    intersection = this.getCircleLineIntersectionPoint(polygon[(len+i-1)%len],polygon[i],this.coordinates,this.radius);

                    this.intersections.push(intersection[1]);
                    //startAngle = Math.atan2(polygon[i][1],polygon[i][0]);
                    startAngle = Math.atan2(intersection[1].coordinates[1],intersection[1].coordinates[0]);
                    wasInCircle=false;
                }
                else{
                    intersection = this.getCircleLineIntersectionPoint(polygon[(len+i-1)%len],polygon[i],this.coordinates,this.radius);
                    if(intersection.length===2)//könnten ja zwei schnittpunkte besitzen ....
                    {
                        if(intersection[0].factor<0 && intersection[0].factor > -1 && intersection[1].factor<0 && intersection[1].factor>-1)
                        {
                            endAngle = Math.atan2(intersection[0].coordinates[1],intersection[0].coordinates[0]);

                            this.intersections.push(intersection[0]);
                            if(!startAngle) endAngle2=endAngle;
                            else{
                                this.approxCircle(resultingPolygon,startAngle,endAngle);
                            }
                            //resultingPolygon.push(polygon[i]);

                            startAngle = Math.atan2(intersection[1].coordinates[1],intersection[1].coordinates[0]);

                            this.intersections.push(intersection[1]);
                        }
                    }
                }
            }

        }

        if(endAngle2)
        {
            this.approxCircle(resultingPolygon,startAngle,endAngle2);
        }

        if(resultingPolygon.length===0)
        {
            numSteps = 99;
            stepAngle = Math.PI/50;
            startAngle =0;
            for(var j=0; j<=numSteps; j++)
            {
                resultingPolygon.push([this.coordinates[0] + this.radius * Math.cos(startAngle + j * stepAngle), this.coordinates[1] + this.radius * Math.sin(startAngle + j * stepAngle)]);
            }
        }

        return resultingPolygon;
    }
    private approxCircle(poly, startAngle,endAngle)
    {
        if(startAngle>endAngle) startAngle-=2*Math.PI;  
        var diffAngle = endAngle-startAngle;
        var numSteps = Math.ceil(diffAngle/(Math.PI/50));
        var stepAngle = diffAngle/numSteps;
        numSteps = Math.abs(numSteps);
        for(var j=0; j<=numSteps; j++)
        {
            poly.push([this.coordinates[0] + this.radius * Math.cos(startAngle + j * stepAngle), this.coordinates[1] + this.radius * Math.sin(startAngle + j * stepAngle)]);
        }
    }
    private inCircle(point:number[]):boolean
    {
        var vector = this.toVector(point);
        return vector[0]*vector[0]+vector[1]*vector[1]<=this.weight;
    }
    //inspired by https://stackoverflow.com/questions/13053061/circle-line-intersection-points
    private getCircleLineIntersectionPoint(pointA,pointB, center, radius) {
        var baX = pointB[0] - pointA[0];
        var baY = pointB[1] - pointA[1];
        var caX = center[0] - pointA[0];
        var caY = center[1] - pointA[1];

        var a = baX * baX + baY * baY;
        var bBy2 = baX * caX + baY * caY;
        var c = caX * caX + caY * caY - radius * radius;

        var pBy2 = bBy2 / a;
        var q = c / a;

        var disc = pBy2 * pBy2 - q;
        if (disc < 0) {
            return [];
        }
        // if disc == 0 ... dealt with later
        var tmpSqrt = Math.sqrt(disc);
        var abScalingFactor1 = -pBy2 + tmpSqrt;
        var abScalingFactor2 = -pBy2 - tmpSqrt;

        var p1 = [pointA[0] - baX * abScalingFactor1, pointA[1]
                - baY * abScalingFactor1];
        if (disc == 0) { // abScalingFactor1 == abScalingFactor2
            return [{coordinates:p1,factor:abScalingFactor1}];
        }
        var p2 = [pointA[0] - baX * abScalingFactor2, pointA[1]
                - baY * abScalingFactor2];
        return [{coordinates:p1,factor:abScalingFactor1}, {coordinates:p2,factor:abScalingFactor2}];
    }
}