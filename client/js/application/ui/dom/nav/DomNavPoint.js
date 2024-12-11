import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

class DomNavPoint {
    constructor() {

        let obj3d = new Object3D();

        let camPos = new Vector3();
        let playerPos = new Vector3();

        let config = null;

        this.isActive = false;

        this.onClickFunc = function() {
            console.log("clickFunc not set");
        }

        function getPos() {
            return obj3d.position;
        }

        function applyConfig(cfg) {

            if (typeof (cfg['pos']) === 'undefined') {
                getPos = function() {
                    return null;
                };
            } else {
                MATH.vec3FromArray(camPos, cfg['cam']);
                MATH.vec3FromArray(playerPos, cfg['player']);
                MATH.vec3FromArray(getPos(), cfg['pos']);
                camPos.add(getPos());
                playerPos.add(getPos());
            }


            config = cfg;
        }

        function getCamPos() {
            return camPos;
        }

        function getPlayerPos() {
            return playerPos;
        }

        function getLabel() {
            return config['name']
        }

        function getId() {
            return config['id']
        }

        this.call = {
            applyConfig:applyConfig,
            getPos:getPos,
            getPlayerPos:getPlayerPos,
            getLabel:getLabel,
            getId:getId,
            getCamPos:getCamPos
        }

    }

    getPos() {
        return this.call.getPos();
    }

    getLabel() {
        return this.call.getLabel();
    }

}

export { DomNavPoint }