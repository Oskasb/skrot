import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {getConfigListAt, mappedConfigKey, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {paletteKeys, paletteMap} from "../../../game/visuals/Colors.js";


function seekDataSource(key, value) {

    if (key === 'palette') {
        return paletteKeys
    }
    if (key === 'dispatch') {
        return ENUMS.Map['Event']
    }


    console.log("Seek Data Source", key, value)

    return "string";
}

class DomEditValues {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let initAtValue = null;
        let addButtonDiv = null;
        let setValue = "";

        let elementDivs = [];

        function applyAdd() {
            statusMap.applyEdit(statusMap.key);
        }


        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            statusMap = htmlElem.statusMap;
            let dataKey = statusMap.key;
            rootElem = htmlEl.call.getRootElement();
            selectList = htmlElem.call.getChildElement('select_list');


            applyContainerDiv = htmlElem.call.getChildElement('apply_container');
       //     htmlElem.call.populateSelectList('select_list', listifyConfig(statusMap.config));
       //     addButtonDiv = htmlElem.call.getChildElement('add_button');
       //     DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            let type = getElementTypeKey(statusMap.data);
            htmlElem.call.getChildElement('label').innerHTML = dataKey+" ("+type+")";
            htmlElem.call.getChildElement('header').innerHTML = "EDIT - DEPTH: "+statusMap.depth;
            initAtValue = dataKey;
            setValue = dataKey;
            applySelection(dataKey)
        }.bind(this);


        function closeSubValueEdit() {
            if (subValueEdit !== null) {
                if (subValueEdit !== null) {
                    subValueEdit.closeEditTool()
                    poolReturn(subValueEdit)
                    subValueEdit = null;
                }
            }
        }

        let subValueEdit = null;


        function openSubValueEdit(key, data) {
            closeSubValueEdit()

            let map = {
                applyEdit:statusMap.applyEdit,
                map:mappedConfigKey(key),
                key:key,
                data:data,
                depth:statusMap.depth+1,
                parent:statusMap.data
            }
            subValueEdit = poolFetch('DomEditValues');
            subValueEdit.initEditTool(closeSubValueEdit, map)
        }




        function addValueElement(entry, key) {
            let type = getElementTypeKey(entry)
            let label = key;
            let openSubEditor;

            if (type === 'array') {

                let eVal = "| "
                for (let i = 0; i < entry.length; i++) {
                    let subType = getElementTypeKey(entry[i]);
                    if (subType === 'object') {
                        eVal += "{} "
                    } else if (subType === 'array') {
                        eVal += "[] "
                    } else {
                        eVal += subType+" "
                    }
                    eVal += "| ";
                }

                label = '<h2>'+key+'<h2><p>'+eVal+'</p>'
                openSubEditor = true;
            } else if (type === 'object') {
                let eVal = "|"
                for (let key in entry) {
                    let subType = getElementTypeKey(entry[key]);
                    if (subType === 'object') {
                        eVal += "{}"
                    } else if (subType === 'array') {
                        eVal += "[]"
                    } else {
                        eVal += subType
                    }
                    eVal += "|";
                }
                label = '<h2>'+key+'<h2><p>'+eVal+'</p>'
                openSubEditor = true;
            } else {
                label ='<h2>'+type+'<h2><p>'+entry+'</p>';
            }


            let map = statusMap.map;
            if (map !== null) {
                if (map.length === 1) {
                    label += "<h4>"+map[0].source+"</h4><h3>"+map[0].root+" "+map[0].folder+"</h3>";
                    console.log("configKey has entry ", map[0].root, map[0].folder)
                } else {
                    console.log("configKey has multiple entries ", map)
                    label += "<h3>| #LOC: "+map.length+" |</h3>";
                }



            } else {
                if (type === 'string') {

                    let map = mappedConfigKey(entry);
                    if (map !== null) {
                        label = '<h2>'+statusMap.key+'<h2><p>'+entry+'</p>'
                        if (map.length === 1) {
                            label += "<h4>"+map[0].source+"</h4><h3>"+map[0].root+" "+map[0].folder+"</h3>";
                            console.log("configKey has entry ", map, label)
                            let list = getConfigListAt(map[0].root, map[0].folder)
                            htmlElem.call.populateSelectList('select_list', list);
                            selectList.value = entry;
                            setValue = selectList.value;
                        } else {
                            console.log("configKey has multiple entries ", map)
                            label += "<h3>| #LOC: "+map.length+" |</h3>";
                        }

                    } else {
                        let source = seekDataSource(statusMap.key, entry)
                        let typeKey = getElementTypeKey(source);

                        label += "<h4>"+typeKey;

                        if (typeKey === ('array' || 'object')) {
                            console.log("TODO: Populate select list: ", source)
                            label += " "+source.length;


                        }
                        if (typeKey === 'object') {
                            console.log("TODO: Populate object list: ", source)
                            label += " "+Object.keys(source).length;
                        }
                        label += "</h4>";
                    }

                }

            }

            let div = DomUtils.createDivElement(applyContainerDiv, type+"_"+entry, label, "config_inspect  type_"+type);

            if (openSubEditor === true) {

                let open = function() {
                    openSubValueEdit(key, entry, entry)
                }

                DomUtils.addClickFunction(div, open)
            }

            elementDivs.push(div);
        }

        function addValues(key, element) {
            let type = getElementTypeKey(element)
            if (type === 'array') {
                for (let i = 0; i < element.length; i++) {
                    addValueElement(element[i], i)
                }
            } else if (type === 'object') {
                for (let key in element) {
                    addValueElement(element[key], key)
                }
            } else {
                addValueElement(element, null)
            }
        }

        function getElementTypeKey(element) {
            if (Array.isArray(element)) {
                return 'array'
            }
            return typeof (element)
        }

        let applySelection = function(id) {
            selectList.value = id;
        //    console.log(id, statusMap)
            while (elementDivs.length) {
                DomUtils.removeDivElement(elementDivs.pop())
            }

            let element = statusMap.data;

            addValues(id, element);
        };

        let update = function() {
            if (subValueEdit !== null) {
                subValueEdit.htmlElement.call.getRootElement().style.left = "440em";
            }

            if (setValue !== selectList.value) {
                setValue = selectList.value;
                statusMap.parent[statusMap.key] = setValue;
                statusMap.applyEdit();
            }

        };

        let close = function() {

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close,
        }
    }

    initEditTool(closeCb, statusMap, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_values', closeCb, statusMap, 'edit_frame edit_values', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditValues }