import {LineRenderer} from "./LineRenderer.js";
import {Vector3} from "../../../../../libs/three/Three.Core.js";


let tempVec = new Vector3();
let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let tempVec4 = new Vector3();

class LineRenderSystem {
	constructor() {


		this.isActive = false;

		this.colors = {
			WHITE 	: new Vector3(1, 1, 1),
			GREY 	: new Vector3(0.5, 0.5, 0.5),
			PINK 	: new Vector3(1, 0.6, 0.6),
			RED 	: new Vector3(1, 0, 0),
			PURPLE 	: new Vector3(1, 0.5, 1),
			GREEN	: new Vector3(0, 1, 0),
			PEA 	: new Vector3(0.5, 1, 0.5),
			BLUE 	: new Vector3(0, 0, 1),
			AQUA 	: new Vector3(0, 1, 2),
			CYAN 	: new Vector3(0.5, 1, 1),
			MAGENTA : new Vector3(1, 0, 1),
			DARKPURP: new Vector3(0.55, 0, 0.55),
			YELLOW 	: new Vector3(1, 1, 0.4),
			ORANGE 	: new Vector3(1, 0.8, 0.3),
			BLACK 	: new Vector3(0, 0, 0)
		};

		this._lineRenderers = [];

		this._lineRenderers.push(new LineRenderer());

		this.start = new Vector3();
		this.end = new Vector3();
		this.tmpVec1 = new Vector3();
		this.tmpVec2 = new Vector3();
		this.tmpVec3 = new Vector3();

		this.axis = ['x', 'y', 'z'];

	}
	color = function(color) {
		return this.colors[color];
	};

	drawLine = function (start, end, color) {
		let lineRenderer = this._lineRenderers[0];

		lineRenderer._addLine(start, end, color);
	};


	_drawAxisLine = function (start, startEndDelta, startDataIndex, endDataIndex, startPolarity, endPolarity, color, quat) {
		let startAxis = this.axis[startDataIndex];
		let endAxis = this.axis[endDataIndex];

		let lineStart = this.tmpVec2.copy(start);
		lineStart[startAxis] += startEndDelta[startAxis] * startPolarity;

		let lineEnd = this.tmpVec3.copy(lineStart);
		lineEnd[endAxis] += startEndDelta[endAxis] * endPolarity;


		if (quat !== undefined) {

			let distance = MATH.distanceBetween(lineStart, lineEnd);

			tempVec.subVectors(lineEnd, lineStart);
			tempVec.normalize();
			tempVec4.copy(tempVec);

		//    tempVec.multiplyScalar(0.5);

			tempVec2.copy(lineStart);

			tempVec2.add(tempVec);
			tempVec.applyQuaternion(quat);
			tempVec.multiplyScalar(distance);
			tempVec3.addVectors(tempVec2, tempVec);
			tempVec2.sub(tempVec)
		//


			this.drawLine(tempVec2, tempVec3, color);
		} else {
			this.drawLine(lineStart, lineEnd, color);
		}

	};

	/**
	 * Draws an axis aligned box between the min and max points, can be transformed to a specific space using the matrix.
	 * @param {Vector3} min
	 * @param {Vector3} max
	 * @param {Vector3} color A vector with its components between 0-1.
	 * @param {Matrix4} [transformMatrix]
	 */
	drawAABox = function (min, max, color, quat) {
		let diff = this.tmpVec1.copy(max).sub(min);

		for (let a = 0; a < 3; a++) {
			for (let b = 0; b < 3; b++) {
				if (b !== a) {
					this._drawAxisLine(min, diff, a, b, 1, 1, color, quat);
				}
			}

			this._drawAxisLine(max, diff, a, a, -1, 1, color, quat);
			this._drawAxisLine(min, diff, a, a, 1, -1, color, quat);
		}
	};

	/**
	 * Draws a cross at a position with the given color and size.
	 * @param {Vector3} position
	 * @param {Vector3} color A vector with its components between 0-1.
	 * @param {number} [size=0.05]
	 */
	drawCross = function (position, color, size) {
		size = size || 0.05;

		this.start.x = position.x - size;
		this.start.y = position.y;
		this.start.z = position.z - size;
		this.end.x = position.x + size;
		this.end.y = position.y;
		this.end.z = position.z + size;

		this.drawLine(this.start, this.end, color);

		this.start.x = position.x + size;
		this.start.y = position.y;
		this.start.z = position.z - size;
		this.end.x = position.x - size;
		this.end.y = position.y;
		this.end.z = position.z + size;

		this.drawLine(this.start, this.end, color);

		this.start.x = position.x;
		this.start.y = position.y - size;
		this.start.z = position.z;
		this.end.x = position.x;
		this.end.y = position.y + size;
		this.end.z = position.z;

		this.drawLine(this.start, this.end, color);
	};

	activate = function() {
		if (!this.isActive) {
		for (let i = 0; i < this._lineRenderers.length; i++) {
			let lineRenderer = this._lineRenderers[i];
			ThreeAPI.addToScene( lineRenderer.line );
		}
		this.isActive = true;
	}}

	render = function () {
		for (let i = 0; i < this._lineRenderers.length; i++) {
			let lineRenderer = this._lineRenderers[i];
			if (!lineRenderer._numRenderingLines) {
				ThreeAPI.getScene().remove( lineRenderer.line );
			} else {
				ThreeAPI.addToScene( lineRenderer.line );
			}
			lineRenderer._clear();
		}
	};

	_pause = function () {
		for (let i = 0; i < this._lineRenderers.length; i++) {
			let lineRenderer = this._lineRenderers[i];
			lineRenderer._pause();
		}
	};


	clear = function () {
		for (let i = 0; i < this._lineRenderers.length; i++) {
			let lineRenderer = this._lineRenderers[i];
			lineRenderer._remove();
		}
		delete this._lineRenderers;
	};

}

export { LineRenderSystem }
