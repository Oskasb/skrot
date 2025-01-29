import {MATH} from "../MATH.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Triangle} from "../../../../libs/three/math/Triangle.js";

let normVec = new Vector3()
let triangle = new Triangle()
let lastHeight = 0;
let heightDiff;
let minHeight;
let maxHeight;
let roadPixels = [];
let worldLevel;

triangle.a.x =  0;
triangle.a.z =  0;

triangle.b.x =  1;
triangle.b.z =  0;

triangle.c.x =  0;
triangle.c.z =  1;



const rgb = {
    r:0,
    g:0,
    b:0
}

function rgbFromArray(array) {
    rgb.r = array[0];
    rgb.g = array[1];
    rgb.b = array[2];
    return rgb;
}

const roadColors =     [
    [
        [117, 55,   1],
        [107, 65,  16],
        [77,  55,  16],
        [77,  45,  46],
        [57,  35,   6],
        [97,  85,  66],
        [87,  75,  73],
        [194, 183, 173]
    ],
    [
        [117, 55,   1],
        [107, 65,  16],
        [77,  55,  16],
        [77,  45,  46],
        [57,  35,   6],
        [67,  45,  26],
        [27,  15,   6],
        [244, 243, 243]
    ],
    [
        [117, 55,   1],
        [107, 65,  16],
        [77,  55,  16],
        [77,  45,  46],
        [57,  35,   6],
        [67,  55,  16],
        [37,  25,  36],
        [244, 243, 233]
    ]
]

const vegColors =     [
    [
        [117, 55,   1],
        [107, 65,  16],
        [77,  55,  16],
        [77,  45,  46],
        [57,  65,  46],
        [47,  55,  26],
        [37,  45,  7],
        [24,  33,  2]
    ],
    [
        [32,  71,  31],
        [46,  52,  11],
        [62,  76,  14],
        [47,  85,  11],
        [26,  55,  1],
        [22,  45,  4],
        [16,  35,  11],
        [8,   23,  6]
    ],
    [
        [233, 233,233],
        [233, 233,233],
        [77,  55,  16],
        [77,  45,  46],
        [57,  95,  46],
        [27,  85,  26],
        [27,  45,  26],
        [14,  53,  13]
    ]
]

const slopeColors =     [
    [
        [153,138,121],
        [117, 65,  86],
        [57,  45,  41],
        [77,  65,  66],
        [35, 21,   16],
        [33, 22,  15],
        [64, 61, 52],
        [67, 67, 56]
    ],
    [
        [68, 70,100],
        [55, 63, 86],
        [43, 55, 51],
        [57, 65, 56],
        [55, 55, 46],
        [44, 44, 35],
        [17, 17, 27],
        [33, 31, 24]
    ],
    [
        [245, 245,245],
        [233, 233,252],
        [168, 168, 228],
        [77,  45,  46],
        [55, 55, 66],
        [44, 44, 55],
        [17, 17, 31],
        [33, 31, 34]
    ]
]


function groundPrintRoadToRgb(red, green, blue) {
    let clrIndex = Math.floor(8 * blue/256)
    let biomeIndex = Math.floor(2.99 * red/256)
    let clrArray = roadColors[biomeIndex][clrIndex];
    return rgbFromArray(clrArray)
}

function groundPrintSlopeToRgb(red, slope) {
        let clrIndex = Math.floor(8 * MATH.curveQuad(slope))
        let biomeIndex = Math.floor(2.99 * red/256)
        let clrArray = slopeColors[biomeIndex]
    if (!clrArray) {
        console.log("OOB", biomeIndex, red, slope);
    }
        let colorsArray = clrArray[clrIndex];
    if (!colorsArray) {
        console.log("OOB", clrIndex, red, slope);
    }
    if (clrIndex === 7) {

    //    console.log("Clr index 7", colorsArray);
    }

        return rgbFromArray(colorsArray)
}

function groundPrintGreenToRgb(red, green) {
    let clrIndex = Math.floor(8 * green / 256)
    let biomeIndex = Math.floor(2.99 * red/256)
    let clrArray = vegColors[biomeIndex]
    if (!clrArray) {
        console.log("OOB", biomeIndex, red, green);
    }
    let colorsArray = clrArray[clrIndex];
    return rgbFromArray(colorsArray)
}

function isRoad(blue) {
    if (blue > 10) {
        return true;
    }
}

function getNormal(pixel, buffer, normStore) {
    let side = Math.sqrt(buffer.length)
    triangle.a.y = buffer[pixel] * 0.1;

    if (pixel+4 < buffer.length) {
        triangle.b.y = buffer[pixel+1] * 0.1;
    } else {
        triangle.b.y = buffer[pixel]* 0.1;
    }

    if (pixel+side < buffer.length) {
        triangle.c.y = buffer[pixel+side]* 0.1
    } else {
        triangle.c.y = buffer[pixel]* 0.1
    }
    triangle.getNormal(normStore)
    normStore.normalize();
}

