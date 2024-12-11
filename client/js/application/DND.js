let DND = {}

    DND.Class = {
        BARBARIAN:'BARBARIAN',
        BARD:'VARD',
        CLERIC:'CLERIC',
        DRUID:'DRUID',
        FIGHTER:'FIGHTER',
        MONK:'MONK',
        PALADIN:'PALADIN',
        RANGER:'RANGER',
        ROGUE:'ROGUE',
        SORCERER:'SORCERER',
        WARLOCK:'WARLOCK',
        WIZARD:'WIZARD'
    };

    DND.Bakground = {
        ACOLYTE:'ACOLYTE',
        ARTISAN:'ARTISAN',
        CHARLATAN:'CHARLATAN',
        CRIMINAL:'CRIMINAL',
        ENTERTAINER:'ENTERTAINER',
        FARMER:'FARMER',
        GUARD:'GUARD',
        GUIDE:'GUIDE',
        HERMIT:'HERMIT',
        MERCHANT:'MERCHANT',
        NOBLE:'NOBLE',
        SAGE:'SAGE',
        SAILOR:'SAILOR',
        SCRIBE:'SCRIBE',
        SOLDIER:'SOLDIER',
        WAYFARER:'WAYFARER'
    }

    DND.Language = {
        COMMON:'COMMON',
        COMMON_SIGN_LANGUAGE:'COMMON_SIGN_LANGUAGE',
        DRACONIC:'DRACONIC',
        DWARVISH:'DWARVISH',
        ELVISH:'ELVISH',
        GIANT:'GIANT',
        GNOMISH:'GNOMISH',
        GOBLIN:'GOBLIN',
        HALFLING:'HALFLING',
        ORC:'ORC',
        ABYSSAL:'ABYSSAL',
        CELESTIAL:'CELESTIAL',
        DEEP_SPEECH:'DEEP_SPEECH',
        DRUIDIC:'DRUIDIC',
        INFERNAL:'INFERNAL',
        PRIMORDIAL:'PRIMORDIAL',
        SYLVAN:'SYLVAN',
        THIEVES_CANT:'THIEVES_CANT',
        UNDERCOMMON:'UNDERCOMMON'
    }

    DND.Alignment = {
        LAWFUL_GOOD:'LAWFUL_GOOD',
        NEUTRAL_GOOD:'NEUTRAL_GOOD',
        CHAOTIC_GOOD:'CHAOTIC_GOOD',
        LAWFUL_NEUTRAL:'LAWFUL_NEUTRAL',
        NEUTRAL:'NEUTRAL',
        CHAOTIC_NEUTRAL:'CHAOTIC_NEUTRAL',
        LAWFUL_EVIL:'LAWFUL_EVIL',
        NEUTRAL_EVIL:'NEUTRAL_EVIL',
        CHAOTIC_EVIL:'CHAOTIC_EVIL'
    }

    DND.Ability = {
        STR:'STR',
        DEX:'DEX',
        CON:'CON',
        INT:'INT',
        WIS:'WIS',
        CHA:'CHA'
    }

const mapValues = function() {
    const map = {};

    for (const key in DND) {
        map[key] = [];

        for (const i in DND[key]) {
            map[key][DND[key][i]] = i;
        }
    }

    DND.Map = map;

    DND.getKey = function(category, index) {
        return DND.Map[category][index];
    }
};

mapEnums();

export {DND}

