import {Triangle, Vector3} from "../../../../../libs/three/Three.Core.js";


let  p1  = new Vector3();
let  p2  = new Vector3();
let  p3  = new Vector3();

let  p0  = {x:0, y:0, z:0};
let  triangle = new Triangle();

let points = [];

let calcVec1 = new Vector3();
let calcVec2 = new Vector3();
let scaleVec = new Vector3();
let physicsApi;
let iWeightCurve;
let jWeightCurve;

let  defaultoptions = {
    "type":"array",
    "state":true,
    "three_terrain":"plain_ground",
    "vegetation_system":"basic_grassland",
    "terrain_size":400,
    "terrain_segments":255,
    "invert_hill":false,
    "terrain_edge_size":100,
    "edge_easing":"clampSin",
    "max_height":15,
    "min_height":-4,
    "frequency":3,
    "steps":6
};




let getPieceTerrainModule = function(piece) {
    return piece.getModuleByIndex(0);
};

let getTerrainSegmentse = function(module) {
    return module.data.applies.terrain_segments;
};

let getTerrainModuleSize = function(module) {
    return module.data.applies.terrain_size;
};

let clampSin = function() {
    return function(value) {
        return Math.sin(value*Math.PI*0.5)
    }
};


let setTri = function(tri, x, y, z) {
    tri.x = x;
    tri.y = y;
    tri.z = z;
}

let getEdgeEasing = function(applies) {
    let  easing = THREE.Terrain.EaseInOut;

    if (applies.edge_easing) {
        if (this[applies.edge_easing]) {
            easing = this[applies.edge_easing]()
        } else {
            easing = THREE.Terrain[applies.edge_easing];
        }
    };
    return easing;
};

let getTerrainModuleEdges = function(applies) {
    let  easing = getEdgeEasing(applies);

    return {
        invert: applies.invert_hill,
        edgeSize: applies.terrain_edge_size,
        easingFunc:easing
    }
};

let getTerrainModuleOpts = function(applies) {

    let  easing = getEdgeEasing(applies);

    return {
        after: null,
        easing: easing,
        heightmap: THREE.Terrain.DiamondSquare,
        material: null,
        maxHeight: applies.max_height,
        minHeight: applies.min_height,
        optimization: THREE.Terrain.NONE,
        frequency: applies.frequency,
        steps: applies.steps,
        stretch: true,
        turbulent: false,
        //    useBufferGeometry: true,
        xSegments: applies.terrain_segments,
        xSize: applies.terrain_size,
        ySegments: applies.terrain_segments,
        ySize: applies.terrain_size
    }
};

let setEdgeVerticeHeight = function(array1d, height) {

    let  sideVerts = Math.sqrt(array1d.length);
    let  totalVerts = array1d.length;

    let  bottomVert = 0;
    let  topVert = 0;
    let  leftVert = 0;
    let  rightVert = 0;

    for (let  i = 0; i < sideVerts; i++) {

        bottomVert = i;
        topVert = totalVerts - sideVerts + i;

        leftVert = sideVerts * i;
        rightVert = sideVerts * i + sideVerts - 1;

        array1d[bottomVert].z = height;
        array1d[topVert].z = height;
        array1d[leftVert].z = height;
        array1d[rightVert].z = height;
    }

};

let  makeMatrix2D = function(array1d) {

    let  tgt = new Array(Math.sqrt(array1d.length)),
        xl = Math.sqrt(array1d.length),
        yl = Math.sqrt(array1d.length),
        i, j;
    for (i = 0; i < xl; i++) {
        tgt[i] = new Float64Array(xl);
        for (j = 0; j < yl; j++) {
            tgt[i][j] = array1d[j * xl + i];
        }
    }

    return tgt;

};

let  elevateTerrain = function(array1d, elevation) {

    for (let  i = 0; i < array1d.length; i++) {
        array1d[i] += elevation;
    }

};

