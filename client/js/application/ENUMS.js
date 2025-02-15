let ENUMS = {}

    ENUMS.Message = {
        SAY:                        0,
        YELL:                       1,
        WHISPER:                    2,
        DAMAGE_NORMAL_TAKEN:        3,
        DAMAGE_NORMAL_DONE:         4,
        DAMAGE_CRITICAL_TAKEN:      5,
        DAMAGE_CRITICAL_DONE:       6,
        HEALING_GAINED:             7,
        HINT:                       8,
        SYSTEM:                     9,
        PING:                       10,
        SERVER_STATUS:              11,
        EDIT_STATUS:                12,
        SAVE_STATUS:                13,
        LOAD_STATUS:                14
    };

    ENUMS.Channel = {
        CHANNEL_SAY:                0,
        CHANNEL_YELL:               1,
        CHANNEL_PARTY:              2,
        CHANNEL_SYSTEM:             3
    }

    ENUMS.Event = {
        REQUEST_WORKER:             0,
        REQUEST_FRAME:              1,
        FRAME_READY:                2,
        REQUEST_RENDER:             3,
        TRANSFORM:                  4,
        ADD_MODEL_INSTANCE:         5,
        REMOVE_MODEL_INSTANCE:      6,
        PING_MAIN_THREAD:           7,
        TEST_EVENT:                 8,
        STATS_UPDATE:               9,
        REQUEST_ASSET_INSTANCE:     10,
        UPDATE_CAMERA:              11,
        UPDATE_INSTANCE:            12,
        REGISTER_INSTANCE:          13,
        UPDATE_MODEL:               14,
        UPDATE_ANIMATIONS:          15,
        DEBUG_DRAW_LINE:            16,
        DETATCH:                    17,
        ATTACH_TO_JOINT:            18,
        ADVANCE_ENVIRONMENT:        19,
        DEBUG_DRAW_CROSS:           20,
        DEBUG_DRAW_AABOX:           21,
        DYNAMIC_JOINT:              22,
        TRACK_STAT:                 23,
        DATA_PIPELINE_READY:        24,
        BUILD_GUI_ELEMENT:          25,
        SCENARIO_ACTIVATE:          26,
        SCENARIO_CLOSE:             27,
        REQUEST_SCENARIO:           28,
        SET_CAMERA_TARGET:          29,
        EQUIP_ITEM:                 30,
        UNEQUIP_ITEM:               31,
        DROP_ITEM:                  32,
        STASH_ITEM:                 33,
        TAKE_STASH_ITEM:            34,
        TAKE_WORLD_ITEM:            35,
        SET_PLAYER_STATE:           36,
        SCENARIO_UPDATE:            37,
        DEBUG_VIEW_TOGGLE:          38,
        DEBUG_VIEW_MODELS:          39,
        DEBUG_TEXT:                 40,
        TOGGLE_GUI_PAGE:            41,
        DEBUG_STATS_POOLS:          42,
        MAIN_CHAR_STATE_EVENT:      43,
        MAIN_CHAR_STATUS_EVENT:     44,
        MAIN_CHAR_REGISTER_HOSTILE: 45,
        MAIN_CHAR_SELECT_TARGET:    46,
        MAIN_CHAR_ENGAGE_TARGET:    47,
        MAIN_CHAR_RETURN_HOME:      48,
        SCENARIO_TEXT:              49,
        SCENARIO_HEADER:            50,
        SWITCH_BACK_GUI_PAGE:       51,
        TOGGLE_AUTO_TURN_PAUSE:     52,
        CHEAT_APPLY_PIMP:           53,
        MAIN_CHAR_OPEN_TARGET:      54,
        SWITCH_GUI_PAGE:            55,
        SET_COMPANION_AS_LEADER:    57,
        ACTIVATE_NAV_POINTS:        58,
        SET_CAMERA_MODE:            59,
        GAME_MODE_WALK:             60,
        GAME_MODE_BATTLE:           61,
        LOAD_ACTOR:                 62,
        TRAVEL_TO:                  63,
        SPAWN_EFFECT:               64,
        INDICATE_RADIUS:            65,
        EDIT_GROUND:                66,
        EDIT_PARAMETERS:            67,
        NOTIFY_LOAD_PROGRESS:       68,
        NOTIFY_LOAD_COMPLETED:      69,
        COLLECT_DEBUG_STATS:        70,
        SKY_GRADIENT_UPDATE:        71,
        SELECT_ADVENTURER:          72,
        LOAD_ITEM:                  73,
        LOAD_ADVENTURE_ENCOUNTERS:  74,
        SET_CAMERA_STATUS:          75,
        SEND_SOCKET_MESSAGE:        76,
        ON_SOCKET_MESSAGE:          77,
        DEBUG_STATUS_TOGGLE:        78,
        ENCOUNTER_COMPLETED:        79,
        CLEAR_UI:                   80,
        SET_ACTOR_STATUS:           81,
        ENTER_PORTAL:               82,
        ENCOUNTER_CONVERSE:         83,
        ENCOUNTER_ENGAGE:           84,
        ENCOUNTER_PARTY:            85,
        ENCOUNTER_CHARM:            86,
        ENCOUNTER_INTIMIDATE:       87,
        ENCOUNTER_TRADE:            88,
        ENCOUNTER_QUEST:            89,
        UI_ITEM_DRAG:               90,
        TERRAIN_APPLY_EDIT:         91,
        KEYBOARD_UPDATE:            92,
        CHAT_MESSAGE:               93,
        SPLASH_OCEAN:               94,
        CAMERA_SELECTION:           95
    };

    ENUMS.Protocol = {
        SET_SERVER_STAMP:0,
        MESSAGE_RELAYED:1,
        CLIENT_TO_WORKER:2,
        SERVER_CALL:3,
        SERVER_DISPATCH:4,
        WORKER_LOADED:5
    };

    ENUMS.ClientRequests = {
        ENCOUNTER_INIT:1,
        REGISTER_PLAYER:2,
        LOAD_SERVER_ACTOR:3,
        SERVER_PING:4,
        APPLY_ACTOR_STATUS:5,
        APPLY_ITEM_STATUS:6,
        APPLY_ACTION_STATUS:7,
        LOAD_SERVER_ITEM: 8,
        ENCOUNTER_PLAY:9,
        REGISTER_CONFIGS:10,
        APPLY_ACTION_EFFECT:11,
        UPDATE_STRONGHOLD:12,
        WRITE_FILE:13,
        READ_FILE:14,
        SEND_CHAT_MESSAGE:15
    };

    ENUMS.ServerCommands = {
        ENCOUNTER_TRIGGER:1,
        ENCOUNTER_START:2,
        ENCOUNTER_UPDATE:3,
        ENCOUNTER_CLOSE:4,
        PLAYER_CONNECTED:5,
        PLAYER_UPDATE:6,
        PLAYER_DISCONNECTED:7,
        ACTOR_INIT:8,
        ACTOR_UPDATE:9,
        ACTOR_REMOVED:10,
        ITEM_INIT:11,
        ITEM_UPDATE:12,
        ITEM_REMOVED:13,
        SYSTEM_INFO: 14,
        ACTION_UPDATE:15,
        FETCH_CONFIGS:16,
        STRONGHOLD_UPDATE:17,
        LOAD_FILE_DATA:18,
        PROCESS_CHAT_MESSAGE:19
    };

    ENUMS.PlayerStatus = {
        PLAYER_ID:'PLAYER_ID',
        PLAYER_NAME:'PLAYER_NAME',
        CONTROLLABLE_ID:'CONTROLLABLE_ID'
    };

    ENUMS.ControllableStatus = {
        CONTROLLABLE_ID:'CONTROLLABLE_ID'
    }

    ENUMS.AccountStatus = {
        INIT_TIME:'INIT_TIME',
        TIMESTAMP:'TIMESTAMP',
        LOGIN_COUNT:'LOGIN_COUNT',
        ACCOUNT_SETTINGS:'ACCOUNT_SETTINGS'
    }

    ENUMS.Settings = {
        ENVIRONMENT_INDEX:'ENVIRONMENT_INDEX',
        BATTLE_CAMERA_MODE:'BATTLE_CAMERA_MODE',
        DRAW_TILE_BOXES:'DRAW_TILE_BOXES',
        RENDER_SCALE:'RENDER_SCALE',
        NETWORK_RANDOM_DELAY:'NETWORK_RANDOM_DELAY',
        ADVENTURE_AUTO_SELECT_DISTANCE:'ADVENTURE_AUTO_SELECT_DISTANCE',
        TERRAIN_RANGE:'TERRAIN_RANGE',
        INSTANCE_MULTIPLIER:'INSTANCE_MULTIPLIER',
        LOD_BIAS:'LOD_BIAS',
        VIEW_DISTANCE:'VIEW_DISTANCE',
        VEGETATION_DENSITY:'VEGETATION_DENSITY',
        VEGETATION_RANGE:'VEGETATION_RANGE',
        CAMERA_HORIZONTAL:'CAMERA_HORIZONTAL',
        CAMERA_VERTICAL:'CAMERA_VERTICAL',
        ZOOM_MAX:'ZOOM_MAX',
        ZOOM_MIN:'ZOOM_MIN',
        ZOOM_STRENGTH:'ZOOM_STRENGTH',
        LOOK_AHEAD:'LOOK_AHEAD',
        ABOVE_HEIGHT:'ABOVE_HEIGHT',
        LOOK_ABOVE:'LOOK_ABOVE',
        RIG_STIFFNESS:'RIG_STIFFNESS',
        CAMERA_TERRAIN_MIN:'CAMERA_TERRAIN_MIN',
        ROTATION_COMPENSATION:'ROTATION_COMPENSATION',
        CHARACTER_STIFFNESS:'CHARACTER_STIFFNESS',
        OBSTRUCTION_REACTIVITY:'OBSTRUCTION_REACTIVITY',
        OBSTRUCTION_PENETRATION:'OBSTRUCTION_PENETRATION',
        ROLL_INFLUENCE:'ROLL_INFLUENCE',
        PITCH_INFLUENCE:'PITCH_INFLUENCE',
        YAW_INFLUENCE:'YAW_INFLUENCE',
        THROTTLE_INFLUENCE:'THROTTLE_INFLUENCE',
        FLIGHT_LOOK_AHEAD:'FLIGHT_LOOK_AHEAD',
        FLIGHT_LOOK_ABOVE:'FLIGHT_LOOK_ABOVE',
        FLIGHT_ELEVATION:'FLIGHT_ELEVATION',
        FLIGHT_STIFFNESS:'FLIGHT_STIFFNESS',
        FLIGHT_ROTATION_COMPENSATION:'FLIGHT_ROTATION_COMPENSATION',
        DEBUG_VIEW_ACTIVE:'DEBUG_VIEW_ACTIVE',
        DEBUG_VIEW_RAYCASTS:'DEBUG_VIEW_RAYCASTS',
        DEBUG_VIEW_WHEELS:'DEBUG_VIEW_WHEELS',
        DEBUG_VIEW_LOD_TESTS:'DEBUG_VIEW_LOD_TESTS',
        DEBUG_VIEW_TERRAIN_QUERIES:'DEBUG_VIEW_TERRAIN_QUERIES',
        DEBUG_VIEW_PHYSICS_SENSORS:'DEBUG_VIEW_PHYSICS_SENSORS',
        DEBUG_VIEW_PHYSICS_KINEMATICS:'DEBUG_VIEW_PHYSICS_KINEMATICS',
        DEBUG_VIEW_PHYSICS_AABBS:'DEBUG_VIEW_PHYSICS_AABBS',
        DEBUG_VIEW_SKELETONS:'DEBUG_VIEW_SKELETONS',
        DEBUG_VIEW_ATTACHMENTS:'DEBUG_VIEW_ATTACHMENTS',
        DEBUG_VIEW_PERFORMANCE:'DEBUG_VIEW_PERFORMANCE',
        DEBUG_VIEW_STATUS:'DEBUG_VIEW_STATUS',
        PHYSICAL_DEBRIS:'PHYSICAL_DEBRIS',
        DEBRIS_RANGE:'DEBRIS_RANGE',
        DEBRIS_SCALE:'DEBRIS_SCALE',
        DEBRIS_SCALE_MIN:'DEBRIS_SCALE_MIN',
        DEBRIS_SCALE_MAX:'DEBRIS_SCALE_MAX',
        DEBRIS_DEFORM:'DEBRIS_DEFORM',
        ACTOR_INFLUENCE_PROBES:'ACTOR_INFLUENCE_PROBES',
        ACTOR_INFLUENCE_REACH:'ACTOR_INFLUENCE_REACH',
        ACTOR_INFLUENCE_POWER:'ACTOR_INFLUENCE_POWER',
        PHYSICS_VFX_INTENSITY:'PHYSICS_VFX_INTENSITY',
        BATTLE_BUTTON_LAYER:'BATTLE_BUTTON_LAYER',
        BATTLE_BUTTON_SCALE:'BATTLE_BUTTON_SCALE',
        BATTLE_POINT_MOVE:'BATTLE_POINT_MOVE',

        OFFSET_CONTROL_STICK_X:'OFFSET_CONTROL_STICK_X',
        OFFSET_CONTROL_STICK_Y:'OFFSET_CONTROL_STICK_Y',
        OFFSET_CHAT_X:'OFFSET_CHAT_X',
        OFFSET_CHAT_Y:'OFFSET_CHAT_Y',
        CHAT_SCALE:'CHAT_SCALE',
        OFFSET_MINIMAP_X:'OFFSET_MINIMAP_X',
        OFFSET_MINIMAP_Y:'OFFSET_MINIMAP_Y',
        SCALE_MINIMAP:'SCALE_MINIMAP',
        OFFSET_ADVENTURES_X:'OFFSET_ADVENTURES_X',
        OFFSET_ADVENTURES_Y:'OFFSET_ADVENTURES_Y',
        SCALE_ADVENTURES:'SCALE_ADVENTURES',
        OFFSET_RBAR_X:'OFFSET_RBAR_X',
        OFFSET_RBAR_Y:'OFFSET_RBAR_Y',
        SCALE_RBAR:'SCALE_RBAR',
        TORQUE_BOOST:'TORQUE_BOOST',
        SHOW_PIECE_POINTS:'SHOW_PIECE_POINTS',
        SHOW_FLIGHT_FORCES:'SHOW_FLIGHT_FORCES',
        ADD_SURFACE_UP_FORCE:'ADD_SURFACE_UP_FORCE'
    }

    ENUMS.StrongholdStatus = {
        CLIENT_STAMP:'CLIENT_STAMP',
        TEMPLATE:'TEMPLATE',
        STRONGHOLD_ID:'STRONGHOLD_ID',
        STRONGHOLD_NAME:'STRONGHOLD_NAME',
        ENTRANCE:'ENTRANCE',
        POS:'POS',
        ROT:'ROT',
        SCALE:'SCALE',
        PALETTE:'PALETTE',
        MODEL:'MODEL'
    }

    ENUMS.ActorStatus = {
        ACTOR_ID:'ACTOR_ID',
        IS_ACTIVE:'IS_ACTIVE',
        RIGID_BODY_CONTACT:'RIGID_BODY_CONTACT',
        ACTIVATION_STATE:'ACTIVATION_STATE',
        TURN_STATE:'TURN_STATE',
        REQUEST_TURN_STATE:'REQUEST_TURN_STATE',
        EXISTS:'EXISTS',
        CONFIG_ID:'CONFIG_ID',
        SPATIAL_DELTA:'SPATIAL_DELTA',
        UPDATE_DELTA:'UPDATE_DELTA',
        LAST_UPDATE:'LAST_UPDATE',
        CLIENT_STAMP:'CLIENT_STAMP',
        PLAYER_STAMP:'PLAYER_STAMP',
        ACTOR_INDEX:'ACTOR_INDEX',
        ACTOR_LEVEL:'ACTOR_LEVEL',
        EQUIP_REQUESTS:'EQUIP_REQUESTS',
        EQUIPPED_ITEMS:'EQUIPPED_ITEMS',

        SLOT_HEAD:      'SLOT_HEAD',
        SLOT_BODY:      'SLOT_BODY',
        SLOT_CHEST:     'SLOT_CHEST',
        SLOT_WRIST:     'SLOT_WRIST',
        SLOT_HANDS:     'SLOT_HANDS',
        SLOT_WAIST:     'SLOT_WAIST',
        SLOT_LEGS:      'SLOT_LEGS',
        SLOT_SKIRT:     'SLOT_SKIRT',
        SLOT_FEET:      'SLOT_FEET',
        SLOT_HAND_R:    'SLOT_HAND_R',
        SLOT_HAND_L:    'SLOT_HAND_L',
        SLOT_BACK:      'SLOT_BACK',
        SLOT_WRIST_L:   'SLOT_WRIST_L',
        SLOT_WRIST_R:   'SLOT_WRIST_R',

        INVENTORY_ITEMS:'INVENTORY_ITEMS',
        ATTITUDE:'ATTITUDE',
        ACTIONS:'ACTIONS',
        PASSIVE_ACTIONS:'PASSIVE_ACTIONS',
        MOVEMENT_SPEED:'MOVEMENT_SPEED',
        RETREATING:'RETREATING',
        EXIT_ENCOUNTER:'EXIT_ENCOUNTER',
        DAMAGE_APPLIED:'DAMAGE_APPLIED',
        HEALING_APPLIED:'HEALING_APPLIED',
        DEAD:'DEAD',
        IS_LEAPING:'IS_LEAPING',
        MOVE_STATE:'MOVE_STATE',
        BODY_STATE:'BODY_STATE',
        STAND_STATE:'STAND_STATE',
        PATH_POINTS:'PATH_POINTS',
        NAVIGATION_STATE:'NAVIGATION_STATE',
        ACTIVE_UI_STATES:'ACTIVE_UI_STATES',
        IN_COMBAT:'IN_COMBAT',
        COMBAT_STATUS:'COMBAT_STATUS',
        ENGAGE_MAX:'ENGAGE_MAX',
        ENGAGED_TARGETS:'ENGAGED_TARGETS',
        ENGAGE_COUNT:'ENGAGE_COUNT',
        HAND_SIZE:'HAND_SIZE',
        HAS_POSITION:'HAS_POSITION',
        POS_X:'POS_X',
        POS_Y:'POS_Y',
        POS_Z:'POS_Z',
        SCALE_X:'SCALE_X',
        SCALE_Y:'SCALE_Y',
        SCALE_Z:'SCALE_Z',
        VEL_X:'VEL_X',
        VEL_Y:'VEL_Y',
        VEL_Z:'VEL_Z',
        QUAT_X:'QUAT_X',
        QUAT_Y:'QUAT_Y',
        QUAT_Z:'QUAT_Z',
        QUAT_W:'QUAT_W',
        HAS_TURN:'HAS_TURN',
        HAS_TURN_INDEX:'HAS_TURN_INDEX',
        TURN_DONE:'TURN_DONE',
        HEIGHT:'HEIGHT',
        HP:'HP',
        ICON_KEY:'ICON_KEY',
        MAX_AP:'MAX_AP',
        MAX_HP:'MAX_HP',
        NAME:'NAME',
        PARTY_SELECTED:'PARTY_SELECTED',
        SIZE:'SIZE',
        TRAVEL:'TRAVEL',
        TRAVEL_MODE:'TRAVEL_MODE',

        SEQUENCER_INITIATIVE:'SEQUENCER_INITIATIVE',
        SEQUENCER_SELECTED:'SEQUENCER_SELECTED',
        SELECTED_TARGET:'SELECTED_TARGET',
        SELECTED_ENCOUNTER:'SELECTED_ENCOUNTER',
        FRAME_TRAVEL_DISTANCE:'FRAME_TRAVEL_DISTANCE',
        REQUEST_PARTY:'REQUEST_PARTY',

        SELECTED_ACTION:'SELECTED_ACTION',
        ACTION_STATE_KEY:'ACTION_STATE_KEY',
        ACTION_STEP_PROGRESS:'ACTION_STEP_PROGRESS',

        ACTIVATING_ENCOUNTER:'ACTIVATING_ENCOUNTER',
        ACTIVATED_ENCOUNTER:'ACTIVATED_ENCOUNTER',
        DEACTIVATING_ENCOUNTER:'DEACTIVATING_ENCOUNTER',
        PLAYER_PARTY:'PLAYER_PARTY',

        ACTOR_SPEED:'ACTOR_SPEED',
        ACTOR_YAW_RATE:'ACTOR_YAW_RATE',
        SELECTING_DESTINATION:'SELECTING_DESTINATION',
        SELECTED_DESTINATION:'SELECTED_DESTINATION',
        STATUS_INPUT_SAMPLERS:'STATUS_INPUT_SAMPLERS',
        STATUS_WALK_SELECTION:'STATUS_WALK_SELECTION',
        STATUS_LEAP_SELECTION:'STATUS_LEAP_SELECTION',
        STRONGHOLD_ID:'STRONGHOLD_ID',
        CAMERA_FOLLOW_SPEED:'CAMERA_FOLLOW_SPEED',
        CAMERA_LOOK_SPEED:'CAMERA_LOOK_SPEED',
        CAMERA_ZOOM:'CAMERA_ZOOM',
        CONTROL_TWITCHINESS:'CONTROL_TWITCHINESS',
        CAM_DRAG_FACTOR:'CAM_DRAG_FACTOR',
        WORLD_LEVEL:'WORLD_LEVEL',
        SELECTED_ADVENTURE:'SELECTED_ADVENTURE',
        ACTIVE_ADVENTURE:'ACTIVE_ADVENTURE',
        COMPLETED_ADVENTURES:'COMPLETED_ADVENTURES',
        ADVENTURE_PROGRESS:'ADVENTURE_PROGRESS',
        ACTOR_STATUS_FLAGS:'ACTOR_STATUS_FLAGS',
        ENCOUNTER_UPDATE_INDEX:'ENCOUNTER_UPDATE_INDEX'
    };

    ENUMS.ControllableStatus = {
        STATUS_AOA_Y:'STATUS_AOA_Y',
        STATUS_AOA_X:'STATUS_AOA_X',
        STATUS_PITCH:'STATUS_PITCH',
        STATUS_ROLL:'STATUS_ROLL',
        STATUS_YAW:'STATUS_YAW',
        STATUS_ANGLE_PITCH:'STATUS_ANGLE_PITCH',
        STATUS_ANGLE_ROLL:'STATUS_ANGLE_ROLL',
        STATUS_ANGLE_YAW:'STATUS_ANGLE_YAW',
        STATUS_ANGLE_NORTH:'STATUS_ANGLE_NORTH',
        STATUS_ANGLE_EAST:'STATUS_ANGLE_EAST',
        STATUS_ANGLE_SOUTH:'STATUS_ANGLE_SOUTH',
        STATUS_ANGLE_WEST:'STATUS_ANGLE_WEST',
        STATUS_CLIMB_RATE:'STATUS_CLIMB_RATE',
        STATUS_ELEVATION:'STATUS_ELEVATION',
        STATUS_CLIMB_0:'STATUS_CLIMB_0',
        STATUS_CLIMB_1:'STATUS_CLIMB_1',
        STATUS_CLIMB_2:'STATUS_CLIMB_2',
        STATUS_CLIMB_3:'STATUS_CLIMB_3',
        STATUS_CLIMB_4:'STATUS_CLIMB_4',
        STATUS_FORWARD:'STATUS_FORWARD',
        STATUS_SPEED:'STATUS_SPEED'
    }

    ENUMS.InstanceStatus = {
        SUSP_COMP_WHEEL_0:'SUSP_COMP_WHEEL_0',
        SUSP_COMP_WHEEL_1:'SUSP_COMP_WHEEL_1',
        SUSP_COMP_WHEEL_2:'SUSP_COMP_WHEEL_2',
        SUSP_COMP_WHEEL_3:'SUSP_COMP_WHEEL_3',
        WEIGHT_ON_WHEELS:'WEIGHT_ON_WHEELS',
        WEIGHT_ON_WATER:'WEIGHT_ON_WATER',
        TAXI_SLOW:'TAXI_SLOW',
        SPEED_AIR:'SPEED_AIR',
        FLAP_ENGAGE:'FLAP_ENGAGE',
        FORCE_G:'FORCE_G'
    }

    ENUMS.PointStatus = {
        FORCE_X:'FORCE_X',
        FORCE_Y:'FORCE_Y',
        FORCE_Z:'FORCE_Z'
    }

    ENUMS.SurfaceStatus = {
        AOA_X:'AOA_X',
        AOA_Y:'AOA_Y',
        LIFT_X:'LIFT_X',
        LIFT_Y:'LIFT_Y',
        DRAG_N:'DRAG_N',
        POS_X:'POS_X',
        POS_Y:'POS_Y',
        POS_Z:'POS_Z',
        SCALE_X:'SCALE_X',
        SCALE_Y:'SCALE_Y',
        SCALE_Z:'SCALE_Z',
        VEL_X:'VEL_X',
        VEL_Y:'VEL_Y',
        VEL_Z:'VEL_Z',
        QUAT_X:'QUAT_X',
        QUAT_Y:'QUAT_Y',
        QUAT_Z:'QUAT_Z',
        QUAT_W:'QUAT_W',
        NORMAL_X:'NORMAL_X',
        NORMAL_Y:'NORMAL_Y',
        NORMAL_Z:'NORMAL_Z'
    }

