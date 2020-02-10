import "reflect-metadata";
import _ from "lodash";

type ValidatorType = (value: any) => boolean;
type ValidatorTypes = ValidatorType | ValidatorType[];
type DeserializerType = (value: any) => any;
type SerializeType = (value: any) => any;

export interface DataMemberProperty {
    name?: string;                      // the json name of the member. default is property name.
    type?: any;                         // the type of the member. default is the design type of the property.
    itemType?: any;                     // the item type of the member if type is Array. 
                                        // Item type can't be got from reflection.
                                        // You have to manually specify it for array members.
    keyType?: any;                      // the key type if type is Map
                                        // Key type can't be got from reflection
                                        // You have to manually specify it for Map members.
    valueType?: any;                    // the value type if type is Map
                                        // Value type can't be got from reflection
                                        // You have to manually specify it for Map members.
    validate?: ValidatorTypes;          // a list of validate functions.
    deserialize?: DeserializerType;     // customized deserialize function.
    serialize?: SerializeType;          // customized serialize function
    required?: boolean;                 // set to true if the member can't be undefined or null.
    serialize_option?: SerializeOption; // serialize option.
}

export enum SerializeOption {
    IGNORE = 0,
    SERIALIZE_ONLY = 1,
    DESERIALIZE_ONLY = 2,
    BOTH = SERIALIZE_ONLY|DESERIALIZE_ONLY,
}

interface ExtendedDataMemberProperty extends DataMemberProperty {
    propertyName: string;
}

export class InvalidValueError extends Error {
    constructor(public memberName: string, public memberValue: any) {
        super(`Value "${memberValue}" is not valid for member "${memberName}"`);
        this.name = 'InvalidValueError';
    }
}

function isDataContractClass(type: Function) {
    return type === DataContract || type.prototype instanceof DataContract;
}

function joinPath(...args: string[]) {
    return args.filter(k=>k).join('.');
}

function getMetadatas<T extends DataContract>(metadataNameKey: Symbol, target: any) {
    let ret = new Map<string, ExtendedDataMemberProperty>();
    while (target) {
        const protoInfo: Map<string, ExtendedDataMemberProperty> = Reflect.getOwnMetadata(metadataNameKey, target);
        if (protoInfo) {
            for (const key of protoInfo.keys()) {
                if (!ret.has(key)) {
                    ret.set(key, protoInfo.get(key));
                }
            }
        }
        target = Object.getPrototypeOf(target);
    }
    return ret;
}

function findFirstInvalidPropertyWithType(typeInfo: DataMemberProperty, value: any, memberName = '')
    : [string|undefined, any] {
    if  (_.isNull(typeInfo) || _.isUndefined(typeInfo)) {
        return [undefined, undefined];
    }
    if (_.isNull(value) || _.isUndefined(value)) {
        if (typeInfo.required) {
            return [memberName, value];
        }
    } else {
        const type = typeInfo.type;
        if (type === Number) {
            if (!_.isFinite(value)) {
                return [memberName, value];
            }
        } else if (type === String) {
            if (!_.isString(value)) {
                return [memberName, value];
            }
        } else if (type === Boolean) {
            if (!_.isBoolean(value)) {
                return [memberName, value];
            }
        } else if (type === Date) {
            if (!_.isDate(value)) {
                return [memberName, value];
            }
        } else if (type === Array) {
            if (!_.isArray(value)) {
                return [memberName, value];
            }
            if (typeInfo.itemType) {
                for (const k of value) {
                    const [errorMemberName, errorValue] = findFirstInvalidPropertyWithType(
                        {type: typeInfo.itemType}, k, joinPath(memberName, 'item'));
                    if (errorMemberName) {
                        return [errorMemberName, errorValue];
                    }
                }
            }
        } else if (type === Map) {
            if (!_.isMap(value)) {
                return [memberName, value];
            }
            if (typeInfo.keyType) {
                for (const k of value.keys()) {
                    const [errorMemberName, errorValue] = findFirstInvalidPropertyWithType(
                        {type: typeInfo.keyType}, k, joinPath(memberName, 'key'));
                    if (errorMemberName) {
                        return [errorMemberName, errorValue];
                    }
                }
            }
            if (typeInfo.valueType) {
                for (const k of value.values()) {
                    const [errorMemberName, errorValue] = findFirstInvalidPropertyWithType(
                        {type: typeInfo.valueType}, k, joinPath(memberName, 'value'));
                    if (errorMemberName) {
                        return [errorMemberName, errorValue];
                    }
                }
            }
        } else if (isDataContractClass(type)) {
            const [errorMemberName, errorValue] = Validator.findFirstInvalidProperty(value);
            if (errorMemberName) {
                return [joinPath(memberName, errorMemberName), errorValue];
            }
        } 
    }
    if (typeInfo.validate) {
        if (!_.isArray(typeInfo.validate)) {
            if (!typeInfo.validate(value)) {
                return [memberName, value];
            }
        } else {
            for (const checker of typeInfo.validate) {
                if (!checker(value)) {
                    return [memberName, value];
                }
            }
        }  
    }
    return [undefined, undefined];
}


