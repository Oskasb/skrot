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


function saveBufferAsPng(worldLevel, groundData, buffer) {
    postMessage({worldLevel:worldLevel, groundData:groundData, buffer:buffer})
}


function getNormal(pixel, buffer, normStore) {
    let side = Math.sqrt(buffer.length)
    triangle.a.y = buffer[pixel];

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

}

function dampenPixel(pixelIndex, groundTextureBuffer) {
    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;
    groundTextureBuffer[indexR] *=0.9;
    groundTextureBuffer[indexG] *=0.8;
    groundTextureBuffer[indexB] *=0.7;
}

function allNeighborsAreRoad(pixelIndex, groundData, groundTextureBuffer, sideGround) {
    let indexR = pixelIndex*4
    let indexG = indexR+1;
    let indexB = indexR+2;
    let indexA = indexR+3;

    let sideOffset = sideGround*4;

        if (groundData[indexB - 4 ] === 0) {
            dampenPixel(pixelIndex - 1, groundTextureBuffer)
            return false;
        }
        if (groundData[indexB + 4 ] === 0) {
            dampenPixel(pixelIndex + 1, groundTextureBuffer)
            return false;
        }

        if (groundData[indexB+sideOffset ] === 0) {
            dampenPixel(pixelIndex + sideGround, groundTextureBuffer)
            return false;
        }
        if (groundData[indexB+sideOffset +4 ] === 0) {
            dampenPixel(pixelIndex + sideGround +1, groundTextureBuffer)
            return false;
        }

        if (groundData[indexB+sideOffset -4 ] === 0) {
            dampenPixel(pixelIndex + sideGround -1, groundTextureBuffer)
            return false;
        }

        if (groundData[indexB-sideOffset ] === 0) {
            dampenPixel(pixelIndex - sideGround, groundTextureBuffer)
            return false;
        }
        if (groundData[indexB-sideOffset +4 ] === 0) {
            dampenPixel(pixelIndex - sideGround +1, groundTextureBuffer)
            return false;
        }

        if (groundData[indexB-sideOffset -4 ] === 0) {
            dampenPixel(pixelIndex - sideGround -1, groundTextureBuffer)
            return false;
        }

    return true;
}