ENUMS.CombatStatus = {
    LEAPING:1,
    RUSHGIN:2,
    PUSHED:3,
    PRONE:4,
    STUNNED:5,
    BLEEDING:6
}

ENUMS.NavigationState = {
    WORLD:'WORLD',
    PARTY:'PARTY',
    CHARACTER:'CHARACTER',
    HOME:'HOME',
    INVENTORY:'INVENTORY',
    MAP:'MAP',
    NONE:'NONE',
    SETTINGS:'SETTINGS'
}

ENUMS.UiStates = {
    CHARACTER:'CHARACTER',
    INVENTORY:'INVENTORY',
    STASH:'STASH',
    TRADE:'TRADE',
    CRAFT:'CRAFT',
    VENDOR:'VENDOR'
}

    ENUMS.TurnState = {
        NO_TURN:'NO_TURN',
        TURN_INIT:'TURN_INIT',
        TILE_SELECT:'TILE_SELECT',
        TURN_MOVE:'TURN_MOVE',
        TARGET_SELECT:'TARGET_SELECT',
        TARGET_EVALUATE:'TARGET_EVALUATE',
        ACTION_SELECT:'ACTION_SELECT',
        ACTION_APPLY:'ACTION_APPLY',
        TURN_CLOSE:'TURN_CLOSE'
    }

    ENUMS.StatusModifiers = {
        APPLY_DAMAGE:'APPLY_DAMAGE',
        APPLY_HEAL:'APPLY_HEAL',
        SELECT_LEAP:'SELECT_LEAP',
        APPLY_LEAP:'APPLY_LEAP',
        APPLY_KNOCKBACK:'APPLY_KNOCKBACK'
    }

    ENUMS.Attitude = {
        FRIENDLY:'FRIENDLY',
        NEUTRAL:'NEUTRAL',
        HOSTILE:'HOSTILE'
    }

    ENUMS.Interactions = {
        USE:'USE',
        ENTER:'ENTER',
        FIGHT:'FIGHT',
        LEAVE:'LEAVE',
        TALK:'TALK',
        SNEAK:'SNEAK',
        TRADER:'TRADE',
        CRAFT:'CRAFT',
        STEAL:'STEAL',
        PICKUP:'PICKUP'
    }

    ENUMS.ItemStatus = {
        ITEM_ID:'ITEM_ID',
        TEMPLATE:'TEMPLATE',
        ACTOR_ID:'ACTOR_ID',
        PALETTE_VALUES:'PALETTE_VALUES',
        EQUIPPED_SLOT:'EQUIPPED_SLOT',
        MODIFIERS:'MODIFIERS',
        ACTIVATION_STATE:'ACTIVATION_STATE',
        NAME:'NAME',
        TEXT:'TEXT',
        ITEM_LEVEL:'ITEM_LEVEL',
        ITEM_TYPE:'ITEM_TYPE',
        QUALITY:'QUALITY',
        RARITY:'RARITY',
        ITEM_RANK:'ITEM_RANK',
        RANK_ECHELON:'RANK_ECHELON',
        ITEM_POTENCY:'ITEM_POTENCY',
        POTENCY_ECHELON:'POTENCY_ECHELON',
        STACK_SIZE:'STACK_SIZE',
        WORLD_LEVEL:'WORLD_LEVEL',
        POS:'POS',
        QUAT:'QUAT',
        SIZE_XYZ:'SIZE_XYZ',
        CHILD_ITEMS:'CHILD_ITEMS'
    }

    ENUMS.itemTypes = {
        KNIFE:'KNIFE',
        DAGGER:'DAGGER',
        SWORD:'SWORD',
        SHORT_SWORD:'SHORT_SWORD',
        RAPIER:'RAPIER',
        SABRE:'SABRE',
        CUTLASS:'CUTLASS',
        SCIMITAR:'SCIMITAR',
        KATANA:'KATANA',
        NINJATO:'NINJATO',
        WAKIZASHI:'WAKIZASHI',
        LONG_SWORD:'LONG_SWORD',
        BROAD_SWORD:'BROAD_SWORD',
        BASTARD_SWORD:'BASTARD_SWORD',
        GREAT_SWORD:'GREAT_SWORD',
        AXE:'AXE',
        HAND_AXE:'HAND_AXE',
        HATCHET:'HATCHET',
        BATTLE_AXE:'BATTLE_AXE',
        GREAT_AXE:'GREAT_AXE',
        DOUBLE_AXE:'DOUBLE_AXE',
        CLUB:'CLUB',
        MACE:'MACE',
        WAR_HAMMER:'WAR_HAMMER',
        FLAIL:'FLAIL',
        STAVE:'STAVE',
        POLEAXE:'POLEAXE',
        POLE_ARM:'POLE_ARM',
        SPEAR:'SPEAR',
        CLOTH:'CLOTH',
        STUDDED_CLOTH:'STUDDED_CLOTH',
        PLATED_CLOTH:'PLATED_CLOTH',
        LEATHER:'LEATHER',
        LEATHER_ARMOR:'LEATHER_ARMOR',
        STUDDED_LEATHER:'STUDDED_LEATHER',
        LAMINATED_ARMOR:'LAMINATED_ARMOR',
        CHAIN_MAIL:'CHAIN_MAIL',
        SCALE_MAIL:'SCALE_MAIL',
        PLATE_MAIL:'PLATE_MAIL',
        WEAPON:'WEAPON',
        ARMOR:'ARMOR',
        CURRENCY:'CURRENCY',
        MATERIAL:'MATERIAL',
        QUEST:'QUEST',
        VEHICLE:'VEHICLE',
        MOUNT:'MOUNT',
        GADGET:'GADGET',
        LORE:'LORE',
        KIT:'KIT',
        BUILDING:'BUILDING',
        RECIPE:'RECIPE',
        CONSUMABLE:'CONSUMABLE',
        CONTAINER:'CONTAINER',
        ESTATE:'ESTATE',
        DEED:'DEED',
        CLASS:'CLASS',
        SUBCLASS:'SUBCLASS'
    }

    ENUMS.Material = {
        METAL:'METAL',
        LEATHER:'LEATHER',
        CLOTH:'CLOTH',
        WOOD:'WOOD',
        STONE:'STONE',
        CHEMICALS:'CHEMICALS',

        METAL_GOLD:'METAL_GOLD',
        METAL_SILVER:'METAL_SILVER',
        METAL_COPPER:'METAL_COPPER',
        METAL_IRON:'METAL_IRON',
        METAL_STEEL:'METAL_STEEL',
        LEATHER_GOAT:'LEATHER_GOAT',
        LEATHER_OXEN:'LEATHER_OXEN',
        CLOTH_COTTON:'CLOTH_COTTON',
        CLOTH_WOOL:'CLOTH_WOOL',
        THREAD_COTTON:'THREAD_COTTON',
        THREAD_WOOL:'THREAD_WOOL',
        WOOD_ELM:'WOOD_ELM',
        WOOD_BIRCH:'WOOD_BIRCH',
        WOOD_OAK:'WOOD_OAK',
        STONE_GRANITE:'STONE_GRANITE',
        STONE_OBSIDIAN:'STONE_OBSIDIAN',
        LIQUID_CHEMICALS:'LIQUID_CHEMICALS',
        LIQUID_COOLANT:'LIQUID_COOLANT'
    }

    ENUMS.Component = {
        STUDS:'STUDS',
        RINGS:'RINGS',
        BLADE:'BLADE',
        BOLTS:'BOLTS',
        SHAFT:'SHAFT',
        HANDLE:'HANDLE',
        PLATING:'PLATING',
        PADDING:'PADDING',
        WIRE:'WIRE',
        THREAD:'THREAD',
        DYE:'DYE',
        PROCESSING:'PROCESSING'
    }


    ENUMS.quality = {
        POOR:'POOR',
        BASIC:'BASIC',
        GOOD:'GOOD',
        SUPERB:'SUPERB',
        EXCEPTIONAL:'EXCEPTIONAL'
    }

