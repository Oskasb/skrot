import {poolFetch, poolReturn} from "../../../utils/PoolUtils.js";
import {fetchConfigByEditId} from "../../../utils/ConfigUtils.js";

class DomCharacters {
    constructor(domNavPoints) {

        let statusMap = {};

        let mainElement = null;
        let navPoint = null;
        let progCfg = null;

        let tierDivs = []


        function addTierSlots(lane, slots, tier) {
            for (let i = 0; i < slots; i++) {
                let laneSlot = DomUtils.createDivElement(lane, "slot_"+tier+"_"+i, "", "nav_character_slot")
                DomUtils.addElementClass(laneSlot, "slot_locked");
            }
        }

        function applyTestState() {

            let testState = progCfg['test_state'];
            let testSlots = testState.slots;

                for (let i = 0; i < testSlots.length; i++) {
                    let tier = testSlots[i]['tier'];
                    let slot = testSlots[i]['slot'];
                    let id = "slot_"+tier+"_"+slot;
                    let laneSlot = mainElement.call.getChildElement(id);
                    DomUtils.removeElementClass(laneSlot, "slot_locked");
                    let state = testSlots[i]['state'];
                    DomUtils.addElementClass(laneSlot, "slot_"+state);

                    if (state === 'populated') {
                        let name = "CharName"
                        let label = '<h1>'+name+'</h1>'
                        let slotCharacter = DomUtils.createDivElement(laneSlot, "char_"+tier+"_"+slot, label, "nav_slot_character")
                        DomUtils.addElementClass(slotCharacter, "image_portraits");
                        slotCharacter.style.backgroundPositionX = 100 * MATH.calcFraction(0, 13, Math.floor(MATH.randomBetween(0, 14))) + '%';
                        slotCharacter.style.backgroundPositionY = 100 * MATH.calcFraction(0, 4,  Math.floor(MATH.randomBetween(0, 5))) +'%';
                    }

                }

        }

        function applyTestHeroes() {

            let slotTiers = progCfg['slot_tiers'];
            let listContainer =  mainElement.call.getChildElement('nav_page_list_container')
            DomUtils.clearDivArray(tierDivs);
            for (let i = 0; i < slotTiers.length; i++) {
                let iHtml = '<h1>'+slotTiers[i].name+'</h1>';
                let tier = slotTiers[i].tier;
                let tierDiv = DomUtils.createDivElement(listContainer, "tier_"+tier, "", "nav_page_tier_container");
                tierDivs.push(tierDiv);
                //    setTimeout(function() {
                let infoDiv = DomUtils.createDivElement(tierDiv, "info_"+tier+i, "", "tier_info")
                let labelDiv = DomUtils.createDivElement(infoDiv, "label_"+tier+i, iHtml, "tier_label")
                let laneDiv = DomUtils.createDivElement(tierDiv, "lane_"+tier+i, "", "nav_page_lanes_container")
                addTierSlots(laneDiv, slotTiers[i].slots, tier)
            }
            setTimeout(applyTestState, 50)
        }

        function applyCompanionList(compList) {

            let listContainer =  mainElement.call.getChildElement('nav_page_list_container')
            let characters = compList['characters'];
            DomUtils.clearDivArray(tierDivs);
            let tiers = {};

            for (let i = 0; i < characters.length; i++) {
                let char = characters[i];
                let id = char['id'];
                let name = char['name'];
                let tier = ""+char['tier'];
                let rarity = char['rarity'] || "COMMON";
                let classes = char['classes'] || ['class_fighter', 'class_rogue'];
                let subclass = char['subclass'] || ['subclass_champion', "subclass_thief"];
                let levels = char['levels'] || [Math.ceil(MATH.randomBetween(3, 12)), Math.ceil(MATH.randomBetween(3, 12))]
                if (!tiers[tier]) {
                    tiers[tier] = [];
                }
                let companion = {
                    id:id,
                    name:name,
                    rarity:rarity,
                    tier:tier,
                    classes:classes,
                    subclass:subclass,
                    levels:levels
                };
                tiers[tier].push(companion);
            }

            for (let key in tiers) {
                let iHtml = '<h1>Tier '+key+'</h1>';
                let tier = key;
                let tierDiv = DomUtils.createDivElement(listContainer, "tier_"+tier, "", "nav_page_tier_container");
                tierDivs.push(tierDiv);
                //    setTimeout(function() {
                let infoDiv = DomUtils.createDivElement(tierDiv, "info_"+tier, "", "tier_info")
                let labelDiv = DomUtils.createDivElement(infoDiv, "label_"+tier, iHtml, "tier_label")
                let laneDiv = DomUtils.createDivElement(tierDiv, "lane_"+tier, "", "nav_page_lanes_container")
                addTierSlots(laneDiv, tiers[key].length, tier)
            }

            function applyCompanions() {

                for (let key in tiers) {
                    let characters = tiers[key];

                    for (let i = 0; i < characters.length; i++) {
                        let tier = characters[i]['tier'];
                        let rarity = characters[i]['rarity'];
                        let name = characters[i]['name'];
                        let charClass = characters[i]['classes'];
                        let subclass = characters[i]['subclass'];
                        let levels = characters[i]['levels'];
                        let label = '<h1>'+name+'</h1>'
                        let slot = i;
                        let id = "slot_"+tier+"_"+slot;
                        let laneSlot = mainElement.call.getChildElement(id);
                        DomUtils.removeElementClass(laneSlot, "slot_locked");
                        let state ='populated';

                        DomUtils.addElementClass(laneSlot, "slot_"+state);
                        DomUtils.addElementClass(laneSlot, rarity);

                            let slotCharacter = DomUtils.createDivElement(laneSlot, "char_"+tier+"_"+slot, "", "nav_slot_character")
                        let slotNameDiv = DomUtils.createDivElement(slotCharacter, "name_"+tier+"_"+slot, label, "nav_slot_name")
                            DomUtils.addElementClass(slotCharacter, "image_portraits");
                            slotCharacter.style.backgroundPositionX = 100 * MATH.calcFraction(0, 13, Math.floor(MATH.randomBetween(0, 14))) + '%';
                            slotCharacter.style.backgroundPositionY = 100 * MATH.calcFraction(0, 4,  Math.floor(MATH.randomBetween(0, 5))) +'%';

                        let classesDiv = DomUtils.createDivElement(slotCharacter, "cs_"+id, "", "nav_slot_classes")
                        let itemIndicators = DomUtils.createDivElement(classesDiv, slot+"_items", "", "nav_slot_items")
                        for (let j = 0; j < 10; j++) {

                            let itemIndicator = DomUtils.createDivElement(itemIndicators, slot+"_item_"+j, "", "nav_slot_item")
                            let itemIcon = DomUtils.createDivElement(itemIndicator, slot+"_item_"+j+"_icon", "|||", "nav_slot_item_icon")

                            let rarity = MATH.getRandomObjectEntry(ENUMS.rarity);
                            DomUtils.addElementClass(itemIcon, rarity);
                        }

                        let starIndicators = DomUtils.createDivElement(classesDiv, slot+"_stars", "", "nav_slot_stars")

                        let starCount = Math.floor(MATH.randomBetween(0, 5))

                        for (let j = 0; j < starCount; j++) {

                            let indicator = DomUtils.createDivElement(starIndicators, slot+"_star_"+j, "", "nav_slot_star")
                            let itemIcon = DomUtils.createDivElement(indicator, slot+"_star_"+j+"_icon", "", "nav_slot_star_icon")

                        //    let rarity = MATH.getRandomObjectEntry(ENUMS.rarity);
                            DomUtils.addElementClass(itemIcon, 'icon_potency_set_3');
                        }

                        for (let j = 0; j < charClass.length; j++) {
                            let cClass = charClass[j];
                            let icon = 'icon_'+cClass;
                            let sClass = subclass[j];
                            let classLevel = levels[j];
                            let label = '<h1>'+classLevel+'</h1>'
                            let classBox = DomUtils.createDivElement(classesDiv, "cbox_"+id+j, "", "nav_slot_classbox")

                            let cIconDiv = DomUtils.createDivElement(classBox, "cls_"+id+j, label, "nav_slot_class")
                            DomUtils.addElementClass(cIconDiv, cClass);
                            DomUtils.addElementClass(cIconDiv, icon)
                            if (typeof (sClass) === 'string') {
                                let scicon = 'icon_'+sClass;
                                let scIconDiv = DomUtils.createDivElement(classBox, "scls_"+id+j, "", "nav_slot_subclass")
                                DomUtils.addElementClass(scIconDiv, scicon);
                                DomUtils.addElementClass(scIconDiv, cClass);
                            }

                        }

                        if (viewAllies === false) {
                            let xpContainer = DomUtils.createDivElement(slotCharacter, "xpcont_"+id, "", "nav_slot_xp_container")
                            let xp = DomUtils.createDivElement(xpContainer, "xp_"+id, "", "nav_slot_xp_bar")
                            xp.style.width = MATH.randomBetween(1, 99) + '%';
                        } else {
                            let xpContainer = DomUtils.createDivElement(slotCharacter, "xpcont_"+id, "", "nav_slot_standing_container")
                            let xp = DomUtils.createDivElement(xpContainer, "xp_"+id, "", "nav_slot_standing_bar")
                            xp.style.width = MATH.randomBetween(1, 99) + '%';
                        }

                    }
                }

            }

            setTimeout(applyCompanions, 100)


        }

        let viewAllies = false;

        function applyNavPointSelection() {

            viewAllies = false;
            let id = navPoint.call.getId();

            if (id === 'NAV_A') {
                applyTestHeroes()
            }

        if (id === 'NAV_B') {
            fetchConfigByEditId('companion_char_list', applyCompanionList);
        }

            if (id === 'NAV_C') {
                viewAllies = true;
                fetchConfigByEditId('allies_char_list', applyCompanionList);
            }

        }


        function update() {

            let activeNavPoint = domNavPoints.call.getActiveNavPoint();

            if (typeof (activeNavPoint) === 'object') {

                if (navPoint !== activeNavPoint) {
                    navPoint = activeNavPoint;
                    let groupDiv = mainElement.call.getChildElement('group')
                    groupDiv.innerHTML = activeNavPoint.call.getLabel();
                    applyNavPointSelection();
                }



            }

        }


        function elemReady() {
            ThreeAPI.registerPrerenderCallback(update)
        }

        function activate() {
            mainElement = poolFetch('HtmlElement');
            mainElement.initHtmlElement('nav/characters', close, statusMap, 'full_screen', elemReady);

        }

        function close() {

            setTimeout(function() {
                mainElement.closeHtmlElement();
                poolReturn(mainElement);
            }, 300)
            mainElement.hideHtmlElement(0.1);
            ThreeAPI.unregisterPrerenderCallback(update)
        }

        this.call = {
            close:close,
            activate:activate
        }


        function collProgCfg(cfg) {
            progCfg = cfg;
            console.log("Collection progress cfg: ", cfg)
            activate();
        }

        fetchConfigByEditId('collection_progression', collProgCfg);


    }
}

export { DomCharacters }