let  elevateTerrainVerts = function(vertices, elevation) {

    for (let  i = 0; i < vertices.length; i++) {
        vertices[i].z += elevation;

    }

};

let  sliceGeometryAtSeaLevel = function(vertices, maxDepth) {

    let  depth;

    for (let  i = 0; i < vertices.length; i++) {
        depth = vertices[i].z  // - maxDepth;
        if (depth < -3) {
            vertices[i].z = maxDepth;
        } else if (depth < 0.5) {
            vertices[i].z -= 5;
        } else if (depth <   5) {
            vertices[i].z += 14;
        }
    }
};




let getTriangleAt = function(array1d, segments, x, y, terrainScale, terrainOrigin, groundData, unitScale) {

    let zScale = terrainScale.y;
    let zOffset = terrainOrigin.y;

    let  xc = Math.ceil(x);
    let  xf = Math.floor(x);
    let  yc = Math.ceil(y);
    let  yf = Math.floor(y);

    let  fracX = x - xf;
    let  fracY = y - yf;

    p1.x = xf;
    p1.y = yc;

    p1.z = getAt(array1d, segments, xf, yc, groundData)*zScale +zOffset;


    setTri(p1, xf, yc, getAt(array1d, segments,xf, yc, groundData)*zScale +zOffset);
    setTri(p2, xc, yf, getAt(array1d, segments,xc, yf, groundData)*zScale +zOffset);


    if (fracX < 1-fracY) {
        setTri(p3,xf,yf,getAt(array1d, segments,xf, yf, groundData)*zScale +zOffset);
    } else {
        setTri(p3, xc, yc, getAt(array1d, segments,xc, yc, groundData)*zScale +zOffset);
    }


    points[0] = p1;
    points[1] = p2;
    points[2] = p3;
    return points;
};

let getDisplacedHeight = function(array1d, segments, unitScale, x, z, htP, htN, normalStore, terrainScale, terrainOrigin, groundData) {
 //   console.log(groundData)
 //   let unitScale = groundData.unitScale;
    let  tx = displaceAxisDimensions(x, htN, htP, segments);
    let  tz = displaceAxisDimensions(z, htN, htP, segments);

    return getPreciseHeight(array1d, segments, unitScale, tx, tz, normalStore, htN, htP, terrainScale, terrainOrigin, groundData);

};

let getHeightAt = function(pos, array1d, unitScale, terrainSize, segments, normalStore, terrainScale, terrainOrigin, groundData) {

    let x = pos.x;
    let z = pos.z;

    let htP = segments * unitScale;
    let htN = 0;

    if (x < htN || z < htN || x > htP  || z > htP) {
    //    console.log("Terrain HEIGHT", pos.x, pos.z, htP, htN ,"Is Outside");
        if (normalStore) {
            normalStore.set(0, 1, 0)
        }
        return -3;
    }

    return getDisplacedHeight(array1d, segments, unitScale, x, z, htP, htN, normalStore, terrainScale, terrainOrigin, groundData);
};


let getRGBAAt = function(array1d, segments, x, y, dataStore) {

    let  yFactor = (y) * (segments+1);
    let  xFactor = x;

    let  idx = (yFactor + xFactor);

    ThreeAPI.tempVec3.x = x -segments*0.5;
    ThreeAPI.tempVec3.z = y -segments*0.5;

    ThreeAPI.tempVec3.y = array1d[idx * 4]/255 +0.02;

    dataStore.x = array1d[idx * 4] / 255;
    dataStore.y = array1d[idx * 4 + 1] / 255;
    dataStore.z = array1d[idx * 4 + 2] / 255;
    dataStore.w = array1d[idx * 4 + 3] / 255;
};

let getGroundTexel = function(array1d, segments, x, y, dataStore) {

   // let  xc = Math.ceil(x);
    let  xf = Math.floor(x);
    //let  yc = Math.ceil(y);
    let  yf = Math.floor(y);

    getRGBAAt(array1d, segments, xf, yf, dataStore);
    return dataStore;
};