ENUMS.rarity = {
    PLAIN:'PLAIN',
    COMMON:'COMMON',
    UNCOMMON:'UNCOMMON',
    RARE:'RARE',
    EPIC:'EPIC',
    LEGENDARY:'LEGENDARY'
}

ENUMS.echelon = {
    ECHELON_0:0,
    ECHELON_1:1,
    ECHELON_2:2,
    ECHELON_3:3,
    ECHELON_4:4,
    ECHELON_5:5,
    ECHELON_6:6,
    ECHELON_7:7,
    ECHELON_8:8,
    ECHELON_9:9
}

ENUMS.rank = {
    RANK_0: 0,
    RANK_1: 1,
    RANK_2: 2,
    RANK_3: 3,
    RANK_4: 4,
    RANK_5: 5,
    RANK_6: 6,
    RANK_7: 7,
    RANK_8: 8,
    RANK_9: 9,
    RANK_10:10,
    RANK_11:11,
    RANK_12:12,
    RANK_13:13,
    RANK_14:14,
    RANK_15:15,
    RANK_16:16,
    RANK_17:17,
    RANK_18:18,
    RANK_19:19,
    RANK_20:20,
    RANK_21:21,
    RANK_22:22,
    RANK_23:23,
    RANK_24:24,
    RANK_25:25,
    RANK_26:26,
    RANK_27:27,
    RANK_28:28,
    RANK_29:29,
    RANK_30:30,
    RANK_31:31,
    RANK_32:32,
    RANK_33:33,
    RANK_34:34,
    RANK_35:35,
    RANK_36:36,
    RANK_37:37,
    RANK_38:38,
    RANK_39:39,
    RANK_40:40,
    RANK_41:41,
    RANK_42:42,
    RANK_43:43,
    RANK_44:44,
    RANK_45:45,
    RANK_46:46,
    RANK_47:47,
    RANK_48:48,
    RANK_49:49,
}

