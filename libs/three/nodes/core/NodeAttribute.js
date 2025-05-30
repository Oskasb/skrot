/**
 * {@link NodeBuilder} is going to create instances of this class during the build process
 * of nodes. They represent the final shader attributes that are going to be generated
 * by the builder. Arrays of node attributes is maintained in {@link NodeBuilder#attributes}
 * and {@link NodeBuilder#bufferAttributes} for this purpose.
 */
class NodeAttribute {

	/**
	 * Constructs a new node attribute.
	 *
	 * @param {string} name - The name of the attribute.
	 * @param {string} type - The type of the attribute.
	 * @param {?Node} node - An optional reference to the node.
	 */
	constructor( name, type, node = null ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isNodeAttribute = true;

		/**
		 * The name of the attribute.
		 *
		 * @type {string}
		 */
		this.name = name;

		/**
		 * The type of the attribute.
		 *
		 * @type {string}
		 */
		this.type = type;

		/**
		 * An optional reference to the node.
		 *
		 * @type {?Node}
		 * @default null
		 */
		this.node = node;

	}

}

export default NodeAttribute;
