define([
    "game/GameConfiguration"
],
    function (
            gameConfig
        ) {
        "use strict";

        var g = -gameConfig.WORLD_PROPERTIES.gravity[1];

        var calcElevationForTrajectory = function(vel, distance, height) {
                //    var aimRange = Math.abs(Math.sqrt(sourcePos.lengthSquared()) - Math.sqrt(targetPos.lengthSquared()));

                var bv=vel;
                var x = distance
                var y = height;

            //        var newElevation = Math.atan((bv*bv - Math.sqrt(bv*bv*bv*bv-g*(g*x*x+2*y*bv*bv) )) / g*x) - Math.PI * 0.5;
                  var newElevation = 0.5*Math.asin(g*x / (bv*bv));
                //    console.log("elevation: ",newElevation, x, sourcePos.data[0],sourcePos.data[2],targetPos.data[0],targetPos.data[2] );

                return newElevation;
        };


        var calcDistanceAtElevationAndVelocity = function(elevation, velocity) {
            return velocity*velocity*Math.sin(2*elevation) / g;
        };

        var calcDistanceAtElevationVelocityAndHeight = function(elevation, velocity, height) {
        // get init velocity, angle, and height
        var Vo = velocity;
        var th = elevation;
        var Yo = height;

        if ((th > Math.PI/2)||(th < 0)||(Vo < 0)) return false;

        var Ge = g;            // acceleration of gravity -- meters/sec/sec
        var Vx = Vo*Math.cos(th);             // init horizontal velocity
        var Vy = Vo*Math.sin(th);             // init vertical velocity

        var hgt = Yo + Vy*Vy/(2*Ge);          // max height

        if (hgt < 0.0) return false;

        var upt = Vy/Ge;                      // time to max height
        var dnt = Math.sqrt(2*hgt/Ge);        // time from max height to impact
        var rng = Vx*(upt + dnt);             // horizontal range at impact

        // flight time to impact, speed at impact
        var imp = upt + dnt;
        var spd = Math.sqrt((Ge*dnt)*(Ge*dnt) + Vx*Vx);
        return rng;
        };

        return {
            calcDistanceAtElevationVelocityAndHeight:calcDistanceAtElevationVelocityAndHeight,
            calcDistanceAtElevationAndVelocity:calcDistanceAtElevationAndVelocity,
            calcElevationForTrajectory:calcElevationForTrajectory
        }
    });