function dampenPixel(pixelIndex, groundTextureBuffer) {
    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;
    groundTextureBuffer[indexR] *=0.8;
    groundTextureBuffer[indexG] *=0.8;
    groundTextureBuffer[indexB] *=0.8;
}

function allNeighborsAreRoad(pixelIndex, groundData, mapTextureBuffer, sideGround) {
    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;

    let sideOffset = sideGround * 4;

            if (!isRoad(groundData[indexB - 4 ])) {
                dampenPixel(pixelIndex - 1, mapTextureBuffer)
                return false;
            }

                if (!isRoad(groundData[indexB + 4 ])) {
                    dampenPixel(pixelIndex + 1, mapTextureBuffer)
                    return false
                }

                if (!isRoad(groundData[indexB+sideOffset ] )) {
                    dampenPixel(pixelIndex + sideGround, mapTextureBuffer)
                    return false;
                }

                if (!isRoad(groundData[indexB+sideOffset +4 ] )) {
                    dampenPixel(pixelIndex + sideGround +1, mapTextureBuffer)
                    return false;
                }

                if (!isRoad(groundData[indexB+sideOffset -4 ] )) {
                    dampenPixel(pixelIndex + sideGround -1, mapTextureBuffer)
                    return false;
                }

                if (!isRoad(groundData[indexB-sideOffset ] )) {
                    dampenPixel(pixelIndex - sideGround, mapTextureBuffer)
                    return false;
                }
                if (!isRoad(groundData[indexB-sideOffset +4 ])) {
                    dampenPixel(pixelIndex - sideGround +1, mapTextureBuffer)
                    return false;
                }

                if (!isRoad(groundData[indexB-sideOffset -4 ] )) {
                    dampenPixel(pixelIndex - sideGround -1, mapTextureBuffer)
                    return false;
                }

    return true;
}

function markRoads(groundData, mapTextureBuffer, sideGround) {

    for (let i = 0; i < roadPixels.length; i++) {
        let onlyRoadNeighbors = allNeighborsAreRoad(roadPixels[i], groundData, mapTextureBuffer, sideGround)
       if (onlyRoadNeighbors === false) {

           let indexR = roadPixels[i]*4
           let indexG = indexR+1;
           let indexB = indexR+2;
           let indexA = indexR+3;
           mapTextureBuffer[indexR] *= 0.55;
           mapTextureBuffer[indexG] *= 0.54;
           mapTextureBuffer[indexB] *= 0.73;
       }

    }

}

function handleMessage(msg) {

    let worldLevel = msg.data.worldLevel;
    let heightData = msg.data.heightData;
    let groundData = msg.data.groundData;

    minHeight =  msg.data.minHeight;
    maxHeight =  msg.data.maxHeight;

    console.log("Map Msg", msg, minHeight, maxHeight, [heightData], [groundData]);

    processHeightData(worldLevel, minHeight, maxHeight, heightData, groundData);

}

function processHeightData(wLevel, minHeight, maxHeight, heightData, groundData) {
    worldLevel = wLevel;
    let sideHeight = Math.sqrt(heightData.length)
    let sideGround = Math.sqrt(groundData.length/4)

    let groundTextureBuffer = new Uint8ClampedArray(groundData.length)
    let mapTextureBuffer = new Uint8ClampedArray(groundData.length)
    heightDiff = maxHeight-minHeight;
    lastHeight = 0;

    console.log("heightTextureBuffer", sideHeight, sideGround, [heightData, groundTextureBuffer])

    for (let i = 0; i < sideHeight; i++) {
        for (let j = 0; j < sideHeight; j++) {
            processHeightPixel(i, j, heightData, sideHeight, groundData, sideGround, mapTextureBuffer, groundTextureBuffer);
        }
    }

    markRoads(groundData, mapTextureBuffer, sideGround)
    saveBufferAsPng(worldLevel, groundTextureBuffer, mapTextureBuffer);
}


function saveBufferAsPng(worldLevel, groundTxData, mapTxData) {
    postMessage({worldLevel:worldLevel, groundData:groundTxData, mapData:mapTxData})
}

function processHeightPixel(pxx, pxy, heightData, sideHeight, groundData, sideGround, mapTextureBuffer, groundTextureBuffer) {

    let pixelIndex = pxx + pxy*sideHeight;
    let height = minHeight + heightData[pixelIndex];

    let diff = (height - lastHeight) * (0.2);
    getNormal(pixelIndex, heightData, normVec);
    let slope = MATH.clamp( (Math.abs( normVec.x) + Math.abs(normVec.z)) * 0.5, 0, 0.99);

    let scaledPixelA = pxx*2 + pxy*2*sideGround;
    let scaledPixelB = pxx*2 + pxy*2*sideGround+1;
    let scaledPixelC = pxx*2 + (pxy*2+1)*sideGround;
    let scaledPixelD = pxx*2 + (pxy*2+1)*sideGround+1;

    let shade = 0;

    drawGroundTexturePixel(scaledPixelA, height, slope, diff, shade, groundData, mapTextureBuffer, groundTextureBuffer);
    drawGroundTexturePixel(scaledPixelB, height, slope, diff, shade, groundData, mapTextureBuffer, groundTextureBuffer);
    drawGroundTexturePixel(scaledPixelC, height, slope, diff, shade, groundData, mapTextureBuffer, groundTextureBuffer);
    drawGroundTexturePixel(scaledPixelD, height, slope, diff, shade, groundData, mapTextureBuffer, groundTextureBuffer);

    lastHeight = height;

}

