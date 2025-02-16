import {Object3D} from "../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {Euler} from "../../../libs/three/math/Euler.js";

(function(){Math.clamp=function(a,b,c){return Math.max(b,Math.min(c,a));}})();

function sinWave(time, speed, amplitude) {
	return Math.sin(time * speed) * amplitude;
}

function cosWave(time, speed, amplitude) {
	return Math.cos(time * speed) * amplitude;
}

let euler = new Euler()

let calcVec = new Vector3();
let calcVec1 = new Vector3();
let tempObj = new Object3D()
let half32BitInt = 1047483647;
let bigSafeValue = 53372036850;
let tempRandVec = null;
let p1  = {x:0, y:0, z:0};
let p2  = {x:0, y:0, z:0};
let p3  = {x:0, y:0, z:0};
let setTri = function(tri, x, y, z) {
	tri.x = x;
	tri.y = y;
	tri.z = z
};

let origin = new Vector3(0, 0, 0);
let points = [];
let mag;
let progString = ''

let blend = 0;
let i = 0;
let idx;
let arrayShifter = [];
let entry;
let remove;
let track = [];
let rgba = {};

let	curves = {
	"constantOne":  [[-10, 1], [10, 1]],
	"nearOne":  [[-10, 1], [0.25, 0.92], [0.75, 1.02], [10, 1]],
	"zeroToOne":    [[0, 0], [1, 1]],
	"oneToZero":    [[0, 1], [1, 0]],
	"quickFadeOut": [[0, 1], [0.9,1], [1,   0]],
	"quickFadeIn":  [[0, 0], [0.4,0.9], [1,   1]],
	"attackIn":     [[0, 1], [0.1,0], [1,   0]],
	"centerStep":   [[0, 0], [0.25,0],[0.75,1], [1, 1]],

	"edgeStep":     [[0, 0], [0.35,0.45],[0.65,0.55], [1, 1]],
	"quickInOut":   [[0, 0], [0.15,1], [0.85, 1], [1, 0]],
	"posToNeg":     [[0, 1], [1,-1]],
	"negToPos":     [[0,-1], [1, 1]],
	"zeroOneZero":  [[0, 0], [0.5,1], [1,  0]],
	"lateFadeIn":   [[0, 0], [0.4,0.15], [0.7,0.33],  [0.9,0.7], [1,  1]],
	"centerPeak":   [[0, 0], [0.3, 0], [0.4, 0.25], [0.45,0.8], [0.5,1], [0.55, 0.8], [0.6 ,0.25], [0.7, 0],  [1,  0]],

	"radialFade":   [[-3.14, 1], [-2.7,0.75], [-2,0.2], [0,0],[2,0.2], [2.7,0.75], [3.14,1]],
	"unitFade":     [[-1, 1], [-0.7,0.75], [-0.5,0.2], [0,0],[0.5,0.2], [0.7,0.75], [1,1]],
	"unitFlip":     [[-1, -1], [-0.1,-1],[0.1,1], [1, 1]],
	"halfUnitFade":     [[-0.5, 1], [-0.4,0.75], [-0.25,0.1], [0,0],[0.25,0.1], [0.4,0.75], [0.5,1]],
	"centerBlipp":  [[-1, 0], [0.30,0.0], [0.47,0.05],  [0.49,1],   [0.53,1],    [0.57,0.05],[0.7, 0], [1, 0]],

	"doubleBlipp":  [[-1, 0], [0.12, 0], [0.17, 1], [0.21, 1],   [0.25,0.1],  [0.35,0],  [0.45,0.1], [0.48,1], [0.52,1],   [0.58,0.0], [1,  0]],

	"centerHump":   [[0, 0], [0.1,0.5],   [0.2,0.75], [0.5,1],     [0.8,0.75], [0.9,0.5], [1,  0]],
	"oneZeroOne":   [[0, 1], [0.5,0], [1,  1]],
	"growShrink":   [[0, 1], [0.5,0], [1, -2]],
	"shrink":   	[[0, -0.3], [0.3, -1]],
	"machByAlt":    [[0, 1], [12200, 0.867], [12200, 0.867], [20000, 0.867], [32000, 0.88]],
	"densityByAlt": [[0.1, 2.0], [1, 1.6], [4, 1.3], [15, 1.2], [1000, 0.9],  [2000, 0.8], [10000, 0.2], [100000, 0]]
};

if (!Math.sign) {
	Math.sign = function (x) {
		// If x is NaN, the result is NaN.
		// If x is -0, the result is -0.
		// If x is +0, the result is +0.
		// If x is negative and not -0, the result is -1.
		// If x is positive and not +0, the result is +1.
		x = +x; // convert to a number
		if (x === 0 || isNaN(x)) {
			return Number(x);
		}
		return x > 0 ? 1 : -1;
	};
}