let getDisplacedGround = function(array1d, segments, x, z, htP, htN, dataStore) {
    // NOTE: the x2 for x and z comes from texture resolution difference between height and ground texture size (2048 and 4096)
    let  tx = displaceAxisDimensions(x*2, htN, htP, segments);
    let  tz = displaceAxisDimensions(z*2, htN, htP, segments);
    return getGroundTexel(array1d, segments, tx, tz, dataStore);
};

let getGroundDataAt = function(pos, array1d, unitScale, terrainSize, segments, dataStore) {
    let htP = segments * unitScale;
    let htN = 0;

    if (pos.x < htN || pos.z < htN || pos.x > htP  || pos.z > htP) {
        console.log("Terrain!", pos.x, pos.z, htP, htN ,"Is Outside WORKER");
        GuiAPI.printDebugText("Is Outside Terrain at "+pos.x < htN+" "+pos.z < htN)
        return false;
    }

    return getDisplacedGround(array1d, segments, pos.x, pos.z, htP, htN, dataStore);
}

let centerRGBA = "rgba(0, 0, 215, 1)";
let edgeRGA = "rgba(0, 0, 0, 1)";
let createGradient = function(ctx, size, tx, tz) {


// Create a radial gradient
// The inner circle is at x=110, y=90, with radius=30
// The outer circle is at x=100, y=100, with radius=70
 const gradient = ctx.createRadialGradient(tz, tz, 1, tx, tz, size/1);
    //      const gradient = ctx.createRadialGradient(size, size, size*0.5, size, size, size);
    gradient.addColorStop(1, centerRGBA);
    gradient.addColorStop(0, edgeRGA);
    return gradient;
}

let fillShade = function(ctx, x, y, w, h, cornerRadii) {
    ctx.beginPath();

    ctx.roundRect(x, y, w, h, cornerRadii);
  //  ctx.stroke();

   // ctx.arc(x-w*0.5, y-h*0.5, w, h, MATH.TWO_PI);
    ctx.fill();

}
let fillRgba = [0, 0, 0, 0];
function fitHeightToAABB(aabb, canvasContext, terrainSize, segments, minHeight, maxHeight) {
    let heightFraction = MATH.calcFraction( minHeight, maxHeight, aabb.min.y+0.25);
    fillRgba[0] = Math.round(heightFraction*255);
    fillRgba[1] = 0;
    fillRgba[2] = 0;
    fillRgba[3] = 1;
    let htP = terrainSize*1;
    let htN = - htP;
    let txMin = displaceAxisDimensions(Math.floor(aabb.min.x)*2 -2, htN, htP, segments);
    let tzMin = displaceAxisDimensions(Math.floor(aabb.min.z)*2 -2, htN, htP, segments);
    let txMax = displaceAxisDimensions(Math.ceil(aabb.max.x+3)*2 +2, htN, htP, segments);
    let tzMax = displaceAxisDimensions(Math.ceil(aabb.max.z+3)*2 +2, htN, htP, segments);

    canvasContext.globalCompositeOperation = 'source-over';
    canvasContext.strokeStyle = "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")";
    canvasContext.fillStyle = "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")";


  //  for (let i = 0; i < blobs; i++) {
  //      size = size * MATH.curveQuad((blobs-i) / blobs)
        fillShade(canvasContext, txMin, tzMin, txMax-txMin, tzMax-tzMin, 1);
    canvasContext.fillStyle = "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]*0.25+")";
    fillShade(canvasContext, txMin-2, tzMin-2, 4+txMax-txMin, 4+tzMax-tzMin, 4);
  //  }

    updateRect.minX = txMin;
    updateRect.minY = tzMin;
    updateRect.maxX = txMax;
    updateRect.maxY = tzMax;
    return updateRect;

}