function drawGroundTexturePixel(pixelIndex, height, slope, diff, shade, groundData, mapTextureBuffer, groundTextureBuffer) {

    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;

    let red = groundData[indexR];
    let green = groundData[indexG];
    let blue = groundData[indexB];
    let alpha = groundData[indexA];

    let seed = indexR * 0.01;
    let scatter = Math.floor(MATH.sillyRandom(seed) * 40)

    if (height > maxHeight*0.65) {
        red = 255;
    } else if (height > maxHeight*0.45) {
        if (MATH.sillyRandom(seed) < 0.75) {
            red = 255;
        }
    } else if (height > maxHeight*0.38) {
        if (MATH.sillyRandom(seed) < 0.5) {
            red = 255;
        }
    } else if (height > maxHeight*0.35) {
        if (MATH.sillyRandom(seed) < 0.25) {
            red = 255;
        }
    }

    if (slope > 0.2) {
    //    console.log(slope)
        green = 0;
    }

    groundTextureBuffer[indexR] = red;
    groundTextureBuffer[indexG] = green;
    groundTextureBuffer[indexB] = blue;
    groundTextureBuffer[indexA] = alpha;


    if (height > 0) {
        // AboveWater

        let normalFactor =  1 - (normVec.x + normVec.z) *0.1;
        let markNormal = normalFactor

        if (isRoad(blue)) { // Roads & Buildings
            roadPixels.push(pixelIndex);
            let rgb = groundPrintRoadToRgb(red, green, blue);
            mapTextureBuffer[indexR] = rgb.r + diff*10+scatter*0.5 + slope*4 + 3;
            mapTextureBuffer[indexG] = rgb.g + diff*10+scatter*0.5 + slope*4 + 2;
            mapTextureBuffer[indexB] = rgb.b + diff*4 +scatter*0.5 + slope*4 + 1;
        } else if (green === 0) { // bare flat or hills
            let wave = 20 + Math.floor(MATH.curveSqrt(height*(1/heightDiff))) * 8

            let rgb = groundPrintSlopeToRgb(red, slope)
            mapTextureBuffer[indexR] = rgb.r + diff*3+scatter*1 + wave + slope*2;
            mapTextureBuffer[indexG] = rgb.g + diff*3+scatter*1 + wave + slope*2;
            mapTextureBuffer[indexB] = rgb.b + diff*1+scatter*1 + slope*2;

        } else { // vegetation
            let wave = 5 + Math.floor(MATH.curveSqrt(height*0.25)) * 1

            let rgb = groundPrintGreenToRgb(red, green)
            mapTextureBuffer[indexR] = rgb.r + diff*5+scatter*1 + wave + slope*2;
            mapTextureBuffer[indexG] = rgb.g + diff*5+scatter*1 + wave + slope*2;
            mapTextureBuffer[indexB] = rgb.b + diff*3+scatter*1 + slope*2;

        }

        if (markNormal < 1) {
            mapTextureBuffer[indexR] *= (markNormal*markNormal*markNormal);
            mapTextureBuffer[indexG] *= (markNormal*markNormal*markNormal);
            mapTextureBuffer[indexB] *= markNormal;
        } else {
            mapTextureBuffer[indexR] += (markNormal-1)*200;
            mapTextureBuffer[indexG] += (markNormal-1)*175;
            mapTextureBuffer[indexB] += (markNormal-1)*150;
        }

// desaturate
        mapTextureBuffer[indexR] *= 0.75;
        mapTextureBuffer[indexG] *= 0.7;
        mapTextureBuffer[indexB] *= 0.65;
        mapTextureBuffer[indexR] += 45;
        mapTextureBuffer[indexG] += 35;
        mapTextureBuffer[indexB] += 25;

    } else {
        // Below Water
        let depth = height - minHeight;

        let depthMax = 0 - minHeight;

        scatter = Math.floor(scatter*depth*0.1);

        let depthFactor = depth*scatter * 0.2 / depthMax
        let slopeFactor = depthFactor*slope
        groundTextureBuffer[indexG] = 0;
        mapTextureBuffer[indexR] = 66 + Math.floor(diff * 0.5 + depthFactor*0.3 + slopeFactor * 0.8 ) ;
        mapTextureBuffer[indexG] = 71 + Math.floor(diff * 0.5 + depthFactor*0.6 + slopeFactor * 1.5 );
        mapTextureBuffer[indexB] = 98 + Math.floor(diff * 0.5 + depthFactor*0.9 + slopeFactor );
    }
    mapTextureBuffer[indexA] = 255;
    groundTextureBuffer[indexA] = 255;
}




onmessage = function (oEvent) {
    handleMessage(oEvent);
};

postMessage("Loaded")