let MATH = {}

MATH.curves = curves;
MATH.TWO_PI = 2.0 * Math.PI;
MATH.HALF_PI = 0.5 * Math.PI;
MATH.G = -9.81;
MATH.sign = Math.sign;
MATH.origin = origin;

MATH.getNowMS = function() {
	return performance.now();
};

MATH.trackEvent = function(statEnum, value, unitEnum, digits) {
	track[0] = statEnum;
	track[1] = value;
	track[2] = unitEnum || 0;
	track[3] = digits || 0;
	return track;
};

MATH.quickSplice = function(array, removeEntry) {

	remove = null;

	while (array.length) {
		entry = array.pop();
		if (entry === removeEntry) {
			remove = entry;
		} else {
			arrayShifter.push(entry);
		}
	}

	while (arrayShifter.length) {
		array.push(arrayShifter.pop());
	}

	if (!remove) {
		console.log("Entry not found", array, removeEntry)
		return false;

	} else {
		//		console.log("Entry found", removeEntry)
	}

	return removeEntry;
};

MATH.splice = function(array, removeEntry) {
	let idx = array.indexOf(removeEntry)
	if (idx === -1) {
		return false;
	}
	array.splice(idx, 1)

	return removeEntry
};

MATH.emptyArray = function(array) {
	while (array.length) {
		array.pop();
	}
};

MATH.isEvenNumber =function(n) {
	return Math.abs(n % 2) === 1;
}

MATH.gridXYfromCountAndIndex = function(count, index, store) {
	store.y = Math.floor(index / Math.sqrt(count)) - Math.sqrt(count)*0.5;
	store.x = index % Math.round(Math.sqrt(count)) - Math.sqrt(count)*0.5;
};

MATH.getRandomObjectEntry = function(obj) {
	let keys = Object.keys(obj);
	return obj[keys[ keys.length * Math.random() << 0]];
};

MATH.getRandomArrayEntry = function(array) {
	return array[Math.floor(Math.random()*array.length)]
};

MATH.getSillyRandomArrayEntry = function(array, seed) {
	return array[Math.floor(MATH.sillyRandom(seed)*array.length)]
};

MATH.sillyRandomBetweenColors = function(rgba1, rgba2, seed, store) {
	if (!store) store = rgba;
	store.r = MATH.sillyRandomBetween(rgba1[0], rgba2[0], seed);
	store.g = MATH.sillyRandomBetween(rgba1[1], rgba2[1], seed+1);
	store.b = MATH.sillyRandomBetween(rgba1[2], rgba2[2], seed+2);
	store.a = MATH.sillyRandomBetween(rgba1[3], rgba2[3], seed+3);
	return store;
}

MATH.rgbaToXYZW = function(rgba, store) {
	store.x = rgba.r;
	store.y = rgba.g;
	store.z = rgba.b;
	store.w = rgba.a;
}

MATH.arrayContains = function(array, entry) {
	return array.indexOf(entry) !== -1;
};

MATH.getFromArrayByKeyValue = function(array, key, value) {
	for (let idx = 0; idx < array.length; idx++) {
		if (array[idx][key] === value) {
			//	console.lof("Get ", array, idx, key)
			return array[idx];
		}
	}
};

MATH.getFromArrayByKey = function(array, key, value) {
	for (let idx = 0; idx < array.length; idx++) {
		if (array[idx][key]) {

			//	console.lof("Get ", array, idx, key)
			return array[idx];
		}
	}
};

MATH.callAll = function(array, arg1, arg2, arg3, arg4, arg5) {

	if (array) {
		for (let all = 0; all < array.length; all++) {
			array[all](arg1, arg2, arg3, arg4, arg5);
		}
	}

};


MATH.forAll = function(array, func, arg1, arg2, arg3, arg4, arg5) {
	for (let all = 0; all < array.length; all++) {
		func(array[all], arg1, arg2, arg3, arg4, arg5);
	}
};

MATH.callAndClearAll = function(array, arg1, arg2, arg3, arg4, arg5) {
	while(array.length) {
		let cb = array.pop()
		cb(arg1, arg2, arg3, arg4, arg5);
	}
};

MATH.vectorAtPositionTowards = function(sourceVec3, targVec3, distance, storeVec3) {
	storeVec3.subVectors(targVec3, sourceVec3);
	storeVec3.normalize();
	storeVec3.multiplyScalar(distance);
	storeVec3.add(sourceVec3);
}

MATH.animationFunctions = {
	sinwave:  sinWave,
	coswave:  cosWave
};

