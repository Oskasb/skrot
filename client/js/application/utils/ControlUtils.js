import {getFrame} from "./DataUtils.js";
import {Vector3} from "../../../../libs/three/Three.Core.js";

let jointCalls = {};

let tempEvt = {
    color:'GREEN',
    from:new Vector3(),
    to:new Vector3(),
    size:0,
    pos:new Vector3()
}

function addValueToObjRotAxis(value, obj3d, axis) {
    console.log("addValueToObjRotAxis", axis, obj3d, value)
}

function setObjAxisRotation(value, obj3d, axis) {
    obj3d[axis](value);
}

function setObjUniformScale(value, obj3d, args) {

    let min = args.min || 0;
    let max = args.max || 1;
    let range = max-min;
    let scale = min + value*range;
    obj3d.scale.set(scale, scale, scale);
}

jointCalls["applyBoneScale"] = function(bone, args, value, factor) {
    setObjUniformScale(value*factor, bone, args)
}

jointCalls["applyBoneRotation"] = function(bone, args, value, factor) {
    if (typeof (args) === "string") {
        addValueToObjRotAxis(value*factor, bone, args)
    } else {
        for (let i = 0; i < args.length; i++) {
            let axis = args[i];
            addValueToObjRotAxis(value*factor, bone, axis)
        }
    }
}

jointCalls["setBoneRotation"] = function(bone, args, value, factor) {
    if (typeof (args) === "string") {
        setObjAxisRotation(value*factor, bone, args)
    } else {
        for (let i = 0; i < args.length; i++) {
            let axis = args[i];
            setObjAxisRotation(value*factor, bone, axis)
        }
    }
}

export {
    jointCalls
}