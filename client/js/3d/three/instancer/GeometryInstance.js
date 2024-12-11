"use strict";

class GeometryInstance {

    constructor(id, index, insBuffers) {
        this.tempVec1 = new THREE.Vector3();
        this.id = id;
        this.index = index;
        this.instancingBuffers = insBuffers;
        this.baseScale = 1;
        this.obj3d = new THREE.Object3D();
        this.color = new THREE.Color();
        this.alpha = 1;
    };

    setBaseScale(scale) {
        this.baseScale = scale;
        this.setScale(1)
    }

    setAttribXYZ = function (name, x, y, z) {
        this.instancingBuffers.setAttribXYZ(name, this.index, x, y, z)
    };

    setAttribXYZW = function (name, x, y, z, w) {
        this.instancingBuffers.setAttribXYZW(name, this.index, x, y, z, w)
    };

    setVertexColor = function (r, g, b, a) {
        this.alpha = a;
        this.color.r = r;
        this.color.g = g;
        this.color.b = b;
        this.instancingBuffers.setAttribXYZW("vertexColor", this.index, r, g, b, a)
    };

    setPosition = function (position) {
        this.instancingBuffers.setBufferVec3("offset", this.index, position)
    };

    setQuaternion = function (quaternion) {
        this.instancingBuffers.setBufferVec4("orientation", this.index, quaternion)
    };

    setAttributeVec4 = function(attribName, vec4) {
        this.instancingBuffers.setBufferVec4(attribName, this.index, vec4)
    };

    setScale = function (scale) {
        this.obj3d.scale.copy(scale);
        this.tempVec1.x = this.baseScale * this.obj3d.scale.x;
        this.tempVec1.y = this.baseScale * this.obj3d.scale.y;
        this.tempVec1.z = this.baseScale * this.obj3d.scale.z;
        this.instancingBuffers.setBufferVec3("scale3d", this.index, this.tempVec1)
    };

    applyObj3d = function () {
        this.setPosition(this.obj3d.position)
        this.setQuaternion(this.obj3d.quaternion)
        this.setScale(this.obj3d.scale)
    };

    applyObjPos = function () {
        this.setPosition(this.obj3d.position);
    };

    applyObjQuat = function () {
        this.setQuaternion(this.obj3d.quaternion)
    };

    applyObjScale = function () {
        this.setScale(this.obj3d.scale)
    };

    initBuffers = function () {
        this.setVertexColor(1, 1, 1, 1)
    };

    copyAttributesByIndex(index, srcAttributes) {
        this.instancingBuffers.copyBufferAttributesFromTo(index, srcAttributes, this.index);
    }


    showHide = function (bool) {

    };

}

export { GeometryInstance }