MATH.percentify = function(number, total, skipRound) {
	if (skipRound) {
		return (number/total) * 100;
	} else {
		return Math.round((number/total) * 100);
	}

};

MATH.isOddNumber = function(number) {
	return number % 2;
};

MATH.bufferSetValueByMapKey = function(buffer, value, map, key) {
	buffer[map.indexOf(key)] = value;
};

MATH.bufferGetValueByMapKey = function(buffer, map, key) {
	return buffer[map.indexOf(key)];
};

MATH.bufferSetValueByEnum = function(buffer, value, enm) {
	buffer[enm] = value;
};

MATH.bufferGetValueByEnum = function(buffer, enm) {
	return buffer[enm];
};

MATH.mpsToKnots = function(mps) {
	return 0.514444 * mps;
};

MATH.mpsToMachAtSeaLevel = function(mps) {
	return mps/340.3;
};

MATH.mpsAtAltToMach = function(mps, alt) {
	return MATH.valueFromCurve(alt, curves.machByAlt) * MATH.mpsToMachAtSeaLevel(mps)
};

MATH.airDensityAtAlt = function(alt) {
	return MATH.valueFromCurve(alt, curves.densityByAlt) * 1.0;
};


MATH.curveSigmoid = function(t) {
	return 1 / (1 + Math.exp(6 - t*12));
};

MATH.curveSigmoidInverted = function(t) {
	return 1-MATH.curveSigmoidMirrored(t);
}

MATH.curveEdge = function(t) {
	return MATH.curveSin(t) * 0.5 + t * 0.5;
};

MATH.curveLinear = function(t) {
	return t;
};

MATH.curveSin = function(t) {
	return Math.sin(t*MATH.HALF_PI);
};

MATH.curveCos = function(t) {
	return 1-Math.cos(t*MATH.HALF_PI);
};

MATH.curveSigmoidMirrored = function(value) {
	return MATH.curveSigmoid(Math.abs(value)) * MATH.sign(value)
};

MATH.curveSqrt = function(value) {
	return Math.sqrt(Math.abs(value)) * MATH.sign(value)
};

MATH.curveQuad = function(value) {
	return value*Math.abs(value)
};

MATH.curveParabola = function(value) {
	return MATH.curveQuad( (2 * (value -0.5)) )
}

MATH.curveParabolaInverted = function(value) {
	return 1 - MATH.curveParabola(value);
}

MATH.curveCube = function(value) {
	return value*value*value
};


MATH.CurveState = function(curve, amplitude) {
	this.curve = curve || curves.oneToZero;
	this.amplitude = amplitude || 1;
	this.fraction = 0;
	this.value = 0

	this.setAmplitude = function(value) {
		this.amplitude = value;
	}.bind(this);

	this.setCurve = function(curve) {
		this.curve = curve;
	}.bind(this);

	this.amplitudeFromFraction = function(fraction) {
		this.fraction = fraction;
		this.value = MATH.valueFromCurve(this.fraction * (this.curve.length-1), this.curve);
		return this.amplitude*this.value;
	}.bind(this);

};





MATH.interpolateVec3FromTo = function(startVec3, endVec3, fraction, storeVec3, mathCurveFuction) {
	if (!calcVec1) calcVec1 = new Vector3();
	calcVec1.copy(endVec3);
	calcVec1.sub(startVec3);
	if (typeof(mathCurveFuction) === 'string') {
		fraction = MATH[mathCurveFuction](fraction);
	}
	calcVec1.multiplyScalar(fraction);
	calcVec1.add(startVec3);
	storeVec3.copy(calcVec1);

};

MATH.interpolateFromTo = function(start, end, fraction) {
	return start + (end-start)*fraction;
};


MATH.calcFraction = function(start, end, current) {
	if (start === end) {
		return 1;
	}
	return (current-start) / (end-start);
};


MATH.valueIsBetween = function(value, min, max) {
	return value >= min && value <= max
};



MATH.bigSafeValue = function() {
	return bigSafeValue;
};

MATH.safeInt = function(value) {
	if (isNaN(value)) return 0;
	return MATH.clamp(value, -bigSafeValue, bigSafeValue);
};


MATH.randomVector = function(vec) {
	if (!tempRandVec) tempRandVec =  new Vector3()
	if (!vec) vec=tempRandVec;
	vec.x = MATH.randomBetween(-1, 1);
	vec.y = MATH.randomBetween(-1, 1);
	vec.z = MATH.randomBetween(-1, 1);
	vec.normalize();
	return vec;
};

