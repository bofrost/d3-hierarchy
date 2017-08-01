import * as utils from './Utils'
import BinaryHeap from './BinaryHeap'
 
let Point = utils.Point;

function getDistance(pointin:number[], linePoint:number[], vector:number[])
    {
        // point[0],point[1] becomes relative vector from linePoint[0],linePoint[1] to test linePoint
        var point =[pointin[0] - linePoint[0], pointin[1] - linePoint[1]];
        var dotprod = point[0] * vector[0] + point[1] * vector[1];
        // dotprod is the length of the point[0],point[1] vector
        // projected on the linePoint[0],linePoint[1]=>vector[0],vector[1] vector times the
        // length of the linePoint[0],linePoint[1]=>vector[0],vector[1] vector
        var projlenSq = dotprod * dotprod / (vector[0] * vector[0] + vector[1] * vector[1]);
        // Distance to line is now the length of the relative point
        // vector minus the length of its projection onto the line
        var lenSq = point[0] * point[0] + point[1] * point[1] - projlenSq;
        if (lenSq < 0) {
            lenSq = 0;
        }
        return Math.sqrt(lenSq);
    }


 function crossProduct(A,B): number {
        return A[0]*B[1]-B[0]*A[1];
    }

class Line extends Point{
    time:number;
    leftWavefrontVector: number[];
    leftWavefrontPoint: number[];
    rightWavefrontVector: number[];
    rightWavefrontPoint: number[];
    vector: number[];
    leftIntersection: IntersectionPoint;// = new Intersection();
    rightIntersection: IntersectionPoint = new IntersectionPoint();
    public intersect(line:Line):IntersectionPoint
    {
        var ac=this.toVector(line),
        //TODO Ist das richtig so?
        //ca=line.toVector(this),
        rs=crossProduct(this.vector,line.vector), t, u, coordinates, time;
        
        t=crossProduct(ac,line.vector)/rs;
        u=crossProduct(ac,this.vector)/rs;

        coordinates = [line.coordinates[0]+u*line.vector[0],line.coordinates[1]+u*line.vector[1]];

        time = getDistance(coordinates,this.leftWavefrontPoint,this.leftWavefrontVector);



        
        this.rightIntersection.coordinates=coordinates;
        this.rightIntersection.time=time;
        this.rightIntersection.leftLine=this;
        this.rightIntersection.leftBezierFactor = t;
        this.rightIntersection.rightLine=line;
        this.rightIntersection.rightBezierFactor = u;

        
        return line.leftIntersection = this.rightIntersection;
    }
    splice(newNode: Line, anzahl:number) {
        var prev = this.leftIntersection.leftLine, next:Line = this;
        for(var i = 0 ; i<anzahl; i++) {
            next=next.next();
        }

        prev.intersect(newNode);
        newNode.intersect(next);
    }
    next() {
        return this.rightIntersection.rightLine;
    }
}
class IntersectionPoint extends Point{
    time:number;
    leftLine: Line;
    leftBezierFactor: number;
    rightLine: Line;
    rightBezierFactor: number;
    public calculateNextLine():Line
    {
        var newLine = new Line();
        newLine.vector = [(this.rightLine.vector[0]+this.leftLine.vector[0]),(this.rightLine.vector[1]+this.leftLine.vector[1])];

        newLine.time = this.time;
        newLine.coordinates = this.coordinates;
         
        newLine.leftWavefrontVector = this.leftLine.leftWavefrontVector;
        newLine.leftWavefrontPoint = this.leftLine.leftWavefrontPoint;
        newLine.rightWavefrontVector = this.rightLine.rightWavefrontVector
        newLine.rightWavefrontPoint = this.rightLine.rightWavefrontPoint;

        return newLine;
    }
}

export class MedialAxisConvex{
    private points = new BinaryHeap(this.compairPoints);
    private oldLines = [];
    private resultingPoints;
    private headNode: Line;
    private numNodes: number = 0;
    compairPoints(point)
    {
        return point.time;
    }
    calculate(polygon) {
        this.bisectingLinesFromPolygon(polygon);
        
        this.numNodes = polygon.length;


        var node = this.headNode;

        do{
            if(node.rightIntersection.time<node.leftIntersection.time)
                this.points.push(node.rightIntersection);
            node = node.next();
        }while(node != this.headNode);


        var point;
        var i=0;
        while((point = this.points.pop()) && this.numNodes>4 )
        {
            var newLine = point.calculateNextLine();
   
            this.oldLines.push(point.leftLine);
            this.oldLines.push(point.rightLine); 
            
            this.points.remove(point.leftLine.leftIntersection);
            this.points.remove(point.rightLine.rightIntersection);
            point.leftLine.splice(newLine,2);
            this.headNode=newLine;
            this.numNodes = this.numNodes - 1;

            if(newLine.leftIntersection.time<newLine.rightIntersection.time)
                this.points.push(newLine.leftIntersection);
            else this.points.push(newLine.rightIntersection);
            i++;
        }
        
        var resultingLines = this.LinesToArray();
        this.resultingPoints=[];
        
        for(i =0; i< resultingLines.length;i++)
            this.resultingPoints.push(resultingLines[i].rightIntersection);
        
        return this.points.content[0] || resultingLines[0].rightIntersection;
    }
    private LinesToArray(): Line[] {
        const array: Line[] = [];
        let currentNode: Line = this.headNode;
        do{
            array.push(currentNode);
            currentNode = currentNode.next();
        }while(currentNode !== this.headNode)
        return array;
    }
    private bisectingLinesFromPolygon(polygon)
    {
        var numberOfVertices = polygon.length;
        var oldLine = this.bisectingLinesFromThreePoints(polygon[numberOfVertices-1],polygon[0],polygon[1]);
        this.headNode=oldLine;
        for(var i=1; i < numberOfVertices; i++)
        {
            var line =this.bisectingLinesFromThreePoints(polygon[i-1],polygon[i],polygon[(i+1)%numberOfVertices]);
            oldLine.intersect(line);

            oldLine=line;
        }
        oldLine.intersect(this.headNode);
    }
    private pointsToVector(pointA,pointB){
        return [pointB[0]-pointA[0],pointB[1]-pointA[1]];
    }
    private lengthOfVector(vector){
        return Math.sqrt(Math.pow(vector[0],2)+Math.pow(vector[1],2));
    }
    private crossProduct(A,B): number {
        return A[0]*B[1]-B[0]*A[1];
    }
    private bisectingLinesFromThreePoints(pointA,pointM,pointB):Line
    {
        var MA = this.pointsToVector(pointM,pointA),
        MB = this.pointsToVector(pointM,pointB) ,lengthMA,lengthMB, line = new Line();
        
        lengthMA=this.lengthOfVector(MA);
        lengthMB=this.lengthOfVector(MB);
        
        MA=[MA[0]/lengthMA,MA[1]/lengthMA];
        MB=[MB[0]/lengthMB,MB[1]/lengthMB];
        
        
        line.coordinates=pointM;
        line.leftWavefrontVector=MA;
        line.leftWavefrontPoint=pointM;
        line.rightWavefrontVector=MB;
        line.rightWavefrontPoint=pointM;
        line.time=0;
        line.vector=[MA[0]+MB[0],MA[1]+MB[1]];


        return  line;
    
    }
    
    private calculateNextLine(pointM,lineMA,lineMB)
    {   
        var lineVector = [(lineMB[0]+lineMA[0]),(lineMB[1]+lineMA[1])];
        return  {point:pointM, time:pointM.time, vector: lineVector, intersections:[]};
    
    }
}
