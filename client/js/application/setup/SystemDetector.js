"use strict";


import {pipelineAPI} from "../utils/DataUtils.js";

define([
        '../../evt',
        'PipelineAPI'
    ],
    function(
        evt,
        PipelineAPI
    ) {


        var browserName = (function(){
            var ua= navigator.userAgent, tem,
                M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if(/trident/i.test(M[1])){
                tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'IE '+(tem[1] || '');
            }
            if(M[1]=== 'Chrome'){
                tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
                if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
            }
            M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
            if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
            return M.join(' ');
        })();

        var detectBrowser = function() {
            pipelineAPI.setCategoryData('SETUP', {BROWSER:browserName});
        };


        var detectOS = function() {
            var userAgent = window.navigator.userAgent.toLowerCase();
            var OSName = "Unknown";
            if (window.navigator.userAgent.indexOf("Windows") != -1) OSName="Windows";
            if (window.navigator.userAgent.indexOf("Windows NT 6.2") != -1) OSName="Windows 8";
            if (window.navigator.userAgent.indexOf("Windows NT 6.1") != -1) OSName="Windows 7";
            if (window.navigator.userAgent.indexOf("Windows NT 6.0") != -1) OSName="Windows Vista";
            if (window.navigator.userAgent.indexOf("Windows NT 5.1") != -1) OSName="Windows XP";
            if (window.navigator.userAgent.indexOf("Windows NT 5.0") != -1) OSName="Windows 2000";
            if (window.navigator.userAgent.indexOf("Mac")!=-1) OSName="Mac/iOS";
            if (window.navigator.userAgent.indexOf("X11")!=-1) OSName="UNIX";
            if (window.navigator.userAgent.indexOf("Linux")!=-1) OSName="Linux";

            if (window.navigator.userAgent.indexOf("Android")!=-1) OSName="Android";
            if (window.navigator.userAgent.indexOf("IOS")!=-1) OSName="IOS";

            if (/iphone|ipod|ipad/.test( userAgent )) OSName = "IOS";
            if (/android/.test( userAgent )) OSName = "Android";

            return OSName;
        };

        
        var SystemDetector = function() {
            detectBrowser();

            var os = detectOS();
            var renderScale = 1;
            var antialias = true;

            if (os == 'Android') {
                renderScale = window.devicePixelRatio;
                antialias = false;
            }

            if (os == 'IOS') {
                renderScale = window.devicePixelRatio;
                antialias = false;
            }



            pipelineAPI.setCategoryData('SETUP', {ANTIALIAS:antialias});
            pipelineAPI.setCategoryData('SETUP', {PX_SCALE:renderScale});
            pipelineAPI.setCategoryData('SETUP', {OS:os});
            
        };
        
        return SystemDetector;

    });