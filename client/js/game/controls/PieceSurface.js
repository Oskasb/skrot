import {Vector3} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../../application/MATH.js";

class PieceSurface {
    constructor(pointName, json) {
        this.id = pointName;
        this.json = json;
        this.size = json.size;
        this.scale = new Vector3();
        MATH.vec3FromArray(this.scale, this.size);
    }

}

export { PieceSurface };