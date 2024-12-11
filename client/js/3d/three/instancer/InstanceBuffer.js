import {InstancedBufferGeometry} from "../../../../libs/three/core/InstancedBufferGeometry.js";
import {BufferAttribute} from "../../../../libs/three/core/BufferAttribute.js";
import {Mesh} from "../../../../libs/three/objects/Mesh.js";
import {InstancedBufferAttribute} from "../../../../libs/three/Three.js";
import {Box3, Sphere} from "../../../../libs/three/Three.js";

let activeGeometries = 0;
let countTotal = 0;

class InstanceBuffer {
    constructor(verts, uvs, indices, normals) {


        this.maxInstanceCount = null;
        this.registeredAttributes = [];
        this.attributes = {};
        this.buffers = {};
        this.buildGeometry(verts, uvs, indices, normals);
        this.isCameraSpace = false;
        this.mesh;
    };


    buildGeometry = function(verts, uvarray, indices, normals) {

        let geometry = new InstancedBufferGeometry();
        geometry.name = 'InstanceBuffer buildGeometry'
        let posBuffer   =     verts;
        let uvBuffer    =     uvarray;

        // per mesh data

        let ninequad = false;

        if (indices.length === 54) {
            ninequad = true;
        }

        if (indices) {
            posBuffer   =      new Float32Array( verts );
            uvBuffer    =      new Float32Array( uvarray );
        } else {
            indices = [];
            for ( let i = 0; i < verts.length / 3; i ++ ) {
                indices[ i ] = i;
            }
        }



        let indexBuffer =   new Uint16Array( indices );
        geometry.setIndex( new BufferAttribute( indexBuffer , 1 ) );

        geometry.index.needsUpdate = true;
        geometry.needsUpdate = true;


            let normal = new BufferAttribute(normals , 3 );
             geometry.setAttribute( 'normal', normal );

        let vertices = new BufferAttribute(posBuffer , 3 );
        geometry.setAttribute( 'position', vertices );
        let uvs = new BufferAttribute( uvBuffer , 2 );
        geometry.setAttribute( 'uv', uvs );

        this.geometry = geometry;

        geometry.boundingSphere = new Sphere();
        geometry.boundingBox = new Box3();

        let mesh = new Mesh(geometry);
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        mesh.userData.ninequad = ninequad;
        //    mesh.scale.set(1, 1, 1);

        mesh.geometry.drawRange.count = indices.length;
        mesh.geometry.maxInstancedCount = 0;
        mesh.needsUpdate = true;
        this.mesh = mesh;

    };

    setRenderOrder = function(order) {
        this.mesh.renderOrder = order;
        this.mesh.needsUpdate = true;

    };

    registerBufferAttribute(attrib, name, count) {
        this.maxInstanceCount = count  * 1;
        let setup = {
            attrib:attrib,
            name:name
        }

        this.registeredAttributes.push(setup)
    }

    activateAttributes(countScale) {
        this.maxInstanceCount = Math.ceil(this.maxInstanceCount * countScale)
        for (let i = 0; i < this.registeredAttributes.length; i++) {
            let setup = this.registeredAttributes[i];

            if (this.attributes[setup.name]) {
                this.updateAttribute(setup.name, setup.attrib.dimensions,  this.maxInstanceCount)

            } else {
                let buffer = this.buildBuffer(setup.attrib.dimensions, this.maxInstanceCount);
                this.attachAttribute(buffer, setup.name, setup.attrib.dimensions, setup.attrib.dynamic)
            }
        }
    }

    buildBuffer = function(dimensions, count) {
        return new Float32Array(count * dimensions);
    };

    updateAttribute = function(name, dimensions, count) {
        let IBAttrib =  this.attributes[name];
        let targetLength = dimensions * count;
        let currentBuffer = IBAttrib.array

        if (currentBuffer.length !== targetLength) {
        //    currentBuffer.resize(targetLength)
            let array = Array.from(currentBuffer);
            array.length = targetLength;
            let arrayBuffer = new Float32Array(array);

            IBAttrib.array = arrayBuffer
        //    this.attributes[name] = new InstancedBufferAttribute(arrayBuffer, dimensions, false)
            this.buffers[name] = arrayBuffer;
        } else {
            console.log("This should not happen")
            //    currentBuffer.resize(targetLength)
        }

    //    this.geometry.removeAttribute(name);



    //    this.attributes[name].setDynamic( dynamic );
        this.attributes[name].needsUpdate = true;
        this.geometry.needsUpdate = true;
    }

