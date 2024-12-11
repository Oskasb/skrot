"use strict";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import * as TerrainFunctions from "./TerrainFunctions.js";

let checkPositionWithin = function(pos, terrainModel, parentObj) {

    let pPosx = parentObj.position.x;
    let pPosz = parentObj.position.z;

    if (parentObj.parent) {

        pPosx += parentObj.parent.position.x;
        pPosz += parentObj.parent.position.z;

        if (parentObj.parent.parent) {
            pPosx += parentObj.parent.parent.position.x;
            pPosz += parentObj.parent.parent.position.z;
        }

    } else {
        //        console.log("No Parent object for Terrain root", terrainModel);
    }

    let size = terrainModel.opts.xSize;
    pPosx += size/2;
    pPosz += size/2;

    if (pPosx <= pos.x && pPosx + size >= pos.x) {
        if (pPosz <= pos.z && pPosz + size >= pos.z) {
            return true;
        }
    }
    return false;
};

let count = 0;
let calcVec = new Vector3();

let hitPosStore = new Vector3();
let hitNormalStore = new Vector3();

        class AreaFunctions {
            constructor() {
            //    this.terrainFunctions = terrainFunctions;
            };

        setTerrainArea = function(terrainArea) {
            this.terrainArea = terrainArea;
        };

        getAreaTerrain = function() {
            return this.terrainArea.getTerrain();
        };

        getAreaOrigin = function() {
            return this.terrainArea.getOrigin();
        };

        getAreaExtents = function() {
            return this.terrainArea.getExtents();
        };

        checkPosIsWithinLevelTerrain = function(vec3, level) {


            for (let i = 0; i < level.terrains.length; i++) {
                if (checkPositionWithin(vec3, level.terrains[i], level.terrainActors[i].piece.rootObj3D)) {
                    return i;
                }
            }

            return false;
        };

        terrainHeightAtPos = function(terrain, vec3, normalStore) {
            return TerrainFunctions.getTerrainHeightAt(terrain, vec3, this.getAreaOrigin(), normalStore);
        };

        randomTerrainSetPosVec3 = function(vec3, terrain, rootObj3D, normalStore) {

            let size = terrain.opts.xSize;
            let height = (terrain.opts.maxHeight - terrain.opts.minHeight);

            size *= 0.8;

            vec3.copy(rootObj3D.position);
            vec3.x += Math.random()*size  - size/2;
            vec3.z += Math.random()*size  - size/2;

            vec3.y = this.terrainHeightAtPos(terrain, vec3, rootObj3D, normalStore);

        };

        getRandomPointOnTerrain = function(vec3, levels, normalStore) {
            for (let i = 0; i < levels.length; i++) {
                let index = this.checkPosIsWithinLevelTerrain(vec3, levels[i]);
                if (typeof(index) === 'number') {
                    this.randomTerrainSetPosVec3(vec3, levels[i].terrains[index], levels[i].terrainActors[index].piece.rootObj3D, normalStore);
                    return;
                };
            }
            console.log("No Terrain for Pos", vec3);
        };

        getLevelForPosition = function(vec3, levels) {

            for (let i = 0; i < levels.length; i++) {
                let index = this.checkPosIsWithinLevelTerrain(vec3, levels[i]);
                if (typeof(index) === 'number') {
                    return levels[i];
                }
            }
        };

        getHeightAtPos = function(pos, normalStore) {
            return this.terrainHeightAtPos(this.getAreaTerrain(), pos, normalStore);
        };


        positionActorRandomOnTerrain = function(actor, levels) {
            let pos = actor.piece.rootObj3D.position;
            pos.x = 1000;
            pos.z = 1000;
            this.getRandomPointOnTerrain(pos, levels);
            pos.y += 10;
            actor.forcePosition(pos);
        };



    }

export {AreaFunctions}