let updateRect = {
    minX:0,
    minY:0,
    maxX:0,
    maxY:0
}
let tempCanvas = document.createElement('canvas');
let tempCtx = tempCanvas.getContext('2d', { willReadFrequently:true})
function applyGroundCanvasEdit(edit, canvasContext, terrainSize, segments) {
    let pos = edit.pos;
    let radius = edit.radius *2;
    let sharpness = edit.sharpness;
    let minAlpha = (edit.strength/100);
    let biomeTable = edit.biome;
    let noise = edit.noise;

    fillRgba[0] = Math.floor(biomeTable[0]*255);
    fillRgba[1] = Math.floor(biomeTable[1]*255);
    fillRgba[2] = Math.floor(biomeTable[2]*255);
    fillRgba[3] = minAlpha;

    let htP = terrainSize*1;
    let htN = - htP;
    let tx = Math.floor(displaceAxisDimensions(pos.x*4, htN, htP, segments));
    let tz = Math.floor(displaceAxisDimensions(pos.z*4, htN, htP, segments));
    canvasContext.globalCompositeOperation = 'source-over';

    canvasContext.strokeStyle = "rgba(0, 0, 0, 0)";
    let ctx = canvasContext

    if (noise > 0) {

        tempCanvas.width = radius*2;
        tempCanvas.height = radius*2;

        const grd = tempCtx.createRadialGradient(radius, radius,  (sharpness*radius*0.8), radius, radius, radius);
        grd.addColorStop(1, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", 0)");
        grd.addColorStop(0.2+sharpness*0.6, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]*(0.5+sharpness*0.4)+")");
        grd.addColorStop(0, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")");
        tempCanvas.globalCompositeOperation = "source-over";
        tempCtx.fillStyle = grd;
        tempCtx.fillRect(0, 0, radius*2, radius*2);
        let gradImg = tempCtx.getImageData(0, 0, radius*2, radius*2);
        let buffer = gradImg.data;
        let len = buffer.length;

        for (let i = 0; i < len;i++) {
            i += 3
            buffer[i] = Math.round(buffer[i] * (1-Math.random()*noise));
        }

        tempCtx.putImageData(new ImageData(buffer, radius*2, radius*2), 0, 0)
        ctx.drawImage(tempCanvas, Math.floor(tx-radius), Math.floor(tz-radius), Math.floor(radius*2), Math.floor(radius*2));
    } else {
        const grd = ctx.createRadialGradient(tx, tz, 1 + (sharpness*radius*0.8), tx, tz, radius);
        grd.addColorStop(1, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", 0)");
        grd.addColorStop(0.2+sharpness*0.6, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]*(0.5+sharpness*0.4)+")");
        grd.addColorStop(0, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")");
        ctx.fillStyle = grd;
        ctx.fillRect(Math.floor(tx-radius), Math.floor(tz-radius), Math.floor(radius*2), Math.floor(radius*2));
    }

    updateRect.minX = Math.floor(tx-radius);
    updateRect.minY = Math.floor(tz-radius);
    updateRect.maxX = Math.floor(tx+radius);
    updateRect.maxY = Math.floor(tz+radius);

    return updateRect;
}