ENUMS.potency = {
    POTENCY_0:0,
    POTENCY_1:1,
    POTENCY_2:2,
    POTENCY_3:3,
    POTENCY_4:4,
    POTENCY_5:5,
    POTENCY_6:6,
    POTENCY_7:7,
    POTENCY_8:8,
    POTENCY_9:9,
    POTENCY_10:10,
    POTENCY_11:11,
    POTENCY_12:12,
    POTENCY_13:13,
    POTENCY_14:14,
    POTENCY_15:15,
    POTENCY_16:16,
    POTENCY_17:17,
    POTENCY_18:18,
    POTENCY_19:19,
    POTENCY_20:20,
    POTENCY_21:21,
    POTENCY_22:22,
    POTENCY_23:23,
    POTENCY_24:24,
    POTENCY_25:25,
    POTENCY_26:26,
    POTENCY_27:27,
    POTENCY_28:28,
    POTENCY_29:29,
    POTENCY_30:30,
    POTENCY_31:31,
    POTENCY_32:32,
    POTENCY_33:33,
    POTENCY_34:34,
    POTENCY_35:35,
    POTENCY_36:36,
    POTENCY_37:37,
    POTENCY_38:38,
    POTENCY_39:39,
    POTENCY_40:40,
    POTENCY_41:41,
    POTENCY_42:42,
    POTENCY_43:43,
    POTENCY_44:44,
    POTENCY_45:45,
    POTENCY_46:46,
    POTENCY_47:47,
    POTENCY_48:48,
    POTENCY_49:49,
}

    ENUMS.ActionStatus = {
        ACTOR_ID:'ACTOR_ID',
        ACTION_ID:'ACTION_ID',
        ACTION_KEY:'ACTION_KEY',
        BUTTON_STATE:'BUTTON_STATE',
        ACTION_STATE:'ACTION_STATE',
        STEP_START_TIME:'STEP_START_TIME',
        STEP_END_TIME:'STEP_END_TIME',
        SELECTED:'SELECTED',
        TARGET_ID:'TARGET_ID',
        STATUS_MODIFIERS:'STATUS_MODIFIERS',
        RANGE_MIN:'RANGE_MIN',
        RANGE_MAX:'RANGE_MAX',
        REQUIRES_TARGET:'REQUIRES_TARGET',
        ACTION_TRIGGER:'ACTION_TRIGGER'
    }

    ENUMS.Trigger = {
        ON_ACTIVATE:'ON_ACTIVATE',
        ON_CONTACT:'ON_CONTACT',
        ON_ENGAGED:'ON_ENGAGED',
        ON_ENGAGING:'ON_ENGAGING',
        ON_DISENGAGE:'ON_DISENGAGE',
        ON_SELECTED:'ON_SELECTED',
        ON_TURN_START:'ON_TURN_START'
    }

    ENUMS.ButtonState = {
        UNAVAILABLE:      1,
        SELECTED:         2,
        AVAILABLE:        3,
        ACTIVATING:       4,
        ACTIVE:           5,
        ON_COOLDOWN:      6,
        ENABLED:          7,
        DISABLED:         8
    };

    ENUMS.ActionState = {
        DISABLED:      1,
        SELECTED:      2,
        PRECAST:       3,
        ACTIVE:        4,
        APPLY_HIT:     5,
        POST_HIT:      6,
        COMPLETED:     7
    };

    ENUMS.EncounterStatus = {
        CLIENT_STAMP:'CLIENT_STAMP',
        WORLD_ENCOUNTER_ID:'WORLD_ENCOUNTER_ID',
        GRID_ID:'GRID_ID',
        GRID_POS:'GRID_POS',
        ENCOUNTER_ID:'ENCOUNTER_ID',
        ENCOUNTER_ACTORS:'ENCOUNTER_ACTORS',
        ACTOR_COUNT:'ACTOR_COUNT',
        OPPONENT_COUNT:'OPPONENT_COUNT',
        OPPONENTS_ENGAGED:'OPPONENTS_ENGAGED',
        OPPONENTS_DEAD:'OPPONENTS_DEAD',
        PLAYERS_ENGAGED:'PLAYERS_ENGAGED',
        PLAYERS_DEAD:'PLAYERS_DEAD',
        PLAYER_COUNT:'PLAYER_COUNT',
        TURN_INDEX:'TURN_INDEX',
        TURN_STATE:'TURN_STATE',
        UPDATE_INDEX:'UPDATE_INDEX',
        ACTIVE_TURN_SIDE:'ACTIVE_TURN_SIDE',
        HAS_TURN_ACTOR:'HAS_TURN_ACTOR',
        TURN_ACTOR_INITIATIVE:'TURN_ACTOR_INITIATIVE',
        TURN_ACTOR_TARGET:'TURN_ACTOR_TARGET',
        TURN_ACTOR_ACTION:'TURN_ACTOR_ACTION',
        TURN_ACTION_STATE:'TURN_ACTION_STATE',
        ACTIVATION_STATE:'ACTIVATION_STATE',
        PLAYER_VICTORY:'PLAYER_VICTORY'
    }

    ENUMS.ActivationState = {
        UNAVAILABLE:'UNAVAILABLE',
        INIT:'INIT',
        INACTIVE:'INACTIVE',
        ACTIVATING:'ACTIVATING',
        ACTIVE:'ACTIVE',
        DEACTIVATING:'DEACTIVATING',
        DEACTIVATED:'DEACTIVATED',
        REMOVED:'REMOVED'
    }

    ENUMS.EquipmentSlots = {
        SLOT_HEAD:      'SLOT_HEAD',
        SLOT_BODY:      'SLOT_BODY',
        SLOT_CHEST:     'SLOT_CHEST',
        SLOT_WRIST:     'SLOT_WRIST',
        SLOT_HANDS:     'SLOT_HANDS',
        SLOT_WAIST:     'SLOT_WAIST',
        SLOT_LEGS:      'SLOT_LEGS',
        SLOT_SKIRT:     'SLOT_SKIRT',
        SLOT_FEET:      'SLOT_FEET',
        SLOT_HAND_R:    'SLOT_HAND_R',
        SLOT_HAND_L:    'SLOT_HAND_L',
        SLOT_BACK:      'SLOT_BACK',
        SLOT_WRIST_L:   'SLOT_WRIST_L',
        SLOT_WRIST_R:   'SLOT_WRIST_R',
    }

