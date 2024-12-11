import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let tempVec1 = new Vector3();
let tempVec2 = new Vector3();

        class SectorContent {
        constructor(targetCount) {

            this.targetPlantCount = targetCount;

            this.inactivePlants = [];
            this.plants = [];
            this.addedPlantsCount = 0;

        };


        getActivePlantCount = function() {
            return this.plants.length;
        };


        getInactivePlants = function() {
            return this.inactivePlants;
        };


        addInactivePlant = function(plant) {
            this.addedPlantsCount++;
            this.inactivePlants.push(plant);
        };


        activatePlantCount = function(count) {
            while (this.inactivePlants.length) {

                let plant = this.inactivePlants.pop();
                plant.plantActivate();
                this.plants.push(plant);

                count--;
                if (count === 0) {
                    break;
                }
            }
        };

        deactivatePlantCount = function(count) {

            for (let i = 0; i < count; i++) {
                let plant = this.plants.pop();
                if (!plant) {
                    console.log("Bad plant copunt");
                    return;
                }
                plant.plantDeactivate();
                this.inactivePlants.push(plant);
            }

        };

        deactivateAllPlants = function() {
            while (this.plants.length) {
                let plant = this.plants.pop();
                plant.plantDeactivate();
                this.inactivePlants.push(plant);
            }
        };
    }

    export {SectorContent};