function applyTerrainCanvasEdit(edit, canvasContext, terrainSize, segments, minHeight, maxHeight) {
    console.log("applyTerrainEdit", edit);
    let pos = edit.pos;
    let radius = edit.radius;

    let targetY = pos.y;
    let operation = edit.operation;
    let sharpness = edit.sharpness;
    let noise = edit.noise;
    let gco = 'source-over';
    let minAlpha = (edit.strength/100);

    if (operation === "SUBTRACT") {
        minAlpha = MATH.clamp(minAlpha*0.5, 0.01,1);
        fillRgba[0] = 0;
        fillRgba[1] = 255;
        fillRgba[2] = 255;
        gco = 'darken'
    } else if (operation === "ADD") {
        minAlpha = MATH.clamp(minAlpha*0.1, 0.01,1);
        fillRgba[0] = 255;
        fillRgba[1] = 0;
        fillRgba[2] = 0;
        gco = 'lighten'
    } else {
        let heightFraction = MATH.calcFraction( minHeight, maxHeight, targetY);
        fillRgba[0] = Math.floor(heightFraction*255);
        fillRgba[1] = 0;
        fillRgba[2] = 0;
    }

    fillRgba[3] = minAlpha;

    let htP = terrainSize*1;
    let htN = - htP;
    let tx = Math.floor(displaceAxisDimensions(pos.x*2, htN, htP, segments));
    let tz = Math.floor(displaceAxisDimensions(pos.z*2, htN, htP, segments));
    canvasContext.globalCompositeOperation = gco;

    canvasContext.strokeStyle = "rgba(0, 0, 0, 0)";
    let ctx = canvasContext;

    if (noise > 0) {


    //    let noiseCtx = generateNoiseImg(noise, radius*2);
        tempCanvas.width = radius*2;
        tempCanvas.height = radius*2;

        const grd = tempCtx.createRadialGradient(radius, radius,  (sharpness*radius*0.8), radius, radius, radius);
        grd.addColorStop(0, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")");
        grd.addColorStop(0.2+sharpness*0.6, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]*(0.5+sharpness*0.4)+")");
        grd.addColorStop(0.9, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", 0)");
        grd.addColorStop(1, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", 0)");
        tempCanvas.globalCompositeOperation = "source-over";
        tempCtx.fillStyle = grd;
        tempCtx.fillRect(0, 0, radius*2, radius*2);
        let gradImg = tempCtx.getImageData(0, 0, radius*2, radius*2);
        let buffer = gradImg.data;
        let len = buffer.length;

        for (let i = 0; i < len;i++) {
            i += 3
            buffer[i] = Math.round(buffer[i] * (1-Math.random()*noise));
        }

        tempCtx.putImageData(new ImageData(buffer, radius*2, radius*2), 0, 0)
        ctx.drawImage(tempCanvas, Math.floor(tx-radius), Math.floor(tz-radius), Math.floor(radius*2), Math.floor(radius*2));
    } else {
        const grd = ctx.createRadialGradient(tx, tz, 1 + (sharpness*radius*0.8), tx, tz, radius);
        grd.addColorStop(0, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")");
        grd.addColorStop(0.2+sharpness*0.6, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]*(0.5+sharpness*0.4)+")");
        grd.addColorStop(0.9, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", 0)");
        grd.addColorStop(1, "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", 0)");
        ctx.fillStyle = grd;
        ctx.fillRect(Math.floor(tx-radius), Math.floor(tz-radius), Math.floor(radius*2), Math.floor(radius*2));
    }

// Draw a filled Rectangle

    updateRect.minX =  Math.floor(tx-radius);
    updateRect.minY =  Math.floor(tz-radius);
    updateRect.maxX =  Math.floor(tx+radius);
    updateRect.maxY =  Math.floor(tz+radius);



    return updateRect;
}

let shadeGroundCanvasAt = function(pos, canvasContext, terrainSize, segments, size, channelIndex, operation, intensity) {

    let blobs = 12;
    let blobShade = 255 / blobs

    fillRgba[0] = 0;
    fillRgba[1] = 0;
    fillRgba[2] = 0;
    if (operation === "lighter") {
        fillRgba[3] = 1;

    } else {
        fillRgba[3] = 1 / blobs;
        blobShade = 255
    }

    let htP = terrainSize*1;
    let htN = - htP;
    let tx = displaceAxisDimensions(pos.x*2, htN, htP, segments);
    let tz = displaceAxisDimensions(pos.z*2, htN, htP, segments);
    //   canvasContext.fillStyle = createGradient(canvasContext, size, tx+0, tz+0);
//    canvasContext.strokeStyle = "rgba(0, 0, 182, 1)";

    fillRgba[channelIndex] = (blobShade * intensity) ;


    canvasContext.fillStyle = "rgba("+fillRgba[0]+", "+fillRgba[1]+", "+fillRgba[2]+", "+fillRgba[3]+")";
    canvasContext.globalCompositeOperation = operation;

    for (let i = 0; i < blobs; i++) {
        size = size * MATH.curveQuad((blobs-i) / blobs)
        fillShade(canvasContext, tx-size -0.5, tz-size, size*2+1, size*2+1, size);
    }
}