MATH.sillyRandomVector = function(seed) {
	let vec = calcVec;
	vec.x = MATH.sillyRandomBetween(-1, 1, seed+3);
	vec.y = MATH.sillyRandomBetween(-1, 1, seed+5);
	vec.z = MATH.sillyRandomBetween(-1, 1, seed+7);
	return vec;
};


MATH.safeForceVector = function(vec) {
	vec.x = MATH.safeInt(vec.x);
	vec.y = MATH.safeInt(vec.y);
	vec.z = MATH.safeInt(vec.z);
};

MATH.remainder = function(float) {
	return float - Math.floor(float);
};

MATH.randomBetween = function(min, max) {
	return min + Math.random() * (max-min);
};

MATH.nearestHigherPowerOfTwo = function (value) {
	return Math.floor(Math.pow(2, Math.ceil(Math.log(value) / Math.log(2))));
};

MATH.getInterpolatedInCurveAboveIndex = function(value, curve, index) {
	return curve[index][1] + (value - curve[index][0]) / (curve[index+1][0] - curve[index][0])*(curve[index+1][1]-curve[index][1]);
};


MATH.triangleArea = function (t1, t2, t3) {
	return Math.abs(t1.x * t2.y + t2.x * t3.y + t3.x * t1.y
		- t2.y * t3.x - t3.y * t1.x - t1.y * t2.x) / 2;
};


MATH.barycentricInterpolation = function (t1, t2, t3, p) {
	let t1Area = MATH.triangleArea(t2, t3, p);
	let t2Area = MATH.triangleArea(t1, t3, p);
	let t3Area = MATH.triangleArea(t1, t2, p);

	// assuming the point is inside the triangle
	let totalArea = t1Area + t2Area + t3Area;
	if (!totalArea) {

		if (p[0] === t1[0] && p[2] === t1[2]) {
			return t1;
		} else if (p[0] === t2[0] && p[2] === t2[2]) {
			return t2;
		} else if (p[0] === t3[0] && p[2] === t3[2]) {
			return t3;
		}
	}

	p.z = (t1Area * t1.z + t2Area * t2.z + t3Area * t3.z) / totalArea;
	return p
};

MATH.getAt = function(array1d, segments, x, y) {

	var yFactor = (y) * (segments+1);

	let idx = (yFactor + x);
//    console.log(y, yFactor, xFactor, idx);
	return array1d[idx]
};


MATH.getTriangleAt = function(array1d, segments, x, y) {

	let xc = Math.ceil(x);
	let xf = Math.floor(x);
	let yc = Math.ceil(y);
	let yf = Math.floor(y);

	let fracX = x - xf;
	let fracY = y - yf;



	p1.x = xf;
	p1.y = yc;

	//   console.log(xf, yc);
	p1.z = MATH.getAt(array1d, segments, xf, yc);


	setTri(p1, xf, yc, MATH.getAt(array1d, segments,xf, yc));
	setTri(p2, xc, yf, MATH.getAt(array1d, segments,xc, yf));


	if (fracX < 1-fracY) {
		setTri(p3,xf,yf,MATH.getAt(array1d, segments,xf, yf));
	} else {
		setTri(p3, xc, yc, MATH.getAt(array1d, segments,xc, yc));
	}

	points[0] = p1;
	points[1] = p2;
	points[2] = p3;
	return points;
};

MATH.valueFromCurve = function(value, curve) {
	for (i = 0; i < curve.length; i++) {
		if (!curve[i+1]) {
			//	console.log("Curve out end value", value, curve.length-1, curve[curve.length-1][1]);
			return curve[curve.length-1][1];
		}
		if (curve[i+1][0] >= value) return MATH.getInterpolatedInCurveAboveIndex(value, curve, i)
	}
	console.log("Curve out of bounds", curve.length-1 , value);
	return curve[curve.length-1][1];
};

MATH.blendArray = function(from, to, frac, store) {
	for (i = 0; i < store.length; i++) {
		store[i] = (1-frac)*from[i] + frac*to[i];
	}
};

MATH.decimalify = function(value, scale) {
	return Math.round(value*scale) / scale;
};

MATH.decimalifyVec3 = function(vec3, scale) {
	vec3.x = MATH.decimalify(vec3.x, scale);
	vec3.y = MATH.decimalify(vec3.y, scale);
	vec3.z = MATH.decimalify(vec3.z, scale);
}


MATH.sphereDisplacement = function(radius, depth) {
	if (depth < radius) return 0;
	if (depth > radius*2) depth = radius*2;
	return  1/3 * Math.PI * depth*depth * (3*radius-depth)
};

MATH.curveBlendArray = function(value, curve, from, to, store) {
	blend = MATH.valueFromCurve(value, curve);
	MATH.blendArray(from, to, blend, store);
};

