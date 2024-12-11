import {PipelineObject} from '../../../application/load/PipelineObject.js';
import {AddOperation, MixOperation, MultiplyOperation} from "../../../../libs/three/constants.js";

let blendCanvasCtxToTexture = function(ctx, texture) {

    let originalBitmap = texture.originalBitmap;

    texture.ctx.globalCompositeOperation = 'copy';
    texture.ctx.drawImage(originalBitmap, 0, 0, originalBitmap.width, originalBitmap.height)
    texture.ctx.globalCompositeOperation = 'lighter';
    texture.ctx.fillStyle = "rgba("+255*Math.random()+", "+255*Math.random()+", 0, 1)";
    texture.ctx.fillRect(0, 0, originalBitmap.width, originalBitmap.height)
    texture.ctx.drawImage(ctx.canvas, originalBitmap.width, originalBitmap.height, 0, 0)

    texture.needsUpdate = true;
    console.log("blendCanvasCtxToTexture", ctx, texture)
}

class ThreeMaterial {
    constructor(id, config, callback) {

        this.id = id;
        this.txLoads = 0;
        this.textureMap = {};
        this.textures = {};
        this.mat = null;
        let _this = this;
        let material;

        let matReady = function(mat) {
            _this.mat = mat;
            mat.name = _this.id;
            material = mat;
        //   console.log(mat.name)
        //      console.log("Material Ready", this);

            for (let key in this.textureMap) {

                if (key === 'envMap') {
                    console.log("EnvMap: ", this);
                }

                if (!this.textures[this.textureMap[key]]) {
                    console.error("No such texture", key, this)
                    return;
//                    this.textures[this.textureMap[key]]
                }

                mat[this.textureMap[key]] = this.textures[this.textureMap[key]].texture;
            }
            //  console.log("Material Ready", this);

            if (mat['envMap']) {
            //    console.log("EquirectangularReflectionMapping ", id, mat['envMap'], mat)
                mat['envMap'].mapping = THREE.EquirectangularReflectionMapping;
            }

            mat.needsUpdate = true;
            callback(this);
        }.bind(this);

        let materialSettingsLoaded = function(asset) {
           //   console.log("Material materialSettingsLoaded", asset, config);
            this.applyMaterialSettings(asset.config.shader, asset.config.properties, matReady);
        }.bind(this);


        let txReady = function() {
           //     console.log("Material txReady", this);
            ThreeAPI.loadThreeAsset('MATERIAL_SETTINGS_', config.settings, materialSettingsLoaded);
        }.bind(this);

        this.setupTextureMap(config, txReady);

    };

    getAssetMaterial = function() {
        if (!this.mat) {
            console.log("No Material Yet...", this);
        }
        return this.mat;
    };

    setupTextureMap = function(config, cb) {

        let loadCheck = function() {

            if (config.textures.length === this.txLoads) {
                //      console.log('all textures loaded for material', config)
                cb();
            }
        }.bind(this);

        let textureAssetLoaded = function(asset, arg2) {
            this.txLoads++;
            if (!asset.id) {
                console.log("texture not asset:", asset, arg2, this.txLoads)
            }
          //   console.log("texture loaded:", asset.id, this.txLoads)
            this.textures[this.textureMap[asset.id]] = asset;
            loadCheck()
        }.bind(this);

        if (config.textures) {
            for (let i = 0; i < config.textures.length; i++) {

                let id = config.textures[i].id;
                let key = config.textures[i].key;
                this.textureMap[id] = key;
        //        console.log("Request texture:", id)
                ThreeAPI.loadThreeAsset('TEXTURES_', config.textures[i].id, textureAssetLoaded);
            }
        }

        loadCheck();
    };

    updateMaterialSettings = function(props) {

        let mat = this.mat;

        for (let key in props.settings) {
            mat[key] = props.settings[key]
        }

        if (props.defines) {

            mat.defines = mat.defines || {};

            for (let key in props.defines) {
                mat.defines[key] = props.defines[key]

            }
        }

        if (props.blending) {
            mat.blending = THREE[props.blending];
        }

        if (props.customBlending) {
            for (let key in props.customBlending) {
                mat[key] =  THREE[props.customBlending[key]]
            }
        }

        if (props.side) mat.side = THREE[props.side];

        if (props.color) {
            mat.color.r = props.color.r;
            mat.color.g = props.color.g;
            mat.color.b = props.color.b;
        }

        mat.needsUpdate = true;

    };