// get a height at point from matrix
let getPointInMatrix = function(matrixData, y, x) {
    return matrixData[x][y];
};

let displaceAxisDimensions = function(axPos, axMin, axMax, quadCount) {
    let  matrixPos = axPos-axMin;
    return quadCount*matrixPos/(axMax - axMin);
};


let returnToWorldDimensions = function(axPos, axMin, axMax, quadCount) {
    let  quadSize = (axMax-axMin) / quadCount;
    let  insidePos = axPos * quadSize;
    return axMin+insidePos;
};



// get the value at the precise integer (x, y) coordinates
let getAt = function(array1d, segments, x, y, groundData) {

    let  yFactor = (y) * (segments+1);
    let  xFactor = x;
    let  idx = (yFactor + xFactor);

    if (groundData) {
        groundData[0] += (array1d[idx * 4] +1) / 1015;
        groundData[1] += (array1d[idx * 4 + 1] +1) / 1015;
        groundData[2] += (array1d[idx * 4 + 2] +1) / 1015;
        groundData[3] += (array1d[idx * 4 + 3]) / 4;
    }

    return array1d[idx * 4] / 255;
};

// get the value at the precise integer (x, y) coordinates
let setAt = function(height, array1d, segments, x, y, weight) {

    let  factor = weight || 1;

    if (x <= 2 || x >= segments-2 || y <= 2 || y >= segments-2) {
        console.log("FLATTEN OUTSIDE TERRING WONT WORK!");
        return;
    }

    let  yFactor = (y) * (segments+1);
    let  xFactor = x;

    let  idx = (yFactor + xFactor);
//    console.log(y, yFactor, xFactor, idx);
    array1d[idx] = height * factor + array1d[idx]* (1 - factor);
};

let getTerrainArray1d = function(terrain) {
    let  array1d = THREE.Terrain.toArray1D(terrain.children[0].geometry.vertices, terrain.edges.invert);
    return array1d;
};