function markRoads(groundData, groundTextureBuffer, sideGround) {

    for (let i = 0; i < roadPixels.length; i++) {
        let onlyRoadNeighbors = allNeighborsAreRoad(roadPixels[i], groundData, groundTextureBuffer, sideGround)
       if (onlyRoadNeighbors === false) {

           let indexR = roadPixels[i]*4
           let indexG = indexR+1;
           let indexB = indexR+2;
           let indexA = indexR+3;
           groundTextureBuffer[indexR] *= 0.55;
           groundTextureBuffer[indexG] *= 0.64;
           groundTextureBuffer[indexB] *= 0.83;
       }

    }

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


    if (height > 0) {
        // AboveWater

        let markNormal = 1 + (normVec.x + normVec.z) *0.15;

        if (blue !== 0) { // Roads & Buildings
            roadPixels.push(pixelIndex);
            groundTextureBuffer[indexR] = (45 + blue * 0.1 + red * 0.1 + diff*10+scatter + slope*30 + 7 );
            groundTextureBuffer[indexG] = (35 + blue * 0.2 - red * 0.1 + diff*10+scatter + slope*30 + 5 );
            groundTextureBuffer[indexB] = (55 + blue * 0.1 - red * 0.2 + diff*4 +scatter + slope*30 + 4 );
        } else if (green === 0) { //
            let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 8

            if (slope < 0.3) { // flat enough

                if (red > 27) {
                    if (red > 200) {
                        groundTextureBuffer[indexR] = (200 + diff*2+scatter*2 + wave + slope*22 - shade*0.05);
                        groundTextureBuffer[indexG] = (200 + diff*2+scatter*3 + wave + slope*36 - shade*0.05);
                        groundTextureBuffer[indexB] = (200 + diff*2+scatter*2 + slope*13 - shade*0.05);
                    } else if (red > 75 ) {
                        groundTextureBuffer[indexR] = (40 + diff*2+scatter*2 + wave + slope*22 - shade*0.05);
                        groundTextureBuffer[indexG] = (15 + diff*2+scatter*3 + wave + slope*36 - shade*0.05);
                        groundTextureBuffer[indexB] = (5  + diff*2+scatter*2 + slope*11 - shade*0.05);
                    } else {
                        groundTextureBuffer[indexR] = (40 + diff*2+scatter*1 + wave + slope*32 - shade*0.05);

                        groundTextureBuffer[indexG] = (45 + diff*12+scatter*1 + wave + slope*26 - shade*0.05);

                        groundTextureBuffer[indexB] = (20 + diff*2+scatter*1 + slope*15 - shade*0.05);
                    }

                } else { // desert
                    groundTextureBuffer[indexR] = (160 + diff*1+scatter*0.5 + wave + slope*52 - shade*0.05);
                    groundTextureBuffer[indexG] = (130 + diff*1+scatter*0.5 + wave + slope*45 - shade*0.05);
                    groundTextureBuffer[indexB] = (115 + diff*1+scatter*0.5  + slope*30 - shade*0.05);
                }

            } else {

                if (slope > 0.3) {
                    mapTextureBuffer[indexG] = 0;
                }

                slope-=0.4;
                mapTextureBuffer[indexG] = 0;
                groundTextureBuffer[indexR] = (2 + diff*1+scatter + wave*2 + slope*5 - shade*0.1) - red*0.05;
                groundTextureBuffer[indexG] = (2 + diff*1+scatter + wave*2 + slope*5 - shade*0.1) - red*0.1;
                groundTextureBuffer[indexB] = (2 + diff*1+scatter + wave*2 + slope*5 - shade*0.1) - red*0.2;
            }

            if (height > maxHeight*0.6) {
                mapTextureBuffer[indexR] = 255;
            } else if (height > maxHeight*0.8) {
                if (MATH.sillyRandom(seed) < 0.75) {
                    mapTextureBuffer[indexR] = 255;
                }
            } else if (height > maxHeight*0.7) {
                if (MATH.sillyRandom(seed) < 0.5) {
                    mapTextureBuffer[indexR] = 255;
                }
            } else if (height > maxHeight*0.6) {
                if (MATH.sillyRandom(seed) < 0.25) {
                    mapTextureBuffer[indexR] = 255;
                }
            }

        } else { // Woods
            let wave = 20 + Math.floor(MATH.curveSqrt(height*0.25)) * 4

            if (slope > 0.4) {
                mapTextureBuffer[indexG] = 0;
            }

            if (green > 127) { // Trees
                groundTextureBuffer[indexR] = (25 + scatter*0.25 + shade*0.01);
                groundTextureBuffer[indexG] = (35 + scatter*0.25 + scatter*shade*0.001);
                groundTextureBuffer[indexB] = (2 + scatter*0.25 + shade*0.01);
                markNormal = MATH.curveSqrt(markNormal);
            } else {
                groundTextureBuffer[indexR] = (35 + diff*2+scatter*1.5 + slope*1 - shade*0.1);
                scatter = Math.floor(MATH.sillyRandom(seed+1) * 40)
                groundTextureBuffer[indexG] = (60 + diff*2+scatter*0.5 + slope*5 - shade*0.1);
                scatter = Math.floor(MATH.sillyRandom(seed+2) * 40)
                groundTextureBuffer[indexB] = (5  + diff*3+scatter*0.4 + slope*1 - shade*0.1);
            }

        }

        if (markNormal < 1) {
            groundTextureBuffer[indexR] *= (markNormal*markNormal*markNormal);
            groundTextureBuffer[indexG] *= (markNormal*markNormal*markNormal);
            groundTextureBuffer[indexB] *= markNormal;
        } else {
            groundTextureBuffer[indexR] += (markNormal-1)*200;
            groundTextureBuffer[indexG] += (markNormal-1)*175;
            groundTextureBuffer[indexB] += (markNormal-1)*150;
        }


    } else {
        // Below Water
        let depth = height - minHeight;

        let depthMax = 0 - minHeight;

        scatter = Math.floor(scatter*depth*0.1);

        let depthFactor = depth*scatter * 0.2 / depthMax
        let slopeFactor = depthFactor*slope
        mapTextureBuffer[indexG] = 0;
        groundTextureBuffer[indexR] = 66 + Math.floor(diff * 0.5 + depthFactor*0.3 + slopeFactor * 0.8 ) ;
        groundTextureBuffer[indexG] = 71 + Math.floor(diff * 0.5 + depthFactor*0.6 + slopeFactor * 1.5 );
        groundTextureBuffer[indexB] = 98 + Math.floor(diff * 0.5 + depthFactor*0.9 + slopeFactor );
    }
    mapTextureBuffer[indexA] = 255;
    groundTextureBuffer[indexA] = 255;
}

function processHeightPixel(pxx, pxy, heightData, sideHeight, groundData, sideGround, mapTextureBuffer, groundTextureBuffer) {

    let pixelIndex = pxx + pxy*sideHeight;


 //   let height = heightData[pixelIndex];
//    let pixelB = heightData[indexB];

 //   let heightFraction = pixelR / 255;
    let height = minHeight + heightData[pixelIndex];

    let diff = lastHeight - height;

    getNormal(pixelIndex, heightData, normVec);

    let slope = 1 - Math.abs( normVec.y );

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

function processHeightData(wLevel, minHeight, maxHeight, heightData, groundData) {
    worldLevel = wLevel;
    let sideHeight = Math.sqrt(heightData.length)
    let sideGround = Math.sqrt(groundData.length/4)

    let groundTextureBuffer = new Uint8ClampedArray(groundData.length)
    let mapTextureBuffer = new Uint8ClampedArray(heightData.length * 4)
    heightDiff = maxHeight-minHeight;
    lastHeight = 0;

    console.log("heightTextureBuffer", sideHeight, sideGround, [heightData, groundTextureBuffer])

    for (let i = 0; i < sideHeight; i++) {
        for (let j = 0; j < sideHeight; j++) {
            processHeightPixel(i, j, heightData, sideHeight, groundData, sideGround, mapTextureBuffer, groundTextureBuffer);
        }
    }

    markRoads(groundData, groundTextureBuffer, sideGround)
    saveBufferAsPng(worldLevel, mapTextureBuffer, groundTextureBuffer);
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


onmessage = function (oEvent) {
    handleMessage(oEvent);
};

postMessage("Loaded")