MATH.moduloPositive = function (value, size) {
	var wrappedValue = value % size;
	wrappedValue += wrappedValue < 0 ? size : 0;
	return wrappedValue;
};

MATH.modulo = function (value, limit) {
	return value % limit;
};

MATH.nearestAngle = function(angle) {
	if (angle > Math.PI) {
		angle -= MATH.TWO_PI;
	} else if (angle < 0) {
		angle += MATH.TWO_PI;
	}
	return angle;
};

MATH.lineDistance = function(fromX, fromY, toX, toY) {
	return Math.sqrt((fromX - toX)*(fromX - toX) + (fromY - toY)*(fromY - toY));
};

MATH.sillyRandom = function(seed) {
//	let s = Math.abs((1 / (seed+0.01)) * 99.1123134 + 0.0001 )+0.00000121 //(Math.sin(seed*999)))*999.987654321+0.00012341041234
//	return MATH.remainder(s)
	 return MATH.remainder(Math.abs(Math.sin(seed*7.131) * 99.151 + Math.cos(seed*0.0152)));
};

MATH.sillyRandomBetween = function(min, max, seed) {
	return MATH.sillyRandom(seed)*(max-min) + min;
};

MATH.randomRotateObj = function(obj3d, rotArray, seed) {
	obj3d.rotateX((MATH.sillyRandom(seed)-0.5) * rotArray[0] * 2)
	obj3d.rotateY((MATH.sillyRandom(seed+1)-0.5) * rotArray[1] *2)
	obj3d.rotateZ((MATH.sillyRandom(seed+2)-0.5) * rotArray[2] *2)
}

MATH.rotateObj = function(obj3d, rotArray) {
	obj3d.rotateX(rotArray[0])
	obj3d.rotateY(rotArray[1])
	obj3d.rotateZ(rotArray[2])
}

MATH.angleInsideCircle = function(angle) {
	if (angle < -Math.PI) {
		angle+= MATH.TWO_PI;
	} else if (angle > Math.PI) {
		angle-= MATH.TWO_PI;
	}
	return angle;
};

let zeroes = '00000000000000'
let subS = [];

MATH.numberToDigits = function(current, digits, min) {
	progString = ''
	if (typeof(digits) === 'number') {
		if (digits === 0) {
			progString += Math.round(current);
		} else {
			progString+=current;
			subS = progString.split('.')
			progString = subS[0]+'.';
			if (subS.length === 1) {
				subS.push(zeroes)
			}
			for (let i = 0; i < digits; i++) {
				progString += subS[1][i] || 0;
			}
		}
	} else {
		progString = ''+current;
	}

	return progString;
};

MATH.wrapValue = function(wrapRange, value) {
	return MATH.clamp((wrapRange+value) % wrapRange, 0, wrapRange)-wrapRange*0.5;
};

MATH.subAngles = function(a, b) {
	return Math.atan2(Math.sin(a-b), Math.cos(a-b));
};

MATH.radialLerp = function(a, b, w) {
	var cs = (1-w)*Math.cos(a) + w*Math.cos(b);
	var sn = (1-w)*Math.sin(a) + w*Math.sin(b);
	return Math.atan2(sn,cs);
};

MATH.addAngles = function(a, b) {
	return Math.atan2(Math.sin(a+b), Math.cos(a+b));
};


MATH.radialToVectorXY = function(angle, distance, store) {
	store.x = Math.cos(angle)*distance;
	store.y = Math.sin(angle)*distance;
};

MATH.spreadVector = function(vec, spreadV) {
	vec.x += spreadV.x * (Math.random()-0.5);
	vec.y += spreadV.y * (Math.random()-0.5);
	vec.z += spreadV.z * (Math.random()-0.5);
};

MATH.distanceBetween = function(vec3a, vec3b) {
	calcVec1.subVectors(vec3a, vec3b);
	return calcVec1.length();
}

MATH.lerpClamped = function(targetVec3, towardsVec3, alpha, min, max) {
	targetVec3.lerp(towardsVec3, MATH.clamp(alpha, min || -1, max || 1))
}

MATH.expandVector = function(vec, expand) {
	vec.x += expand*Math.sign(vec.x);
	vec.y += expand*Math.sign(vec.y);
	vec.z += expand*Math.sign(vec.z);
};

MATH.vec3ToArray = function(vec3, array, scale) {
	if (typeof (scale) === 'number') {
		array[0] = this.decimalify(vec3.x, scale);
		array[1] = this.decimalify(vec3.y, scale);
		array[2] = this.decimalify(vec3.z, scale);
	} else {
		array[0] = vec3.x;
		array[1] = vec3.y;
		array[2] = vec3.z;
	}

	return array;
}

