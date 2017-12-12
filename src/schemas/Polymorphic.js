import { isImmutable } from './ImmutableUtils';

export default class PolymorphicSchema {
  constructor(definition, schemaAttribute) {
    if (schemaAttribute) {
      this._schemaAttribute = typeof schemaAttribute === 'string' ?
        (input) => input[schemaAttribute] :
        schemaAttribute;
    }
    this.define(definition);
  }

  get isSingleSchema() {
    return !this._schemaAttribute;
  }

  define(definition) {
    this.schema = definition;
  }

  getSchemaAttribute(input, parent, key) {
    return !this.isSingleSchema && this._schemaAttribute(input, parent, key);
  }

  inferSchema(input, parent, key) {
    if (this.isSingleSchema) {
      return this.schema;
    }

    const attr = this.getSchemaAttribute(input, parent, key);
    return this.schema[attr];
  }

  normalizeValue(value, parent, key, visit, addEntity) {
    const schema = this.inferSchema(value, parent, key);
    if (!schema) {
      return value;
    }
    const normalizedValue = visit(value, parent, key, schema, addEntity);
    
    // NOTE: We are using type as reference to schema, so to simplify result we always return only
    // normalized value
    return normalizedValue;
    // return this.isSingleSchema || normalizedValue === undefined || normalizedValue === null ?
    //  normalizedValue :
    //  { id: normalizedValue, schema: this.getSchemaAttribute(value, parent, key) };
  }

  denormalizeValue(value, unvisit) {
    const schemaKey = isImmutable(value) ? value.get('schema') : value.schema;
    if (!this.isSingleSchema && !schemaKey) {
      return value;
    }
    const id = isImmutable(value) ? value.get('id') : value.id;
    // TODO: use type
    const schema = this.isSingleSchema ? this.schema : this.schema[schemaKey];
    return unvisit(id || value, schema);
  }
}
