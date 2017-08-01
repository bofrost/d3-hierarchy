var d3;
(function (d3) {
    // Version 0.0.0. Copyright 2017 Mike Bostock.
    'use strict';
    // Clips the specified subject polygon to the specified clip polygon;
    // requires the clip polygon to be counterclockwise and convex.
    // https://en.wikipedia.org/wiki/Sutherland–Hodgman_algorithm
    d3.polygonClip = function (clip, subject) {
        var input = [subject, []], closed = polygonClosed(subject), i = -1, n = clip.length - polygonClosed(clip), j, m, a = clip[n - 1], b, c, d, sub = 0, inp = 0;
        while (++i < n) {
            inp = i % 2;
            sub = 1 - inp;
            while (input[sub].length > 0)
                input[sub].pop();
            b = clip[i];
            c = input[inp][(m = input[inp].length - closed) - 1];
            j = -1;
            while (++j < m) {
                d = input[inp][j];
                if (polygonInside(d, a, b)) {
                    if (!polygonInside(c, a, b)) {
                        input[sub].push(polygonIntersect(c, d, a, b));
                    }
                    input[sub].push(d);
                }
                else if (polygonInside(c, a, b)) {
                    input[sub].push(polygonIntersect(c, d, a, b));
                }
                c = d;
            }
            if (closed)
                input[sub].push(input[sub][0]);
            a = b;
        }
        return input[sub];
    };
    function polygonInside(p, a, b) {
        return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
    }
    // Intersect two infinite lines cd and ab.
    function polygonIntersect(c, d, a, b) {
        var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
        return [x1 + ua * x21, y1 + ua * y21];
    }
    // Returns true if the polygon is closed.
    function polygonClosed(coordinates) {
        var a = coordinates[0], b = coordinates[coordinates.length - 1];
        return !(a[0] - b[0] || a[1] - b[1]);
    }
})(d3 || (d3 = {}));

export default d3;