MATH.vec3FromArray = function(vec3, array) {
	if (!vec3) vec3 = new Vector3();
		vec3.x = array[0];
		vec3.y = array[1];
		vec3.z = array[2];
	return vec3;
}

MATH.quatFromRotArray = function(rot) {
	this.rotXYZFromArray(tempObj, rot);
	return tempObj.quaternion;
}

MATH.rotXYZFromArray = function(obj3d, rot) {
	obj3d.quaternion.set(0, 0, 0, 1);
	obj3d.rotateX(rot[0]);
	obj3d.rotateY(rot[1]);
	obj3d.rotateZ(rot[2]);
}

MATH.rotObj3dToArray = function(obj3d, array, scale) {
	array[0] = this.decimalify(obj3d.rotation.x, scale || 10000);
	array[1] = this.decimalify(obj3d.rotation.y, scale || 10000);
	array[2] = this.decimalify(obj3d.rotation.z, scale || 10000);
}

MATH.vectorYZToAngleAxisX = function(vec) {
	return Math.atan2(vec.y, vec.z);
};

MATH.vectorXZToAngleAxisY = function(vec) {
	return Math.atan2(vec.x, vec.z);
};

MATH.vectorXYToAngleAxisZ = function(vec) {
	return -Math.atan2(vec.x, vec.y);
};

MATH.angleXFromVectorToVector = function(fromVec, toVec) {
	return Math.atan2(toVec.z-fromVec.z, toVec.y-fromVec.y) // + Math.PI*0.5;
};


MATH.angleYFromVectorToVector = function(fromVec, toVec) {
	return Math.atan2(toVec.z-fromVec.z, toVec.x-fromVec.x) // + Math.PI*0.5;
};

MATH.angleZFromVectorToVector = function(fromVec, toVec) {
	return Math.atan2(toVec.y-fromVec.y, toVec.x-fromVec.x) // + Math.PI*0.5;
};


MATH.applyNormalVectorToPitch = function(normalVec, upVec) {
	upVec.setX(MATH.subAngles(upVec.getX() - normalVec.getX()));
};

MATH.applyNormalVectorToRoll = function(normalVec, tiltVec) {
	tiltVec.setZ(MATH.subAngles(tiltVec.getZ(), normalVec.getZ()));
};


MATH.radialClamp = function(value, min, max) {

	var zero = (min + max)/2 + ((max > min) ? Math.PI : 0);
	var _value = MATH.moduloPositive(value - zero, MATH.TWO_PI);
	var _min = MATH.moduloPositive(min - zero, MATH.TWO_PI);
	var _max = MATH.moduloPositive(max - zero, MATH.TWO_PI);

	if (value < 0 && min > 0) { min -= MATH.TWO_PI; }
	else if (value > 0 && min < 0) { min += MATH.TWO_PI; }
	if (value > MATH.TWO_PI && max < MATH.TWO_PI) { max += MATH.TWO_PI; }

	return _value < _min ? min : _value > _max ? max : value;
};

MATH.clamp = function(value, min, max) {
	return value < min ? min : value > max ? max : value;
};

MATH.clampVectorXZ = function(vector3, minX, maxX, minZ, maxZ) {
	vector3.x = MATH.clamp(vector3.x, minX, maxX);
	vector3.z = MATH.clamp(vector3.z, minZ, maxZ);
}

MATH.clampVectorXY = function(vector3, minX, maxX, minY, maxY) {
	vector3.x = MATH.clamp(vector3.x, minX, maxX);
	vector3.y = MATH.clamp(vector3.y, minY, maxY);
}

MATH.expand = function(value, min, max) {
	if (value > min && value < max) {
		return min;
	}
	return value;
};


MATH.pitchFromQuaternion = function(q) {
	mag = Math.sqrt(q.w*q.w + q.x*q.x);
	return 2*Math.acos(q.x / mag)-Math.PI;
};

MATH.pitchFromQuaternion2 = function(q) {
	mag = Math.sqrt(q.w*q.w + q.x*q.x);
	return 2*Math.asin(q.x / mag) // -Math.PI;
};

MATH.pitchFromQuaternion3 = function(q) {
	mag = Math.sqrt(q.w*q.w + q.x*q.x);
	return 2*Math.acos(q.x / mag) // -Math.PI;
};

MATH.yawFromQuaternion = function(q) {
	mag = Math.sqrt(q.w*q.w + q.y*q.y);
	return 2*Math.acos(q.y / mag)-Math.PI;
};

