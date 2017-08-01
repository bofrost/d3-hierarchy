import {packEnclose} from "./siblings";
import {optional} from "../accessors";
import constant, {constantZero} from "../constant";
import {VariationalDiskPackingAlgorithm} from "./build/VariationalDiskPackingAlgorithm"
import {Vertex} from "./ConvexHull"

function defaultRadius(d) {
  return Math.sqrt(d.value);
}

export default function() {
  var radius = null,
      dx = 1,
      dy = 1,
      padding = constantZero;

  function pack(root) {
    root.x = dx / 2, root.y = dy / 2;
    if (radius) {
      root.eachBefore(radiusLeaf(radius))
          .eachAfter(packChildren(padding, 0.5))
          .eachBefore(translateChild(1));
    } else {
      root.eachBefore(radiusLeaf(defaultRadius))
          .eachAfter(packChildren(constantZero, 1))
          .eachAfter(packChildren(padding, root.r / Math.min(dx, dy)))
          .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    }
    return root;
  }
  pack.packVCT = function(root) {
    root.x = dx / 2, root.y = dy / 2;
    root.eachBefore(radiusLeaf(defaultRadius))
      .eachAfter(optimizePacking);

    root.eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    return root;
  }

  pack.radius = function(x) {
    return arguments.length ? (radius = optional(x), pack) : radius;
  };

  pack.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
  };

  pack.padding = function(x) {
    return arguments.length ? (padding = typeof x === "function" ? x : constant(+x), pack) : padding;
  };

  return pack;
}

function radiusLeaf(radius) {
  return function(node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0);
    }
  };
}

function packChildren(padding, k) {
  return function(node) {
    if (children = node.children) {
      var children,
          i,
          n = children.length,
          r = padding(node) * k || 0,
          e;

      if (r) for (i = 0; i < n; ++i) children[i].r += r;
      e = packEnclose(children);
      if (r) for (i = 0; i < n; ++i) children[i].r -= r;
      node.r = e + r;
    }
  };
}

function translateChild(k) {
  return function(node) {
    var parent = node.parent;
    node.r *= k;
    if (parent) {
      node.x = parent.x + k * node.x;
      node.y = parent.y + k * node.y;
    }
  };
}
function randomPacking(node) {
  if (!node.children) return;
  var sites = node.children,i;
  node.r = 0;
  for (i = 0; i < sites.length; i++) {
    node.r += sites[i].r;
  }
  node.r *= 3;
  for (i = 0; i < sites.length; i++) {
    var isOverlaping, radiusOffset = node.r - sites[i].r;
    do {
      isOverlaping = false;
      var t = 2 * Math.PI * Math.random()
      var u = Math.random() + Math.random()
      var r = u > 1 ? 2 - u : u;
      sites[i].x = radiusOffset * r * Math.cos(t);
      sites[i].y = radiusOffset * r * Math.sin(t);

      for (var j = 0; j < i && !isOverlaping; j++) {
        var x = sites[i].x - sites[j].x;
        var y = sites[i].y - sites[j].y;
        var rges = sites[i].r + sites[j].r;
        isOverlaping = x * x + y * y < rges * rges;
      }
    } while (isOverlaping);

  }
}

function optimizePacking(node) {
  if (!node.children) return;
  randomPacking(node);

  var sites = node.children;

  var formatedSites = sites.map(function (s) {
    return new Vertex(s.x, s.y, null, s.r * s.r, s, false);
  })


  var vdpa = new VariationalDiskPackingAlgorithm(node.r);
  vdpa.calculate(formatedSites);

  var maxDist = 0;
  for (var i = 0; i < formatedSites.length; i++) {
    node.children[i].x = vdpa.formatedSites[i].x / vdpa.totalK;
    node.children[i].y = vdpa.formatedSites[i].y / vdpa.totalK;
    node.children[i].r = Math.sqrt(vdpa.formatedSites[i].weight) / vdpa.totalK;
    maxDist = Math.max(maxDist, Math.sqrt(node.children[i].x * node.children[i].x + node.children[i].y * node.children[i].y) + node.children[i].r);
  }
  node.r /= vdpa.totalK;

}