ENUMS.InventorySlots = {
    SLOT_0:      'SLOT_0',
    SLOT_1:      'SLOT_1',
    SLOT_2:      'SLOT_2',
    SLOT_3:      'SLOT_3',
    SLOT_4:      'SLOT_4',
    SLOT_5:      'SLOT_5',
    SLOT_6:      'SLOT_6',
    SLOT_7:      'SLOT_7',
    SLOT_8:      'SLOT_8',
    SLOT_9:      'SLOT_9',
    SLOT_10:     'SLOT_10',
    SLOT_11:     'SLOT_11',
}
ENUMS.StashSlots = {}


ENUMS.Dynamic = {
        WING_SWEEP:'WING_SWEEP'
}

    ENUMS.Controls = {
        SAMPLE_STATUS:'SAMPLE_STATUS',
        CONTROL_PITCH:'CONTROL_PITCH',
        CONTROL_ROLL:'CONTROL_ROLL',
        CONTROL_YAW:'CONTROL_YAW',
        CONTROL_SPEED:'CONTROL_SPEED',
        CONTROL_SWEEP:'CONTROL_SWEEP',
        CONTROL_TILE_X:'CONTROL_TILE_X',
        CONTROL_TILE_Z:'CONTROL_TILE_Z',
        CONTROL_RUN_X:'CONTROL_RUN_X',
        CONTROL_RUN_Z:'CONTROL_RUN_Z',
        CONTROL_MOVE_ACTION:'CONTROL_MOVE_ACTION',
        CONTROL_RUN_ACTION:'CONTROL_RUN_ACTION',
        CONTROL_LEAP_ACTION:'CONTROL_LEAP_ACTION',
        CONTROL_CAM_FORWARD:'CONTROL_CAM_FORWARD'
    }



    ENUMS.CameraModes = {
        worldDisplay:'world_display',
        worldViewer:'world_viewer',
        activateEncounter:'activate_encounter',
        actorTurnMovement:'actor_turn_movement',
        deactivateEncounter:'deactivate_encounter',
        gameCombat:'game_combat',
        gameTravel:'game_travel',
        gameVehicle:'game_vehicle'
    }

    ENUMS.CameraControls = {
        CAM_AUTO:'CAM_AUTO',
        CAM_ORBIT:'CAM_ORBIT',
        CAM_FLIGHT:'CAM_FLIGHT',
        CAM_EDIT:'CAM_EDIT',
        CAM_TARGET:'CAM_TARGET',
        CAM_MOVE:'CAM_MOVE',
        CAM_MENU:'CAM_MENU',
        CAM_AHEAD:'CAM_AHEAD',
        CAM_SHOULDER:'CAM_SHOULDER',
        CAM_SELECT:'CAM_SELECT',
        CAM_PARTY:'CAM_PARTY',
        CAM_SEQUENCER:'CAM_SEQUENCER',
        CAM_ENCOUNTER:'CAM_ENCOUNTER',
        CAM_TRANSLATE:'CAM_TRANSLATE',
        CAM_GRID:'CAM_GRID',
        CAM_HIGH:'CAM_HIGH',
        CAM_LEVEL:'CAM_LEVEL',
        CAM_POINT:'CAM_POINT'
    }

    ENUMS.CameraStatus = {
        CAMERA_MODE:'CAMERA_MODE',
        LOOK_AT:'LOOK_AT',
        LOOK_FROM:'LOOK_FROM',
        POINTER_ACTION:'POINTER_ACTION'
    }

    ENUMS.TravelMode = {
        TRAVEL_MODE_INACTIVE:'TRAVEL_MODE_INACTIVE',
        TRAVEL_MODE_PASSIVE:'TRAVEL_MODE_PASSIVE',
        TRAVEL_MODE_BATTLE:'TRAVEL_MODE_BATTLE',
        TRAVEL_MODE_GRID:'TRAVEL_MODE_GRID',
        TRAVEL_MODE_WALK:'TRAVEL_MODE_WALK',
        TRAVEL_MODE_RUN:'TRAVEL_MODE_RUN',
        TRAVEL_MODE_LEAP:'TRAVEL_MODE_LEAP',
        TRAVEL_MODE_FLY:'TRAVEL_MODE_FLY',
        TRAVEL_MODE_JETPACK:'TRAVEL_MODE_JETPACK',
        TRAVEL_MODE_MENU:'TRAVEL_MODE_MENU'
    }

    ENUMS.Send = {
        CONNECTED:'CONNECTED'
    }

    ENUMS.Animations = {
        IDLE:              0,
        WALK:              1,
        WALK_BODY:         2,
        WALK_COMBAT:       3,
        RUN:               4,
        __:                5,
        ATTACK_1:          6,
        ATTACK_2:          7,
        DEAD:              8,
        FALL:              9,
        IDL_LO_CB:         10,
        IDL_HI_CB:         11,
        SET_LFT_FF:        12,
        GD_LFT_FF:         13,
        SET_RT_FF:         14,
        GD_RT_FF:          15,
        GD_HI_R:           16,
        GD_MID_R:          17,
        GD_LOW_R:          18,
        GD_LNG_R:          19,
        GD_SHT_R:          20,
        GD_BCK_R:          21,
        GD_HNG_R:          22,
        GD_INS_R:          23,
        GD_SID_R:          24,
        SW_BCK_R:          25,
        SW_SID_R:          26,
        CT_TC_R:           27,
        CT_TR_R:           28,
        CT_MR_R:           29,
        CT_ML_R:           30,
        SLEEP:             31,
        DANCE_1:           32,
        DANCE_2:           33,
        DANCE_3:           34,
        DANCE_4:           35,
        BK_SWING:          36,
        HI_SWING:          37,
        JMP_SWING:         38,
        POSE_X:            39,
        POSE_GD:           40,
        POSE_HI:           41,
        POSE_PULD:         42,
        POSE_WODE:         43,
        MLE_PREP:          44,
        MLE_SLSH_HI:       45,
        MLE_SLS_LO:        46,
        PSTL_RECL:         47,
        PSHD_BK:           48,
        RIFL_AIM:          49,
        RIFL_FIRE:         50,
        MLE_RIF_PREP:      51,
        MLE_RIF_RDY:       52,
        MLE_RIF_STRK:      53,
        SIT:               54

    };

    ENUMS.ActionTypes = {
        ATTACK_GREATSWORD:  0,
        ATTACK_SWORD:       1

    };

    ENUMS.Joints = {
        SKIN:               0,
        PROP_1:             1,
        PROP_2:             2,
        PROP_3:             3,
        HEAD:               4,
        PELVIS:             5,
        HAND_L:             6,
        HAND_R:             7,
        GRIP_L:             8,
        GRIP_R:             9,
        FOOT_L:             10,
        FOOT_R:             11,
        SKIN_SCALED:        12,
        SPINE_0:          13,
        SPINE_1:          14,
        SPINE_2:          15,
        UPPER_ARM_R:      16,
        UPPER_ARM_L:      17,
        FOREARM_R:        18,
        FOREARM_L:        19,
        CLAVICLE_R:       20,
        CLAVICLE_L:       21,
        NECK:             22,
        CALF_R:           23,
        CALF_L:           24,
        NEW_1:            25,
        NEW_2:            26
    };

    ENUMS.BufferType = {
        ENVIRONMENT:        0,
        CAMERA:             1,
        SPATIAL:            2,
        TERRAIN:            3,
        EVENT_DATA:         4,
        POSITION:           5,
        NORMAL:             6,
        UV:                 7,
        INDEX:              8,
        INPUT_BUFFER:       9
    };

    ENUMS.Transform = {

    };

    ENUMS.InstanceState = {
        INITIATING:         0,
        ACTIVE_HIDDEN:      1,
        ACTIVE_VISIBLE:     2,
        INACTIVE_VISIBLE:   3,
        INACTIVE_HIDDEN:    4,
        DECOMISSION:        5
    };

    ENUMS.IndexState = {
        INDEX_BOOKED:       0,
        INDEX_RELEASING:    1,
        INDEX_FRAME_CLEANUP:2,
        INDEX_AVAILABLE:    3
    };

    ENUMS.DynamicBone = {
        BONE_INDEX:         0,
        HAS_UPDATE:         1,
        POS_X:              2,
        POS_Y:              3,
        POS_Z:              4,
        QUAT_X:             5,
        QUAT_Y:             6,
        QUAT_Z:             7,
        QUAT_W:             8,
        QUAT_UDATE:         9,
        SCALE_X:            10,
        SCALE_Y:            11,
        SCALE_Z:            12,
        SCALE_UDATE:        13,
        POS_UDATE:          14,
        STRIDE:             15
    };


    ENUMS.Worker = {
        RENDER:             0,
        MAIN_WORKER:        1,
        STATIC_WORLD:       2,
        PHYSICS_WORLD:      3,
        DATA:               4,
        JSON_PIPE:          5,
        IMAGE_PIPE:         6
    };

    ENUMS.PointerStates = {

        DISABLED:       0,
        ENABLED:        1,
        HOVER:          2,
        PRESS_INIT:     3,
        PRESS:          4,
        PRESS_EXIT:     5,
        ACTIVATE:       6,
        ACTIVE:         7,
        ACTIVE_HOVER:   8,
        ACTIVE_PRESS:   9,
        DEACTIVATE:     10
    };

    ENUMS.TerrainFeature = {

        OCEAM:          0,
        SHORELINE:      1,
        STEEP_SLOPE:    2,
        SLOPE:          3,
        FLAT_GROUND:    4,
        WOODS:          5,
        AREA_SECTION:   6,
        SHALLOW_WATER:  7,
        DEEP_WATER:     8

    };

    ENUMS.InputState = {

        MOUSE_X:          0,
        MOUSE_Y:          1,
        WHEEL_DELTA:      2,
        START_DRAG_X:     3,
        START_DRAG_Y:     4,
        DRAG_DISTANCE_X:  5,
        DRAG_DISTANCE_Y:  6,
        ACTION_0:         7,
        ACTION_1:         8,
        LAST_ACTION_0:    9,
        LAST_ACTION_1:    10,
        PRESS_FRAMES:     11,
        VIEW_LEFT:        12,
        VIEW_WIDTH:       13,
        VIEW_TOP:         14,
        VIEW_HEIGHT:      15,
        ASPECT:           16,
        FRUSTUM_FACTOR:   17,
        HAS_UPDATE:       18,
        BUFFER_SIZE:      20

    };

    ENUMS.AttackType = {
        NONE:              0,
        FAST:              1,
        HEAVY:             2
    }

    ENUMS.CharacterState = {
        ALERT:             0,
        IDLE_HANDS:        1,
        ENGAGING:          2,
        COMBAT:            3,
        DISENGAGING:       4,
        DISENGAGED:        5,
        FALL_DOWN:         6,
        LIE_DEAD:          7
    };

    ENUMS.ElementState = {
        NONE:             0,
        HOVER:            1,
        PRESS:            2,
        ACTIVE:           3,
        ACTIVE_HOVER:     4,
        ACTIVE_PRESS:     5,
        DISABLED:         6
    };

    ENUMS.Environments = {
        PRE_DAWN:         1,
        DAWN:             2,
        MORNING:          3,
        SUNNY_DAY:        4,
        HIGH_NOON:        5,
        EVENING:          6,
        NIGHT:            7
    };

    ENUMS.ColorCurve = {
        grad_grey:      127,
        grad_blue_3:    126,
        grad_green_3:   125,
        grad_yellow_3:  124,
        grad_red_3:     123,
        grad_blue_2:    122,
        grad_cyan_2:    121,
        grad_green_2:   120,
        grad_yellow_2: 119,
        grad_red_2:    118,
        grad_blue_deep_1:117,
        grad_blue_1:    116,
        grad_sky_1:     115,
        grad_cyan_1:    114,
        grad_green_1:   113,
        grad_pea_1:     112,
        grad_yellow_1: 111,
        grad_orange_1: 110,
        grad_red_1:    109,
        lut_vdk:       108,
        lut_dk:        107,
        lut_base:      106,
        lut_brt:       105,
        whiteToGrey:   104,
        greyToWhite:   103,
        cyan_1:        102,
        cyan_2:        101,
        cyan_3:        100,
        cyan_4:         99,
        cyan_5:         98,
        yellow_1:       97,
        yellow_2:       96,
        yellow_3:       95,
        yellow_4:       94,
        yellow_5:       93,
        purple_1:       92,
        purple_2:       91,
        purple_3:       90,
        purple_4:       89,
        purple_5:       88,
        orange_1:       87,
        orange_2:       86,
        orange_3:       85,
        orange_4:       84,
        orange_5:       83,
        blue_1:         82,
        blue_2:         81,
        blue_3:         80,
        blue_4:         79,
        blue_5:         88,
        green_1:        77,
        green_2:        76,
        green_3:        75,
        green_4:        74,
        green_5:        73,
        red_1:          72,
        red_2:          71,
        red_3:          70,
        red_4:          69,
        red_5:          68,
        alpha_20:       67,
        alpha_40:       66,
        alpha_60:       65,
        alpha_80:       64,

        flatCyan    :   63,
        brightCyan  :   62,
        threatSixe  :   61,
        threatFive  :   60,
        threatFour  :   59,
        threatThree :   58,
        threatTwo   :   57,
        threatOne   :   56,
        threatZero  :   55,
        steadyOrange:   54,
        darkPurple:     53,
        darkBlue:       52,
        darkRed:        51,
        steadyPurple:   50,
        steadyBlue:     49,
        steadyRed:      48,
        dust:           47,
        earlyFadeOut:   46,
        lateFadeOut:    45,
        flashGrey:      44,
        brightYellow:   43,
        fullWhite:      42,
        greenToPurple:  41,
        blueYellowRed:  40,
        redToYellow:    39,
        qubeIn:         38,
        rootIn:         37,
        randomGreen:    36,
        randomRed:      35,
        randomYellow:   34,
        randomBlue:     33,
        rainbow:        32,
        warmToCold:     31,
        hotFire:        30,
        fire:           29,
        warmFire:       28,
        hotToCool:      27,
        orangeFire:     26,
        smoke:          25,
        dirt:           24,
        brightMix:      23,
        nearWhite:      22,
        darkSmoke:      21,
        nearBlack:      20,
        doubleSin:      19,
        halfSin:        18,
        sin:            17,
        sublteSin:      16,
        pulseSlowOut:   15,
        slowFadeIn:     14,
        halfQuickIn:    13,
        halfFadeIn:     12,
        smooth:         11,
        slowFadeOut:    10,
        dampen:         9,
        noiseFadeOut:   8,
        quickFadeOut:   7,
        quickIn:        6,
        quickInSlowOut: 5,
        zeroOneZero:    4,
        oneZeroOne:     3,
        zeroToOne:      2,
        oneToZero:      1
    };

    ENUMS.Color = {
        WHITE    :    0,
        GREY     :    1,
        PINK     :    2,
        RED      :    3,
        PURPLE   :    4,
        GREEN    :    5,
        PEA      :    6,
        BLUE     :    7,
        AQUA     :    8,
        CYAN     :    9,
        MAGENTA  :    10,
        DARKPURP :    11,
        YELLOW   :    12,
        ORANGE   :    13,
        BLACK    :    14
    };


    ENUMS.TrackStats = {
        R_DYNAMIC :    0,
        RNDR     :    1,
        IDLE_R   :    2,
        R_HEAP   :    3,
        R_MEM    :    4,
        W_HEAP   :    5,
        W_MEM    :    6,
        PHYS_DT  :    7,
        D_CALLS  :    8,
        TRIS     :    9,
        GEOMS    :    10,
        TX_COUNT :    11,
        SHADERS  :    12,
        GUI_DT   :    13,
        GAME_DT  :    14,
        IDLE_W   :    15,
        WORK_DT  :    16,
        LOAD_W   :    17,
        W_EVT_MG :    18,
        EVT_LOAD :    19
    };

    ENUMS.Units = {
        NONE     :    0,
        s        :    1,
        ms       :    2,
        mb       :    3,
        "%"      :    4
    };


    ENUMS.Numbers = {
        event_buffer_size_per_worker:100000,
        POINTER_MOUSE:  0,
        POINTER_TOUCH0: 1,
        TOUCHES_COUNT:  10,
        INSTANCE_PTR_0: 10000,
        PTR_PING_OFFSET: 50000

    };

const mapEnums = function() {
    const map = {};

    for (const key in ENUMS) {
        map[key] = [];

        for (const i in ENUMS[key]) {
            map[key][ENUMS[key][i]] = i;
        }
    }

    ENUMS.Map = map;

    ENUMS.getKey = function(category, index) {
        return ENUMS.Map[category][index];
    }
};

mapEnums();

export {ENUMS}

