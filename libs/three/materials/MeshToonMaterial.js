import { TangentSpaceNormalMap } from '../constants.js';
import { Material } from './Material.js';
import { Vector2 } from '../math/Vector2.js';
import { Color } from '../math/Color.js';

/**
 * A material implementing toon shading.
 *
 * @augments Material
 */
class MeshToonMaterial extends Material {

	/**
	 * Constructs a new mesh toon material.
	 *
	 * @param {Object} [parameters] - An object with one or more properties
	 * defining the material's appearance. Any property of the material
	 * (including any property from inherited materials) can be passed
	 * in here. Color values can be passed any type of value accepted
	 * by {@link Color#set}.
	 */
	constructor( parameters ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isMeshToonMaterial = true;

		this.defines = { 'TOON': '' };

		this.type = 'MeshToonMaterial';

		/**
		 * Color of the material.
		 *
		 * @type {Color}
		 * @default (1,1,1)
		 */
		this.color = new Color( 0xffffff );

		/**
		 * The color map. May optionally include an alpha channel, typically combined
		 * with {@link Material#transparent} or {@link Material#alphaTest}. The texture map
		 * color is modulated by the diffuse `color`.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.map = null;

		/**
		 * Gradient map for toon shading. It's required to set
		 * {@link Texture#minFilter} and {@link Texture#magFilter} to {@linkNearestFilter}
		 * when using this type of texture.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.gradientMap = null;

		/**
		 * The light map. Requires a second set of UVs.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.lightMap = null;

		/**
		 * Intensity of the baked light.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.lightMapIntensity = 1.0;

		/**
		 * The red channel of this texture is used as the ambient occlusion map.
		 * Requires a second set of UVs.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.aoMap = null;

		/**
		 * Intensity of the ambient occlusion effect. Range is `[0,1]`, where `0`
		 * disables ambient occlusion. Where intensity is `1` and the AO map's
		 * red channel is also `1`, ambient light is fully occluded on a surface.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.aoMapIntensity = 1.0;

		/**
		 * Emissive (light) color of the material, essentially a solid color
		 * unaffected by other lighting.
		 *
		 * @type {Color}
		 * @default (0,0,0)
		 */
		this.emissive = new Color( 0x000000 );

		/**
		 * Intensity of the emissive light. Modulates the emissive color.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.emissiveIntensity = 1.0;

		/**
		 * Set emissive (glow) map. The emissive map color is modulated by the
		 * emissive color and the emissive intensity. If you have an emissive map,
		 * be sure to set the emissive color to something other than black.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.emissiveMap = null;

		/**
		 * The texture to create a bump map. The black and white values map to the
		 * perceived depth in relation to the lights. Bump doesn't actually affect
		 * the geometry of the object, only the lighting. If a normal map is defined
		 * this will be ignored.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.bumpMap = null;

		/**
		 * How much the bump map affects the material. Typical range is `[0,1]`.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.bumpScale = 1;

		/**
		 * The texture to create a normal map. The RGB values affect the surface
		 * normal for each pixel fragment and change the way the color is lit. Normal
		 * maps do not change the actual shape of the surface, only the lighting. In
		 * case the material has a normal map authored using the left handed
		 * convention, the `y` component of `normalScale` should be negated to compensate
		 * for the different handedness.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.normalMap = null;

		/**
		 * The type of normal map.
		 *
		 * @type {(TangentSpaceNormalMap|ObjectSpaceNormalMap)}
		 * @default TangentSpaceNormalMap
		 */
		this.normalMapType = TangentSpaceNormalMap;

		/**
		 * How much the normal map affects the material. Typical value range is `[0,1]`.
		 *
		 * @type {Vector2}
		 * @default (1,1)
		 */
		this.normalScale = new Vector2( 1, 1 );

		/**
		 * The displacement map affects the position of the mesh's vertices. Unlike
		 * other maps which only affect the light and shade of the material the
		 * displaced vertices can cast shadows, block other objects, and otherwise
		 * act as real geometry. The displacement texture is an image where the value
		 * of each pixel (white being the highest) is mapped against, and
		 * repositions, the vertices of the mesh.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.displacementMap = null;

		/**
		 * How much the displacement map affects the mesh (where black is no
		 * displacement, and white is maximum displacement). Without a displacement
		 * map set, this value is not applied.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.displacementScale = 1;

		/**
		 * The offset of the displacement map's values on the mesh's vertices.
		 * The bias is added to the scaled sample of the displacement map.
		 * Without a displacement map set, this value is not applied.
		 *
		 * @type {number}
		 * @default 0
		 */
		this.displacementBias = 0;

		/**
		 * The alpha map is a grayscale texture that controls the opacity across the
		 * surface (black: fully transparent; white: fully opaque).
		 *
		 * Only the color of the texture is used, ignoring the alpha channel if one
		 * exists. For RGB and RGBA textures, the renderer will use the green channel
		 * when sampling this texture due to the extra bit of precision provided for
		 * green in DXT-compressed and uncompressed RGB 565 formats. Luminance-only and
		 * luminance/alpha textures will also still work as expected.
		 *
		 * @type {?Texture}
		 * @default null
		 */
		this.alphaMap = null;

		/**
		 * Renders the geometry as a wireframe.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.wireframe = false;

		/**
		 * Controls the thickness of the wireframe.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.wireframeLinewidth = 1;

		/**
		 * Defines appearance of wireframe ends.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.wireframeLinecap = 'round';

		/**
		 * Defines appearance of wireframe joints.
		 *
		 * Can only be used with {@link SVGRenderer}.
		 *
		 * @type {('round'|'bevel'|'miter')}
		 * @default 'round'
		 */
		this.wireframeLinejoin = 'round';

		/**
		 * Whether the material is affected by fog or not.
		 *
		 * @type {boolean}
		 * @default true
		 */
		this.fog = true;

		this.setValues( parameters );

	}

	copy( source ) {

		super.copy( source );

		this.color.copy( source.color );

		this.map = source.map;
		this.gradientMap = source.gradientMap;

		this.lightMap = source.lightMap;
		this.lightMapIntensity = source.lightMapIntensity;

		this.aoMap = source.aoMap;
		this.aoMapIntensity = source.aoMapIntensity;

		this.emissive.copy( source.emissive );
		this.emissiveMap = source.emissiveMap;
		this.emissiveIntensity = source.emissiveIntensity;

		this.bumpMap = source.bumpMap;
		this.bumpScale = source.bumpScale;

		this.normalMap = source.normalMap;
		this.normalMapType = source.normalMapType;
		this.normalScale.copy( source.normalScale );

		this.displacementMap = source.displacementMap;
		this.displacementScale = source.displacementScale;
		this.displacementBias = source.displacementBias;

		this.alphaMap = source.alphaMap;

		this.wireframe = source.wireframe;
		this.wireframeLinewidth = source.wireframeLinewidth;
		this.wireframeLinecap = source.wireframeLinecap;
		this.wireframeLinejoin = source.wireframeLinejoin;

		this.fog = source.fog;

		return this;

	}

}

export { MeshToonMaterial };