    attachAttribute = function(buffer, name, dimensions, dynamic) {

        if (this.attributes[name]) {
        //    console.log("Attrib already registered", name, this.attributes[name])
        //    this.geometry.removeAttribute(name);
        //    this.attributes[name].array = buffer;
        }

            let attribute = new InstancedBufferAttribute(buffer, dimensions, false)
            if (dynamic) {
                console.log('setDynamic expected, not supported so fix..')
                attribute.setDynamic( dynamic );
            }

            this.geometry.setAttribute(name, attribute);
            this.attributes[name] = attribute;


        this.buffers[name] = buffer;
        this.attributes[name].needsUpdate = true;
        this.geometry.needsUpdate = true;
    };

    copyBufferAttributesFromTo(fromIndex, srcAttributes, toIndex) {

        for (let i = 0; i < this.registeredAttributes.length; i++) {
            let setup = this.registeredAttributes[i];
        //    if (this.attributes[setup.name]) {
                let attrib = this.attributes[setup.name];
                let array = attrib.array;

                let srcAttrib = srcAttributes[setup.name];
                let scrArray = srcAttrib.array;

                let fromStartIndex = fromIndex*attrib.itemSize;
                let toStartIndex = toIndex*attrib.itemSize;
                for (let i = 0; i < setup.attrib.dimensions; i++) {
                    array[toStartIndex + i] = scrArray[fromStartIndex +i];
                }

                attrib.needsUpdate = true;

        //    }

        }
    }


    setAttribXYZ = function(name, index, x, y, z) {
        this.attributes[name].setXYZ( index, x, y, z);
        this.attributes[name].needsUpdate = true;
    };

    setAttribXYZW = function(name, index, x, y, z, w) {
        this.attributes[name].setXYZW( index, x, y, z, w);
        this.attributes[name].needsUpdate = true;
    };

    setBufferVec3 = function(name, index, vec3) {
        this.attributes[name].setXYZ( index, vec3.x, vec3.y, vec3.z );
        this.attributes[name].needsUpdate = true;
    };

    setBufferVec4 = function(name, index, vec4) {
        this.attributes[name].setXYZW( index, vec4.x, vec4.y, vec4.z, vec4.w );
        this.attributes[name].needsUpdate = true;
    };

    setBufferValue = function(name, index, value) {
        this.attributes[name].setX( index, value );
        this.attributes[name].needsUpdate = true;
    };

    setMaterial = function(material) {
        this.mesh.material = material;
    };




    setInstancedCount(count) {

        let mesh = this.mesh;

        if (count > this.maxInstanceCount) {

            let expansionIndex = Math.floor(count / this.maxInstanceCount);
            console.log("handle overflowing instance buffer", expansionIndex, this.mesh.name)
        } else {

        }

        if (this.isCameraSpace === false) {
            if (mesh.geometry.instanceCount === 0) {
                if (count !== 0) {
                //    console.log("Count++", activeGeometries)
                    this.addToScene();
                }
            } else if (count === 0) {
            //    console.log("Count Zero", activeGeometries)
                this.removeFromScene();
            }
        }

        mesh.geometry.instanceCount = count;
        mesh.geometry.needsUpdate = true;
    };

    dispose = function() {
        ThreeAPI.hideModel(this.mesh);
        this.geometry.dispose();
    };

    updateBufferStates = function() {

        let drawRange =0;

        for (let key in this.buffers) {
            let buffer = this.buffers[key];
            let lastIndex = buffer.length -1;

            if (key === 'offset') {
                drawRange = buffer[lastIndex-2];
            }

            if (buffer[lastIndex]) {
                buffer[lastIndex] = 0;
                this.attributes[key].needsUpdate = true;
            }
        }

        return drawRange;
    };

    removeFromScene() {
        activeGeometries--
        ThreeAPI.hideModel(this.mesh);
    };

    addToScene() {
        activeGeometries++
        if (this.isCameraSpace) {

            let offset = new THREE.Object3D();
            offset.position.z = -1;
            offset.add(this.mesh);

        //    console.log("Screen Space Mesh:", this.mesh.geometry.drawRange, this.mesh);

            ThreeAPI.attachObjectToCamera(offset);

        } else {
            ThreeAPI.showModel(this.mesh);
        }
    };



}

export { InstanceBuffer }