function deserializeWithType(typeInfo: DataMemberProperty, value: any, memberName = '') {
    if  (_.isNull(typeInfo) || _.isUndefined(typeInfo)) {
        return value;
    }
    if (typeInfo.deserialize) {
        return typeInfo.deserialize(value);
    }
    if (_.isNull(value) || _.isUndefined(value)) {
        return value;
    }
    const type = typeInfo.type;
    if (type === Object) {
        return value;
    }
    else if (type === Number) {
        const v = Number(value);
        if (Number.isFinite(v)) {
            return v;
        } else {
            throw new InvalidValueError(memberName, value);
        }
    } else if (type === String) {
        return value.toString();
    } else if (type === Boolean) {
        return Boolean(value);
    } else if (type === Date) {
        return new Date(value);
    } else if (type === Array) {
        if (!_.isArray(value)) {
            throw new InvalidValueError(memberName, value); 
        }
        if (!typeInfo.itemType) {
            return value;
        } else {
            return value.map(k => deserializeWithType({type: typeInfo.itemType}, k, `${memberName}.item`));
        }
    } else if (type === Map) {
        if (!_.isObject(value)) {
            throw new InvalidValueError(memberName, value);
        }
        const map = new Map();
        for (const p in value) {
            map.set(typeInfo.keyType
                 ?deserializeWithType({type: typeInfo.keyType}, p, `${memberName}.key`)
                 :p, 
                 typeInfo.valueType
                 ?deserializeWithType({type: typeInfo.valueType}, value[p], `${memberName}.value`)
                 :value[p]);
        }
        return map;

    } else if (isDataContractClass(type)) {
        return type.fromObject(value);
    } else {
        return value;
    }
}


function serializeWithType(typeInfo: DataMemberProperty, value: any) {
    typeInfo = typeInfo || {};
    if (typeInfo.serialize) {
        return typeInfo.serialize(value);
    }
    if (_.isNull(value) || _.isUndefined(value)) {
        return value;
    } else if (_.isNumber(value) || _.isString(value) || _.isBoolean(value) || _.isDate(value)) {
        return value;
    } else if (_.isArray(value)) {
        return value.map(k => serializeWithType({type: typeInfo.itemType}, k));
    } else if (_.isMap(value)) {
        const obj = {};
        for (const [k, v] of value.entries()) {
            obj[serializeWithType({type: typeInfo.keyType}, k)] 
                = serializeWithType({type: typeInfo.valueType}, v)
        }
        return obj;
    } else if (value instanceof DataContract) {
        return value.toObject();
    } else {
        return value;
    }
}

const metadataPropertyKey = Symbol('validator:property-index');
const metadataNameKey = Symbol('validator:name-index');

class Validator {
    static register(target: any, property: string, meta: ExtendedDataMemberProperty) {
        {
            let map = Reflect.getOwnMetadata(metadataPropertyKey, target);
            if (!map) {
                map = new Map();
                Reflect.defineMetadata(metadataPropertyKey, map, target);
            }
            map.set(property, meta);
        }
        {
            let map = Reflect.getOwnMetadata(metadataNameKey, target);
            if (!map) {
                map = new Map();
                Reflect.defineMetadata(metadataNameKey, map, target);
            }
            map.set(meta.name, meta);
        }
    }
    static findFirstInvalidProperty(target: any): [string|undefined, any] {
        let map = getMetadatas(metadataPropertyKey, target);
        if (!map) {
            return [undefined, undefined];
        }
        for (const property of map.keys()) {
            const dp: DataMemberProperty =  map.get(property);
            const [errorMemberName, errorValue] = findFirstInvalidPropertyWithType(dp, target[property], dp.name);
            if (errorMemberName) {
                return [errorMemberName, errorValue];
            }
        }
        return [undefined, undefined];
    }
    static deserialize(target: any, value: Record<string, any>) {
        const ret = new target();

        let nameMap: Map<string, ExtendedDataMemberProperty> = getMetadatas(metadataNameKey, ret);
        if (!nameMap) {
            return Object.assign(ret, value);
        }

        for (const key in value) {
            const typeInfo = nameMap.get(key);
            if (typeInfo) {
                if (typeInfo.serialize_option & SerializeOption.DESERIALIZE_ONLY) {
                    ret[typeInfo.propertyName] = deserializeWithType(typeInfo, value[key], key);
                }
            }
        }
        return ret;
    }
    static serialize(value: Record<string, any>) {
        let propertyMap: Map<string, ExtendedDataMemberProperty> 
            = getMetadatas(metadataPropertyKey, value);
        if (!propertyMap) {
            return {};
        }

        const ret = {};
        for (const key in value) {
            const typeInfo = propertyMap.get(key);
            if (typeInfo) {
                if (typeInfo.serialize_option & SerializeOption.SERIALIZE_ONLY) {
                    ret[typeInfo.name] = serializeWithType(typeInfo, value[key]);
                }
            }
        }
        return ret;
    }
}

export function DataMember({
        name, type, itemType, keyType, valueType, 
        serialize, deserialize, validate, 
        required, serialize_option=SerializeOption.BOTH
    }: DataMemberProperty = {}) {
    return function(target: any, property: string) {
        Validator.register(target, property, {
            deserialize: deserialize,
            serialize: serialize,
            validate: validate,
            serialize_option: serialize_option,
            type: type || Reflect.getMetadata('design:type', target, property),
            itemType: itemType,
            keyType: keyType,
            valueType: valueType,
            name: name || property,
            propertyName: property,
            required: required,
        });
    }
}

export class DataContract {
    public static fromObject<T extends typeof DataContract>(this: T, obj: Record<string, any>): InstanceType<T> {
        return Validator.deserialize(this.resolveType(obj), obj);
    }
    public static fromJson<T extends typeof DataContract>(this: T, json: string): InstanceType<T> {
        return this.fromObject(JSON.parse(json));
    }
    public findFirstInvalidProperty() {
        return Validator.findFirstInvalidProperty(this)[0];
    }
    public validate() {
        const [invalidMember, invalidValue] = Validator.findFirstInvalidProperty(this);
        if (invalidMember) {
            throw new InvalidValueError(invalidMember, invalidValue);
        }
    }
    public toObject() {
        return Validator.serialize(this);
    }
    public toJson() {
        return JSON.stringify(this.toObject());
    }
    public static resolveType(obj: Record<string, any>): typeof DataContract {
        return this;
    }
}
