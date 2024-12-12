import {PipelineObject} from '../../application/load/PipelineObject.js';
import {pipelineAPI} from "../../application/utils/DataUtils.js";
import {ShaderChunk} from "../../../../libs/three/Three.js";

class ThreeShaderBuilder {
    constructor() {
        this.shaderChunks = {};
        this.shaderDataIndex = {};
        this.buildTimeout;
        this.gl;
        this.okCount = 0;
    }
    loadShaderData = function(glContext) {

        let shaderChunks = this.shaderChunks;
        let shaderDataIndex = this.shaderDataIndex;
        let buildTimeout = this.buildTimeout;
        this.gl = glContext;
        let gl = this.gl;
        let okCount = this.okCount;

        let testShader = function( src, type ) {

            let types = {
                fragment:gl.FRAGMENT_SHADER,
                vertex:gl.VERTEX_SHADER
            };

            let shader = gl.createShader( types[type]);
            let line, lineNum, lineError, index = 0, indexEnd;

            gl.shaderSource( shader, [src] );
            gl.compileShader( shader );


            if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
                let error = gl.getShaderInfoLog( shader );

                console.error( [shader],error );

                while (index >= 0) {
                    index = error.indexOf("ERROR: 0:", index);
                    if (index < 0) { break; }
                    index += 9;
                    indexEnd = error.indexOf(':', index);
                    if (indexEnd > index) {
                        lineNum = parseInt(error.substring(index, indexEnd));
                        if ((!isNaN(lineNum)) && (lineNum > 0)) {
                            index = indexEnd + 1;
                            indexEnd = error.indexOf("ERROR: 0:", index);

                        }
                    }
                }
                return null;
            }

            okCount++;
            //    console.log("Shader OK:", okCount);
            return shader;
        }

        let buildStringChunks = function(src, data) {
        //    console.log("buildStringChunks: ", src, data)
            let chunks = {}
            for (let key in data) {
                chunks[key] = data[key].join( "\n" );
                pipelineAPI.setCategoryKeyValue(src, key, chunks[key]+"\n");
            }
            notifyShaderDataUpdate();
            //    console.log("CACHE STRING CHUNKS:", src, chunks);
        };

        let mapThreeShaderChunks = function() {
            let chunks = {}
            for (let key in ShaderChunk) {
                chunks[key] = ShaderChunk[key];
                pipelineAPI.setCategoryKeyValue("THREE_CHUNKS", key, "\n" + chunks[key] + "\n");
            }
            //    console.log("CACHE THREE CHUNKS:", chunks);
        };

        let combineProgramFromSources = function(sources) {
            let programString = '';
            for (let i = 0; i < sources.length; i++) {
                programString += pipelineAPI.readCachedConfigKey(sources[i].source, sources[i].chunk) + "\n";
            }
            return programString;
        };

        let buildShaderPrograms = function(src, data) {

            let program = {};
            let cached = pipelineAPI.readCachedConfigKey("SHADERS", src);

            let diff = 0;

            for (let key in data) {
            //    console.log(key)
                program[key] = combineProgramFromSources(data[key]);

                if (cached[key]) {
                    let cachedString = cached[key];
                    let newString = program[key]
                //    console.log(key)
                    if (cachedString.length === newString.length) {
                        for (let i = 0; i < cachedString.length; i++) {
                            if (cachedString[i] !== newString[i]) {
                                console.log("shader changed", src, key, cachedString[i], newString[i])
                                diff ++;
                                i = cachedString.length;
                            }
                        }
                    } else {
                    //    console.log("shader changed not equal string length", key)
                        diff++
                    }

                } else {
                    diff++
                }

                if (diff) {
                    if (!testShader(program[key], key)) {
                        console.log("Bad Shader", key, data);

                        if (cached[key] !== program[key]) {
                            console.log("Broke Good Shader", src, key, [PipelineAPI.getCachedConfigs()], data);
                            return;
                        }

                        return;
                    } else if (diff && (typeof (cached[key]) !== 'undefined')) {
                        console.log("Shader Test success: ", src, key)
                    }
                }

            }
            if (!diff) {
                //    console.log("Shader not changed", src, key);
                return;
            }

            pipelineAPI.setCategoryKeyValue("SHADERS", src, program);
            //        console.log("CACHED SHADER PROGRAMS:", src, PipelineAPI.getCachedConfigs());
        };

        let buildShadersFromIndex = function() {
            for (let key in shaderDataIndex) {
                buildShaderPrograms(key, shaderDataIndex[key]);
            }
        };

        let registerShaderProgram = function(src, data) {
            shaderDataIndex[src] = {};
            for (let key in data) {
                shaderDataIndex[src][key] = data[key];
            }
            //    console.log("SHADER DATA INDEX:", shaderDataIndex);
            notifyShaderDataUpdate();
        };

        let notifyShaderDataUpdate = function() {
            clearTimeout(buildTimeout, 1);
            buildTimeout = setTimeout(function() {
                buildShadersFromIndex();
            }, 10);
        };

        let loadChunkIndex = function(src, data) {
            for (let i = 0; i < data.length; i++) {
                new PipelineObject("SHADER_CHUNKS",   data[i], buildStringChunks)
            }
        };

        let loadProgramIndex = function(src, data) {
        //    console.log("Load shader program: ", src, data)
            for (let i = 0; i < data.length; i++) {
                new PipelineObject("SHADER_PROGRAMS",   data[i], buildStringChunks)
            }
        };

        let loadShaderIndex = function(src, data) {
            for (let i = 0; i < data.length; i++) {
                new PipelineObject("SHADERS_THREE",   data[i], registerShaderProgram)
            }
        };


        gl = glContext;

        //    console.log("Shader Lib: ", THREE.ShaderLib)

        mapThreeShaderChunks();

        new PipelineObject("SHADER_CHUNKS",   "LOAD_CHUNK_INDEX", loadChunkIndex);
        new PipelineObject("SHADER_PROGRAMS", "LOAD_PROGRAM_INDEX", loadProgramIndex);
        new PipelineObject("SHADERS_THREE",   "LOAD_SHADER_INDEX", loadShaderIndex);

    };

}

export { ThreeShaderBuilder }