MATH.pitchFromBodyObj3d = function(obj3d) {
	calcVec.set(0, 0, 1);
	let q = obj3d.quaternion;
	calcVec.applyQuaternion(q);
	return Math.sin(-calcVec.y) // MATH.HALF_PI;
}

MATH.rollFromQuaternion = function(q) {
	mag = Math.sqrt(q.w*q.w + q.z*q.z);
	return (2*Math.acos(q.z / mag)-Math.PI);
};


MATH.horizonAttitudeFromQuaternion = function(q) {
	calcVec.set(0, 0, 1);
	calcVec.applyQuaternion(q);
	return calcVec.y * Math.PI // Math.atan2(calcVec.x, calcVec.y);
};

MATH.gAttitudeFromQuaternion = function(quaternion) {
	return MATH.eulerFromQuaternion(quaternion, 'YZX').x;
};

MATH.compassAttitudeFromQuaternion = function(q) {
	calcVec.set(0, 0, 1);
	calcVec.applyQuaternion(q);
	return MATH.vectorXZToAngleAxisY(calcVec)
};

MATH.rollAttitudeFromQuaternion = function(q) {
	let rotation = MATH.eulerFromQuaternion(q, "YXZ");
	return -rotation.z
};

MATH.eulerFromQuaternion = function(q, order) {
	return euler.setFromQuaternion(q, order);
}

MATH.copyArrayValues = function(from, to) {
	this.emptyArray(to);
	for (let i = 0; i < from.length; i++) {
		to[i] = from[i];
	}
	return to;
}

MATH.copyArray = function(from, to) {
	for (let i = 0; i < from.length; i++) {
		let value = MATH.copyValues(from[i], to[i])
		if (value !== null) {
			to[i] = value;
		}

	}
}

MATH.copyValues = function(from, to) {
	if (typeof (from.length) === 'number') {
		if (typeof (to.length) !== 'number') {
			to = []
		}
		MATH.copyArray(from, to)
		return null;
	} else {
		return from;
	}
}

MATH.copyObjectValues = function(from, to) {
	for (let key in from) {
		to[key] = from[key];
	}
}


MATH.deepClone = function(source) {
	const deepClone = obj => {
		if (obj === null) return null;
		let clone = Object.assign({}, obj);
		Object.keys(clone).forEach(
			key =>
				(clone[key] =
					typeof obj[key] === 'object' ? deepClone(obj[key]) : obj[key])
		);
		if (Array.isArray(obj)) {
			clone.length = obj.length;
			return Array.from(clone);
		}
		return clone;
	};

	return deepClone(source); // a !== b, a.obj !== b.obj
}

MATH.stupidChecksumArray = function(arr) {

	let sum = 0;

	if (!arr) {
		return -1;
	}

	let step = 0;
	let addLevel = function(array) {
		step++;
		if (typeof (array) === 'undefined') {
			sum += 0.1 + step*0.1;
			return;
		}
		if (typeof (array) !== 'object') {
			if (array.length) {
				sum+=array.length*step;
			} else {
				if (typeof (array) === 'number') {
					sum += array*step;
				}
			}
		} else {
			for (let i = 0; i < array.length; i++) {
				step++;
				if (typeof (array[i].length) === 'number') {
					sum+=array[i].length*step;
					if (typeof (array[i] === 'string')) {
						sum += i*step + array[i].length*step;
					} else {
						addLevel(array[i])
					}
				} else {
					if (typeof (array[i] === 'number')) {
						sum += array[i]*step;
					}
				}
			}
		}
	}

	addLevel(arr);

	return sum;
}

MATH.copyRGBA = function(from, to) {
	to.r = from.r;
	to.g = from.g;
	to.b = from.b;
	to.a = from.a;
	return to;
}

MATH.compareQuaternions = function(a, b) {
	return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) + Math.abs(a.z-b.z) + Math.abs(a.w-b.w)
}

MATH.testVec3ForNaN = function(vec3) {
	if (isNaN(vec3.x) || isNaN(vec3.y) || isNaN(vec3.z)) {
		console.log("Spatial Vec3 is NaN.. investigate!")
		vec3.x = 0;
		vec3.y = 0;
		vec3.z = 0
		return true;
	}
}

MATH.hexToRGB = function(hex, store, max) {
	store[0] = parseInt(hex.slice(1, 3), 16)*max/256;
	store[1] = parseInt(hex.slice(3, 5), 16)*max/256;
	store[2] = parseInt(hex.slice(5, 7), 16)*max/256;
}

MATH.rgbToHex = function(r, g, b) {
	return "#" + (1 << 24 | r*255 << 16 | g*255 << 8 | b*255).toString(16).slice(1);
}

