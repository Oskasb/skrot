let jointCalls = {};

function addValueToObjRotAxis(value, obj3d, axis) {
    console.log("addValueToObjRotAxis", axis, obj3d, value)

}

function setObjAxisRotation(value, obj3d, axis) {
    //  console.log(axis, obj3d, value)
    // let from = obj3d.rotation[axis];
    //  let to = from + value;
    obj3d.quaternion.copy(obj3d.userData.bindPoseObj3D.quaternion)
    obj3d[axis](value);
}

jointCalls["applyBoneRotation"] = function(args) {
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