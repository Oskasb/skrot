import {Vector3} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../../application/MATH.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";

class PieceSurface {
    constructor(pointName, json) {
        this.status = new SimpleStatus()
        this.id = pointName;
        this.json = json;
        this.size = json.size;
        this.scale = new Vector3();
        MATH.vec3FromArray(this.scale, this.size);
    }

    setStatusKey(key, value) {
        this.status.setStatusKey(key, value);
    }

    getStatus(key) {
        return this.status.getStatus(key);
    }

}

export { PieceSurface };