let applyEdgeElevation = function(piece, isMinX, isMaxX, isMinY, isMaxY, elevation) {

    let  module = this.getPieceTerrainModule(piece);
    let  array1d = module.state.value;

    let  sideVerts = Math.sqrt(array1d.length);
    let  totalVerts = array1d.length;

    let  bottomVert = 0;
    let  topVert = 0;
    let  leftVert = 0;
    let  rightVert = 0;

    let  shoreBumb = 1;

    let  half = Math.ceil(sideVerts/2);

    let  idx = Math.floor(array1d.length / 2);

    let  setHeight = MATH.expand(array1d[idx]+4, -2, 2);


    for (let  i = 0; i < sideVerts; i++) {

        bottomVert = i;
        topVert = totalVerts - sideVerts + i;

        leftVert = sideVerts * i;
        rightVert = sideVerts * i + sideVerts - 1;


        if (isMinX) {

            for (let  j = 0; j < half; j++) {
                array1d[bottomVert + j*sideVerts] = MATH.expand(array1d[bottomVert + j*sideVerts]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }

        if (isMaxX) {

            for (let  j = 0; j < half; j++) {
                array1d[topVert - j*sideVerts] = MATH.expand(array1d[topVert - j*sideVerts]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }

        if (isMinY) {

            for (let  j = 0; j < half; j++) {
                array1d[leftVert + j] = MATH.expand(array1d[leftVert + j]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }

        if (isMaxY) {

            for (let  j = 0; j < half; j++) {
                array1d[rightVert - j] =  MATH.expand(array1d[rightVert - j]*(j/half) + elevation*(1-(j/half)),-0.5, 0.2);
            }
        }
    }

    if (isMinX || isMaxX || isMinY || isMaxY) {

        this.setHeightByIndexAndReach(array1d, idx, idx, Math.round(i*shoreBumb), setHeight)
        return true;
    }
    return false;

};

let getTerrainBuffers = function(terrain) {

    terrain.children[0].geometry.computeFaceNormals();
    terrain.children[0].geometry.computeVertexNormals();

    let  bufferGeo = new THREE.BufferGeometry().fromGeometry( terrain.children[0].geometry );
    let  position = bufferGeo.attributes.position.array;
    let  normal = bufferGeo.attributes.normal.array;
    let  color = bufferGeo.attributes.color.array;
    let  uv = bufferGeo.attributes.uv.array;
    return [position, normal, color, uv, getTerrainArray1d(terrain)];

};


let getPreciseHeight = function(array1d, segments, unitScale, x, z, normalStore, htN, htP, terrainScale, terrainOrigin, groundData) {

    let  tri = getTriangleAt(array1d, segments, x, z, terrainScale, terrainOrigin, groundData, unitScale);

    setTri(p0, x, z, 0);

    let  find = MATH.barycentricInterpolation(tri[0], tri[1], tri[2], p0);


    if (normalStore) {

        triangle.a.x =  returnToWorldDimensions(tri[0].x, htN, htP, segments);
        triangle.a.z =  returnToWorldDimensions(tri[0].y, htN, htP, segments);
        triangle.a.y =  tri[0].z;

        triangle.b.x =  returnToWorldDimensions(tri[1].x, htN, htP, segments);
        triangle.b.z =  returnToWorldDimensions(tri[1].y, htN, htP, segments);
        triangle.b.y =  tri[1].z;

        triangle.c.x =  returnToWorldDimensions(tri[2].x, htN, htP, segments);
        triangle.c.z =  returnToWorldDimensions(tri[2].y, htN, htP, segments);
        triangle.c.y =  tri[2].z;
/*
        if (triangle.a.equals(triangle.b)) {
            //    console.log("TrianglePoint is the same..., A & B");
            if (triangle.b.equals(triangle.c)) {
                //     console.log("TrianglePoint is the same..., B & C");

                //    if (triangle.a.equals(triangle.c)) {
                console.log("TrianglePoint is the same..., A, B & C", x, z);
                //    }
            }

        }
*/
        triangle.getNormal(normalStore);

        if (normalStore.y < 0) {
            normalStore.negate();
        }
/*
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:triangle.a, color:'GREEN', size:0.2});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:triangle.b, color:'GREEN', size:0.2});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:triangle.c, color:'GREEN', size:0.2});

*/

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:triangle.a, to:triangle.b, color:'AQUA'});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:triangle.b, to:triangle.c, color:'AQUA'});
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:triangle.c, to:triangle.a, color:'AQUA'});

    }

    return find.z;
};


let setTerrainHeightAt = function(groundPiece, pos, reach) {

    let  module = this.getPieceTerrainModule(groundPiece);

    calcVec1.setVec(groundPiece.spatial.pos);

    calcVec2.setVec(pos);
    calcVec2.subVec(calcVec1);

    let  terrainSize = this.getTerrainModuleSize(module);
    let  segments = this.getTerrainSegmentse(module);

    let  array1d = module.state.value;

    this.setHeightAt(module, calcVec2, array1d, terrainSize, segments, pos.getY(), reach);
};


