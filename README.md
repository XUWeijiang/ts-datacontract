![Node.js CI](https://github.com/XUWeijiang/ts-datacontract/workflows/Node.js%20CI/badge.svg)

DataContract is a library for Typescript to serialize/deserialize data using [decorators](https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Decorators.md) syntax in a type-safe way. It also supports value validation. 

## Installation

DataContract is available for both node and browser. You can install it with:
```
npm install ts-datacontract
```
We also recommend you to install [reflect-metadata](https://github.com/rbuckton/reflect-metadata). With that, you can specify property type in Typescript way.

## How to use

DataContract uses typescript decorator `@DataMember` to annotate properties. Properties without `@DataMember` decorator will not be serialized or deserialized. It also requires your classes to inherit `DataContract`.

Please also note that `experimentalDecorators` and `emitDecoratorMetadata` options need to be enabled for Typescript.

### Examples


#### Basic usage

The core interface is `DataMemberProperty`, which specify the metadata of a class property. The definition of `DataMemberProperty` is:

```typescript
interface DataMemberProperty {
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
```

Support you have a `Search` API. The following example demenstrates a basic DataContract between client and service:

```typescript
import { DataContract, DataMember } from "ts-datacontract";
class SearchQuery extends DataContract {
    @DataMember()
    query: string;
    @DataMember()
    pageIndex: number;
    @DataMember()
    pageSize: number;
}

const q = new SearchQuery();
q.query = "query";
q.pageIndex = 1;
q.pageSize = 10;
console.log(q.toJson());  // Output: {"query":"query","pageIndex":1,"pageSize":10}

const m = SearchQuery.fromJson(`{"pageIndex":1,"pageSize":10,"query":"query"}`);
console.log(m.query);      // Output: query
console.log(m.pageIndex);  // Output: 1
console.log(m.pageSize);   // Output: 10
```
You can see it is easy to serialize/deserialize `Search` parameters to/from JSON.


#### Validation

Another common requirement is to verify properties of a DataContract before use them. Here we also use the `SearchQuery` example above. Suppose you want to make sure pageIndex and pageSize are both integers, and pageSize should be greater than zero, and pageIndex should be greater than or equal to zero.


```typescript
import { DataContract, DataMember } from "ts-datacontract";
import _ from "lodash";

class SearchQuery extends DataContract {
    @DataMember()
    query: string;
    @DataMember({validate: v => v >= 0 && _.isInteger(v)})
    pageIndex: number;
    @DataMember({validate: v => v > 0 && _.isInteger(v)})
    pageSize: number;
}
const m = SearchQuery.fromObject({pageIndex:0.1, pageSize:10, query:"query"});
console.log(m.findFirstInvalidProperty());  // Output: pageIndex, which means the property pageIndex is not valid

const n = SearchQuery.fromObject({pageIndex:1, pageSize:-10, query:"query"});
console.log(n.findFirstInvalidProperty());  // Output: pageSize, which means the property pageSize is not valid
// You can also check with n.validate(), which will throw InvalidValueError instead of returning invalid property name.

```

Please note that the value type is automatically verified. You don't need to explicitly check value type with `validate`.

#### Property Renaming

When the service and client use different naming style, you may want to use different property names in service side and client side. In this case, you can use `name` property of `DataMemberProperty`

```typescript
import { DataContract, DataMember } from "ts-datacontract";

class SearchQuery extends DataContract {
    @DataMember()
    query: string;
    @DataMember({name: 'page_index'})
    pageIndex: number;
    @DataMember({name: 'page_size'})
    pageSize: number;
}
const q = new SearchQuery();
q.query = "query";
q.pageIndex = 1;
q.pageSize = 10;
console.log(q.toJson());  // Output: {"query":"query","page_index":1,"page_size":10}

const m = SearchQuery.fromJson(`{"page_index":1,"page_size":10,"query":"query"}`);
console.log(m.query);      // Output: query
console.log(m.pageIndex);  // Output: 1
console.log(m.pageSize);   // Output: 10
```

#### Array and Map support

You can use `itemType` to specify item type of an array property. 
You can use `keyType` and `valueType` to specify the key type and value type of a Map property.

Please note that you *must* manually specify `itemType`, `keyType`, `valueType`,because those values can't be inferred from Typescript reflection.

```typescript
import { DataContract, DataMember } from "ts-datacontract";

class SearchQuery extends DataContract {
    @DataMember()
    query: string;
    @DataMember({itemType: String})
    keywords: string[];
    @DataMember({keyType: String, valueType: Number})
    history: Map<string, number>;
}
const q = new SearchQuery();
q.query = "query";
q.keywords = ["key", "words"];
q.history = new Map([['x', 100], ['y', 200]]);

console.log(q.toJson());  // Output: {"query":"query","keywords":["key","words"],"history":{"x":100,"y":200}}

const m = SearchQuery.fromJson(`{"query":"query","keywords":["key","words"],"history":{"x":100,"y":200}}`);
console.log(m.query);      // Output: query
console.log(m.keywords);   // Output: [ 'key', 'words' ]
console.log(m.history);    // Output: Map { 'x' => 100, 'y' => 200 }

```

#### Serialization/Deserialization Customization

You can use `serialize` and `deserialize` to customize serialization/deserialization of a DataContract property.

```typescript
import { DataContract, DataMember } from "ts-datacontract";

class SearchQuery extends DataContract {
    @DataMember()
    query: string;
    @DataMember({itemType: String, 
        serialize: v => v.join(';'), 
        deserialize: v => v.split(';')})
    keywords: string[];
}
const q = new SearchQuery();
q.query = "query";
q.keywords = ["key", "words"];

console.log(q.toJson());  // Output: {"query":"query","keywords":"key;words"}

const m = SearchQuery.fromJson(`{"query":"query","keywords":"key;words"}`);
console.log(m.query);      // Output: query
console.log(m.keywords);   // Output: [ 'key', 'words' ]
```

#### Serialize/Deserialize only properties

You can use `serialize_option` to set a DataContract Property to be a serialize-only or deserialize-only property.

#### Inheritance Support

We support DataContract inheritance. 

```typescript
import { DataContract, DataMember } from "ts-datacontract";

class SearchQuery extends DataContract {
    @DataMember()
    query: string;
}

class PagedSearchQuery extends SearchQuery {
    @DataMember()
    pageIndex: number;
    @DataMember()
    pageSize: number;
}

const q = new PagedSearchQuery();
q.query = "query";
q.pageIndex = 1;
q.pageSize = 10;
console.log(q.toJson());  // Output: {"query":"query","pageIndex":1,"pageSize":10}

const m = PagedSearchQuery.fromJson(`{"pageIndex":1,"pageSize":10,"query":"query"}`);
console.log(m.query);      // Output: query
console.log(m.pageIndex);  // Output: 1
console.log(m.pageSize);   // Output: 10
```

#### Mixin Support

We support Typescript Mixin style for DataContract.

```typescript
import { DataContract, DataMember } from "ts-datacontract";

type MixinConstructor<T={}> = new(...args: any[]) => T;
function PageMaxin<T extends MixinConstructor>(Base: T) {
    class PageMaxinClass extends Base {
        @DataMember()
        pageIndex: number;
        @DataMember()
        pageSize: number
    }
    return PageMaxinClass;
}

function SearchMixin<T extends MixinConstructor>(Base: T) {
    class SearchMixinClass extends Base {
        @DataMember()
        query: string;
    }
    return SearchMixinClass;
}

class PagedSearchQuery extends PageMaxin(SearchMixin(DataContract)) {
}

const q = new PagedSearchQuery();
q.query = "query";
q.pageIndex = 1;
q.pageSize = 10;
console.log(q.toJson());  // Output: {"query":"query","pageIndex":1,"pageSize":10}

const m = PagedSearchQuery.fromJson(`{"pageIndex":1,"pageSize":10,"query":"query"}`);
console.log(m.query);      // Output: query
console.log(m.pageIndex);  // Output: 1
console.log(m.pageSize);   // Output: 10
```

You can find more examples in tests/index.ts. 


## Known Issues
1. No union type support
2. No enum support: Internally, there is no enum type in runtime. You should take enum type as its underneath type, and use `validate` to check the value is a valid enum value.