MATH.rgbaFromArray= function(array) {
	return 'rgba('+Math.floor(array[0]*255)+','+Math.floor(array[1]*255)+','+Math.floor(array[2]*255)+', '+array[3]+')';
}

MATH.rgbaFromXYZW= function(values) {
	return 'rgba('+Math.floor(values.x*255)+','+Math.floor(values.y*255)+','+Math.floor(values.z*255)+', '+values.w+')';
}


MATH.fitBoxAround = function(box, min, max) {

	if (box.min.x > min.x) {
		box.min.x = min.x;
	}

	if (box.min.y > min.y) {
		box.min.y = min.y;
	}

	if (box.min.z > min.z) {
		box.min.z = min.z;
	}

	if (box.max.x < max.x) {
		box.max.x = max.x;
	}
	if (box.max.y < max.y) {
		box.max.y = max.y;
	}

	if (box.max.z < max.z) {
		box.max.z = max.z;
	}
}



MATH.sillyRandomPointInBox = function(box, seed) {
	calcVec1.copy(box.max)
	calcVec1.sub(box.min);
	let rnd = MATH.sillyRandomVector(seed);
	calcVec1.multiply(rnd);
	calcVec1.add(box.min);
	return calcVec1;
}


MATH.planePointsBetweenVectors = function(a, b) {
	let xDiff = Math.abs(a.x - b.x);
	let zDiff = Math.abs(a.z - b.z);
	if (xDiff > zDiff) {
		return xDiff;
	} else {
		return zDiff;
	}
}

MATH.roundVectorPlane = function(sourceVec, targetVec, resolution) {
	targetVec.set(Math.round(sourceVec.x/resolution)*resolution, sourceVec.y, Math.round(sourceVec.z/resolution)*resolution)
}

MATH.fitUpdateRect = function(source, target) {
	if (source.minX < target.minX) {
		target.minX = source.minX;
	}

	if (source.minY < target.minY) {
		target.minY = source.minY;
	}

	if (source.maxX > target.maxX) {
		target.maxX = source.maxX;
	}

	if (source.maxY > target.maxY) {
		target.maxY = source.maxY;
	}
}

MATH.clearUpdateRect = function(updateRect) {
	updateRect.minX = 99999;
	updateRect.minY = 99999;
	updateRect.maxX = 0;
	updateRect.maxY = 0;
}

MATH.jsonCopy = function(obj) {
	return JSON.parse(JSON.stringify(obj))
}

MATH.aoaXFromVelAndUp = function(vel, rot) {
	let velAngX = MATH.vectorYZToAngleAxisX(vel)
	let rotAngX = MATH.vectorYZToAngleAxisX(rot)
	calcVec.crossVectors(vel, rot);
	return calcVec.x*Math.PI + Math.PI;
	return MATH.angleInsideCircle(MATH.subAngles(rotAngX, velAngX) + Math.PI);
}

MATH.aoaYFromVelAndUp = function(vel, rot) {
	let velAngY = MATH.vectorXZToAngleAxisY(vel)
	let rotAngY = MATH.vectorXZToAngleAxisY(rot)
	return MATH.angleInsideCircle(MATH.subAngles(rotAngY, velAngY ));
}

MATH.curvePow = function(value, power) {
	const sign = Math.sign(value);
	return Math.pow(Math.abs(value), power)*sign;

}

MATH.curveLift = function(AoA) {
	let sinVal = Math.sin(AoA )
	const nonStallFactor = MATH.curvePow(sinVal, 0.95)  // * 0.5s + sinVal * Math.abs(Math.cos(AoA*0.5)) * 0.5
//	const stallFactor = MATH.curveSigmoidMirrored(AoA / 3.142)
	return nonStallFactor * 22 - MATH.curvePow(sinVal, 1.04)*22 + MATH.curvePow(sinVal, 4.2) * 1.0;
}

MATH.transformToLocalSpace = function(trx, rootTrx, store) {
	tempObj.quaternion.copy(rootTrx.quaternion);
	tempObj.quaternion.invert();
	store.position.copy(trx.position);
	store.position.sub(rootTrx.position);
	store.position.applyQuaternion(tempObj.quaternion);

	store.quaternion.copy(tempObj.quaternion);
	store.quaternion.multiply(trx.quaternion);

}

MATH.addToTorqueVec = function(forceVec3, posOffset, torque) {
	calcVec.crossVectors(forceVec3, posOffset);
	torque.add(calcVec);
}

MATH.subQuaternions = function(quatA, quatB, store) {
	tempObj.quaternion.copy(quatA);
	store.multiplyQuaternions(quatB, tempObj.quaternion.conjugate());
}

export { MATH }