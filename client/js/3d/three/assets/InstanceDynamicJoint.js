class InstanceDynamicJoint {
    constructor(bone, instancedModel) {
        this.tempVec1 = new THREE.Vector3();
        this.bone = bone;
        this.instancedModel = instancedModel;
        this.obj3d = new THREE.Object3D();
        this.offsetObj3d = new THREE.Object3D();
    }


        setJointEnum = function(jointEnum) {
            this.jointEnum = jointEnum
        };

        getOffsetObj3D = function() {
            return this.offsetObj3d;
        };

        stickToBoneWorldMatrix = function() {

            if (isNaN(this.obj3d.position.x)) {
                this.obj3d.position.set(0, 0, 0)
                this.obj3d.scale.set(1, 1, 1);
                this.obj3d.quaternion.set(0, 0, 0, 1);

                console.log("Bad dynJoint pre")
                //   return;
            }

            if (isNaN(this.bone.matrix[0])) {
                // this happens... needs a fix - likely from some null pointer in animation data?
            //    console.log("Bad dynJoint matrixWorld", this.bone, this.obj3d)
            //    this.bone.matrixWorld.identity()
            //    this.bone.matrix.identity()
            //    return;
            }

            this.bone.matrixWorld.decompose(this.obj3d.position, this.obj3d.quaternion, this.obj3d.scale);

            if (isNaN(this.obj3d.position.x)) {
                this.bone.matrix.identity()
             //   console.log("Bad dynJoint post", this.bone, this.obj3d)

                this.obj3d.position.set(0, 0, 0)
                this.obj3d.scale.set(1, 1, 1);
                this.obj3d.quaternion.set(0, 0, 0, 1);

                return;
            }


            this.tempVec1.copy(this.offsetObj3d.position);

            if (this.offsetObj3d.position.lengthSq()) {
                this.tempVec1.applyQuaternion(this.obj3d.quaternion);
                this.obj3d.position.add(this.tempVec1);
            }

            this.tempVec1.setFromMatrixScale(this.bone.matrixWorld);
            this.obj3d.scale.divide(this.tempVec1);
            this.obj3d.scale.multiply(this.offsetObj3d.scale);
            this.obj3d.quaternion.multiply(this.offsetObj3d.quaternion);

            if (this.obj3d.scale.length() > 10) {
                console.log("Bad joint found!", spatObj)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.obj3d.position, color:'RED', size:1})
                this.obj3d.scale.set(1, 1, 1)
            }

            if (isNaN(this.obj3d.position.x)) {
                console.log("Bad dynJoint")
                return;
            }

/*
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: this.obj3d.position, color:'GREEN', size:this.obj3d.scale.length()*0.2})

            let cPos = ThreeAPI.getCameraCursor().getLookAroundPoint();
        //    tempVec.copy(cPos);
        //    tempVec.y += 1.5;
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.obj3d.position, to:cPos, color:'GREEN'});
*/
        };

        updateSpatialFrame = function() {
            if (this.instancedModel.active) {
                this.stickToBoneWorldMatrix()
            }

        };

    };

export { InstanceDynamicJoint };