let setHeightAt = function(module, posVec, array1d, terrainSize, segments, height, reach) {
    let  pos = posVec.data;

    let  htP = terrainSize;
    let  htN = -htP;

    if (pos[0] < htN || pos[0] > htP || pos[2] < htN || pos[2] > htP) {

        console.log("Terrain!", pos[0], pos[2], "Is Outside")
        //    return -1000;
        pos[0] = MATH.clamp(pos[0], htN, htP);
        pos[2] = MATH.clamp(pos[2], htN, htP);
    }


    let  x = this.displaceAxisDimensions(2*pos[0]-terrainSize, htN, htP, segments);
    let  y = this.displaceAxisDimensions(2*pos[2]-terrainSize, htN, htP, segments);


    let  xf = Math.floor(x);
    let  yf = Math.floor(y);


    let  vertexReach = Math.ceil(reach / (terrainSize/segments))+1;

    // height = -1
    this.setHeightByIndexAndReach(array1d, xf, yf, vertexReach, height)

};

let setHeightByIndexAndReach = function(array1d, xf, yf, vertexReach, height) {

    let  segments = Math.sqrt(array1d.length)-1;

    for (let  i = -vertexReach; i < vertexReach+1; i++) {

        let  iw =  Math.cos((i) / (vertexReach+1));

        for (let  j = -vertexReach; j < vertexReach+1; j++) {

            let  jw = Math.cos((j) / (vertexReach+1));

            let  cw = MATH.clamp(iw*jw * 1.40, 0, 1);

            let  ijW = cw * cw * ((cw)+MATH.sillyRandom(i*2.1231+j*31.5123)*(1-cw)) * ((cw)+MATH.sillyRandom((i+j)*4.31+j*31.513)*(1-cw)); // jWeight*iWeight;

            this.setAt(height, array1d, segments,xf+i, yf+j, ijW);
        }
    }
};

class TerrainFunctions {
    constructor() {
        iWeightCurve = new MATH.CurveState(MATH.curves['zeroOneZero'], 1);
        jWeightCurve = new MATH.CurveState(MATH.curves['zeroOneZero'], 1);

    }

    createTerrain = function(moduleOptions) {

        moduleOptions = moduleOptions || defaultoptions;


        let  edges = getTerrainModuleEdges(moduleOptions);
        let  opts = getTerrainModuleOpts(moduleOptions);

        let  terrain = new THREE.Terrain(opts);
        terrain.opts = opts;
        terrain.edges = edges;
        terrain.options = moduleOptions

        elevateTerrainVerts(terrain.children[0].geometry.vertices, 1);
        THREE.Terrain.Edges(terrain.children[0].geometry.vertices, opts, false, edges.edgeSize, null) // edges.easingFunc);

        //    sliceGeometryAtSeaLevel(terrain.children[0].geometry.vertices, opts.minHeight);

        //    function(g, options, direction, distance, easing) {
        //     THREE.Terrain.RadialEdges(terrain.children[0].geometry.vertices, opts, false, 2) // edges.easingFunc);
        //    this.setEdgeVerticeHeight(terrain.children[0].geometry.vertices, -0.5);

        return terrain;
    };

    enableTerrainPhysics = function(piece) {
        let  module = this.getPieceTerrainModule(piece);
        physicsApi.includeBody(module.body);
    };

    disableTerrainPhysics = function(piece) {
        let  module = this.getPieceTerrainModule(piece);
        physicsApi.excludeBody(module.body);
    };



    getTerrainHeightAt = function(terrain, pos, terrainOrigin, normalStore) {

        calcVec2.subVectors(pos, terrainOrigin);

        let  terrainSize = terrain.opts.xSize;
        let  segments = terrain.opts.xSegments;

        calcVec2.x -= terrain.opts.xSize / 2;
        calcVec2.z -= terrain.opts.xSize / 2;

        return getHeightAt(calcVec2, terrain.array1d, terrainSize, segments, normalStore);
    };

    getTerrainBuffers(terrain) {
        return getTerrainBuffers(terrain)
    }

}

export {
    getHeightAt,
    getGroundDataAt,
    shadeGroundCanvasAt,
    fitHeightToAABB,
    applyTerrainCanvasEdit,
    applyGroundCanvasEdit,
}