    applyMaterialSettings = function(shader, props, cb) {

        if (this.mat !== null) {
            this.updateMaterialSettings(props);
            return;
        }

        if (props.program) {
            this.setupCustomShaderMaterial(shader, props, cb);
            return;
        }

        let mat = new THREE[shader](props.settings);

        if (props.blending) {
            mat.blending = THREE[props.blending];
        }

        if (props.color) {
            mat.color.r = props.color.r;
            mat.color.g = props.color.g;
            mat.color.b = props.color.b;
        }

        if (props.specular) {
            mat.specular.r = props.specular.r;
            mat.specular.g = props.specular.g;
            mat.specular.b = props.specular.b;
        }

        if (props.side) mat.side = THREE[props.side];
        if (props.combine) {
            mat.combine = THREE[props.combine];
        } else {
            mat.combine = AddOperation;
        }
        if (props.normalMapType) mat.normalMapType = THREE[props.normalMapType];
        if (props.depthTest) mat.depthTest = props.depthTest;

        if (props.defines) {
      //      console.log("Add defines: ", mat.defines);
            mat.defines = mat.defines || {};
            for (let key in props.defines) {
                mat.defines[key] = props.defines[key]
            }
        }
    //     "vertexColor", "scale3d", "orientation"
        if (props.instanced) {
            mat.onBeforeCompile = function ( shader ) {

                shader.vertexShader = 'attribute vec3 offset;\n' + 'attribute vec3 scale3d;\n'+ 'attribute vec4 vertexColor;\n'+ 'attribute vec4 orientation;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    [
                        'vec3 transformed = vec3( position );',
                        'transformed.x *= 1.0 * scale3d.x;',
                        'transformed.y *= 1.0 * scale3d.y;',
                        'transformed.z *= 1.0 * scale3d.z;',
                        'transformed = transformed.xyz;',
                        'vec3 vcV = cross(orientation.xyz, transformed);',
                        'transformed = vcV * (2.0 * orientation.w) + (cross(orientation.xyz, vcV) * 2.0 + transformed);',
                        'transformed += offset;'
                    ].join( '\n' )
                );

                shader.vertexShader = shader.vertexShader.replace(
                    '#include <color_fragment>',
                    [
                        '#if defined( USE_COLOR_ALPHA )',
                        'diffuseColor *= vColor * vertexColor;',
                        '#elif defined( USE_COLOR )',
                        'diffuseColor.rgb *= vColor * vertexColor;',
                        '#endif'

                    ].join( '\n' )
                );

            //    console.log(shader.vertexShader)
                console.log("Make instanced: ", [shader])
            };
        }

        // transform a standard material to support instanced rendering



    //    console.log("mat", mat)

        cb(mat);
    };


    addTextureUniform = function(uniforms, texConf) {
       //         console.log("TEXTURE addTextureUniform:", uniforms, texConf);;

        let key = texConf.key;

        let tx = this.textures[key].texture;

        uniforms[key] = {};


        //    tx.repeat.x = texConf.repeat[0];
        //   tx.repeat.y = texConf.repeat[1];
        uniforms[key].value = tx;
        uniforms[key].type = 't';
        if (texConf['repeat']) {
            uniforms[key+'repeat'] = {};
            uniforms[key+'repeat'].value = {x:texConf.repeat[0],y:texConf.repeat[1]};
        }

        if (texConf['tiles']) {
            uniforms[key+'tiles'] = {};
            uniforms[key+'tiles'].value = {x:texConf.tiles[0],y:texConf.tiles[1]};
        }

        //   tx.needsUpdate = true;
    };

    setupCustomShaderMaterial = function(shader, props, cb) {

        //    if ( this.id === "material_terrain") console.log("material_terrain", this);
        let updateUniforms = function(uniforms, newuniforms) {

            for (let key in newuniforms) {
                if (!uniforms[key]) {
                    uniforms[key] = {};
                }
                console.log("Add Lib Uniform", key)
                uniforms[key].value = newuniforms[key].value
            }
        };

        let applyShaders = function(src, data) {
// console.log("apply shaders", src, data)
            if (this.mat !== null) {

                this.mat.vertexShader = data.vertex;
                this.mat.fragmentShader = data.fragment;

            //        console.log("Update custom material shaders");

                this.mat.needsUpdate = true;
                return;

            }

            props.shaders = data;

            let uniforms = {
                systemTime: {value:0},
                alphaTest:  {value:props.settings.alphaTest},
            };

            if ( this.textures['map']) {
                let mapTexture = this.textures['map'].texture;
                if (!mapTexture) {
                    console.log("No mapTexture in ", this.textures)
                } else {
                    //      console.log("Yes mapTexture in ", this.textures)
                    uniforms['map'] = {value:mapTexture};
                    uniforms['tiles'] = {value:new THREE.Vector2(mapTexture.userData.tiles_x, mapTexture.userData.tiles_y)};
                }
            }

            if (props['texture_uniforms']) {

                for (let i = 0; i < props['texture_uniforms'].length; i++) {
                    this.addTextureUniform(uniforms, props['texture_uniforms'][i])
                }

            }


            if (props.data_texture) {
                let dataTx = this.textures[props.data_texture].texture;
                uniforms.data_texture =  {value:dataTx};
                uniforms.data_rows    =  {value:dataTx.userData.data_rows}
            }

            if (props.global_uniforms) {

                let globalUniforms = ThreeAPI.getGlobalUniforms();

                for (let key in props.global_uniforms) {
                    if (!globalUniforms[key]) {
                        globalUniforms[key] = props.global_uniforms[key]
                    }
                    uniforms[key] = globalUniforms[key];
                }
            }

            if (props['lib_uniforms']) {
                for (let i = 0; i < props['lib_uniforms'].length; i++) {
                    updateUniforms(uniforms, THREE.UniformsLib[props['lib_uniforms'][i]]);
                }
            }


            let opts = {
                uniforms: uniforms,
                side: THREE.DoubleSide,
                vertexShader: props.shaders.vertex,
                fragmentShader: props.shaders.fragment
            };

            for (let key in props.settings) {
                opts[key] = props.settings[key]
            };



            if (props.blending) {
                opts.blending = THREE[props.blending];
            }


            if (props.customBlending) {
                for (let key in props.customBlending) {
                    opts[key] =  THREE[props.customBlending[key]]
                }
            }



            if (props.side) opts.side = THREE[props.side];


            let mat = new THREE[shader](opts);

        //    setInterval(function() {
                mat.needsUpdate = true
        //    }, 500)

            if (props.color) {
                mat.color.r = props.color.r;
                mat.color.g = props.color.g;
                mat.color.b = props.color.b;
            }

            cb(mat);

        }.bind(this);

        this.shaderPipe = new PipelineObject("SHADERS", props.program, applyShaders);

    };


    setAssetConfig = function(assetType, assetId, data) {

    };



}

export { ThreeMaterial }