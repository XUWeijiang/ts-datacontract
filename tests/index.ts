import { expect } from "chai";
import { DataContract, DataMember, SerializeOption, InvalidValueError } from "../src";

describe('Basic Test', () => {
    it('Normal', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember()
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = 100;
        const value = { version: '4.0', takes: 100 };
        const jsonValue = `{"version":"4.0","takes":100}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.eql(100);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        const value2 = { version: '4.0', takes: "100" };
        const jsonValue2 = `{"version":"4.0","takes":"100"}`;
        const b2 = A.fromObject(value2);
        expect(b2.version).to.eql('4.0');
        expect(b2.takes).to.eql(100);

        const c2 = A.fromJson(jsonValue2);
        expect(c2.toObject()).to.eql(value);

        const c3 = DataContract.fromObject(value2);
        expect(c3.toObject()).to.eql({});
    });
    it('With default Value', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember()
            takes: number = 100;
        }
        const a = new A();
        a.version = '4.0';
        const value = { version: '4.0', takes: 100 };
        expect(a.toObject()).to.eql(value);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.eql(100);

        const x = A.fromObject({version: '4.0', takes: 10});
        expect(x.toObject()).to.eql({version: '4.0', takes: 10});
    });
    it('With undefined Value', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember()
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        const value = { version: '4.0'};
        const jsonValue = `{"version":"4.0"}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.be.undefined;

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);
    });
    it('With null Value', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember()
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = null;
        const value = { version: '4.0', takes: null};
        const jsonValue = `{"version":"4.0","takes":null}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.be.null;

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);
    });
    it('No type', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember()
            takes;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = 100;
        const value = { version: '4.0', takes: 100 };
        const jsonValue = `{"version":"4.0","takes":100}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.eql(100);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        const value2 = { version: '4.0', takes: "100" };
        const jsonValue2 = `{"version":"4.0","takes":"100"}`;
        const b2 = A.fromObject(value2);
        expect(b2.version).to.eql('4.0');
        expect(b2.takes).to.eql("100");

        const c2 = A.fromJson(jsonValue2);
        expect(c2.toObject()).to.eql(value2);
    });
    it('With Name', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({name: "alias"})
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = 100;
        const value = { version: '4.0', alias: 100 };
        const jsonValue = `{"version":"4.0","alias":100}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.eql(100);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        const value2 = { version: '4.0', alias: "100" };
        const jsonValue2 = `{"version":"4.0","alias":"100"}`;
        const b2 = A.fromObject(value2);
        expect(b2.version).to.eql('4.0');
        expect(b2.takes).to.eql(100);

        const c2 = A.fromJson(jsonValue2);
        expect(c2.toObject()).to.eql(value);
    });
    it('With [de]serialize', () => {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({name: 'alias', serialize: k=>k*10, deserialize: k=>k/10})
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = 100;
        const value = { version: '4.0', alias: 1000 };
        const jsonValue = `{"version":"4.0","alias":1000}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);
        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.takes).to.eql(100);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        const value2 = { version: '4.0', alias: "1000" };
        const jsonValue2 = `{"version":"4.0","alias":"1000"}`;
        const b2 = A.fromObject(value2);
        expect(b2.version).to.eql('4.0');
        expect(b2.takes).to.eql(100);

        const c2 = A.fromJson(jsonValue2);
        expect(c2.toObject()).to.eql(value);
    });
    it('With serialize options', () => {
        class A extends DataContract {
            @DataMember({serialize_option: SerializeOption.DESERIALIZE_ONLY})
            donly: number;
            @DataMember({serialize_option: SerializeOption.SERIALIZE_ONLY})
            sonly: number;
            @DataMember({serialize_option: SerializeOption.IGNORE})
            ignore: number;
            @DataMember({serialize_option: SerializeOption.BOTH})
            both: number;
        }
        const a = new A();
        a.donly = 1;
        a.sonly = 2;
        a.ignore = 3;
        a.both = 4;

        expect(a.toObject()).to.eql({sonly: 2, both: 4});
        expect(a.toJson()).to.eql(`{"sonly":2,"both":4}`);
        const jsonValue = `{"donly":1,"sonly":2,"ignore":3,"both":4}`
        const b = A.fromJson(jsonValue);
        expect(b.donly).to.be.equal(1);
        expect(b.sonly).to.be.undefined;
        expect(b.ignore).to.be.undefined;
        expect(b.both).to.be.equal(4);
    });
    it("With validate", ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({validate: k => k > 0})
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = 2;
        expect(a.findFirstInvalidProperty()).to.be.undefined;
        a.takes = -1;
        expect(a.findFirstInvalidProperty()).to.be.equal('takes');
        expect(()=>a.validate()).to.throw(InvalidValueError).that.satisfies(function (error) {
            return error.memberName === 'takes' && error.memberValue === -1;
        });
    })
    it("With required", ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({required: true})
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        expect(a.findFirstInvalidProperty()).to.be.equal('takes');
    })
    it("With array", ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({itemType: Number})
            takes: number[];
        }
        const a = new A();
        a.version = '4.0';
        a.takes = [1, 2];
        
        const expectedJson = `{"version":"4.0","takes":[1,2]}`;
        expect(a.toJson()).to.be.equal(expectedJson);

        const b = A.fromObject({version: "4.0", takes: ["1", 2]});
        expect(b.version).to.be.equal('4.0');
        expect(b.takes).to.be.eql([1,2]);
    });
    it("With Map", ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({keyType: Number, valueType: String})
            takes: Map<Number, String>;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = new Map([[1,'1'], [2, '2']]);
  
        const expectedJson = `{"version":"4.0","takes":{"1":"1","2":"2"}}`;
        expect(a.toJson()).to.be.equal(expectedJson);

        const b = A.fromObject({version: "4.0", takes:{"1": "1", 2: "2"}});
        expect(b.version).to.be.equal('4.0');
        expect(b.takes).to.be.eql(new Map([[1,'1'], [2, '2']]));
    });
});

describe("Nested DataContract", () => {
    class Nested extends DataContract {
        @DataMember()
        x: string;
        @DataMember({validate: k => k > 0})
        y: number;
    }
    it('Normal', ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember()
            nested: Nested;
        }
        const a = new A();
        a.version = '4.0';
        a.nested = new Nested();
        a.nested.x = 'x';
        a.nested.y = 2;

        expect(a.findFirstInvalidProperty()).to.be.undefined;

        const value = { version: '4.0', nested: {x: 'x', y: 2} };
        const jsonValue = `{"version":"4.0","nested":{"x":"x","y":2}}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);

        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.nested.x).to.eql('x');
        expect(b.nested.y).to.eql(2);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        a.nested.y = -1;
        expect(a.findFirstInvalidProperty()).to.be.equal('nested.y');
        expect(()=>a.validate()).to.throw(InvalidValueError).that.satisfies(function (error) {
            return error.memberName === 'nested.y' && error.memberValue === -1;
        });

    });
    it("With array", ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({itemType: Nested})
            nested: Nested[];
        }
        const a = new A();
        a.version = '4.0';
        a.nested = [Nested.fromObject({x: 'x', y: 2}), Nested.fromObject({x: 'y', y: 3})];
        expect(a.findFirstInvalidProperty()).to.be.undefined;
        
        const value = { version: '4.0', nested: [{x: 'x', y: 2},{x: 'y', y: 3}] };
        const jsonValue = `{"version":"4.0","nested":[{"x":"x","y":2},{"x":"y","y":3}]}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);

        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.nested[0].x).to.eql('x');
        expect(b.nested[0].y).to.eql(2);
        expect(b.nested[1].x).to.eql('y');
        expect(b.nested[1].y).to.eql(3);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        a.nested[1].y = -1;
        expect(a.findFirstInvalidProperty()).to.be.equal('nested.item.y');
        expect(()=>a.validate()).to.throw(InvalidValueError).that.satisfies(function (error) {
            return error.memberName === 'nested.item.y' && error.memberValue === -1;
        });

    });
    it("With Map", ()=> {
        class A extends DataContract {
            @DataMember()
            version: string;
            @DataMember({keyType: Number, valueType: Nested})
            nested: Map<Number, Nested>;
        }
        const a = new A();
        a.version = '4.0';
        a.nested = new Map([[1, Nested.fromObject({x: 'x', y: 2})], 
                            [2, Nested.fromObject({x: 'y', y: 3})]]);
        expect(a.findFirstInvalidProperty()).to.be.undefined;

        const value = { version: '4.0', nested: {1: {x: 'x', y: 2}, 2: {x: 'y', y: 3}} };
        const jsonValue = `{"version":"4.0","nested":{"1":{"x":"x","y":2},"2":{"x":"y","y":3}}}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);

        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.nested.get(1).x).to.eql('x');
        expect(b.nested.get(1).y).to.eql(2);
        expect(b.nested.get(2).x).to.eql('y');
        expect(b.nested.get(2).y).to.eql(3);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        a.nested.get(1).y = -1;
        expect(a.findFirstInvalidProperty()).to.be.equal('nested.value.y');
        expect(()=>a.validate()).to.throw(InvalidValueError).that.satisfies(function (error) {
            return error.memberName === 'nested.value.y' && error.memberValue === -1;
        });
    });
})

describe("Subclass", () => {
    class Base extends DataContract {
        @DataMember()
        x: string;
        @DataMember({validate: k => k > 0})
        y: number;
    }
    it('Normal', ()=> {
        class A extends Base {
            @DataMember()
            version: string;
        }
        const a = new A();
        a.version = '4.0';
        a.x = 'x';
        a.y = 2;

        expect(a.findFirstInvalidProperty()).to.be.undefined;

        const value = { version: '4.0', x: 'x', y: 2 };
        const jsonValue = `{"version":"4.0","x":"x","y":2}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);

        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.x).to.eql('x');
        expect(b.y).to.eql(2);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        a.y = -1;
        expect(a.findFirstInvalidProperty()).to.be.equal('y');
        expect(()=>a.validate()).to.throw(InvalidValueError).that.satisfies(function (error) {
            return error.memberName === 'y' && error.memberValue === -1;
        });
    });
    it('Override', ()=> {
        class A extends Base {
            @DataMember({name: 'ay'})
            y: number;
        }
        const a = new A();
        a.x = 'x';
        a.y = 2;

        expect(a.findFirstInvalidProperty()).to.be.undefined;

        const value = { x: 'x', ay: 2 };
        const jsonValue = `{"x":"x","ay":2}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);

        a.y = -1;
        expect(a.findFirstInvalidProperty()).to.be.undefined;
    });
    it('Select Type', ()=> {
        class Base extends DataContract {
            @DataMember()
            type: string;

            public static resolveType(obj: Record<string, any>) {
                if (!obj || !obj.type) {
                    return this;
                }
                if (obj.type === 'A') {
                    return A;
                } else {
                    return B;
                }
            }
        }

        class A extends Base {
            @DataMember()
            a: string;

            constructor() {
                super();
                this.type = 'A';
            }
        }

        class B extends Base {
            @DataMember()
            b: number;

            constructor() {
                super();
                this.type = 'B';
            }
        }

        class Holder extends DataContract {
            @DataMember({itemType: Base})
            data: Base[] = [];
        }
        const h = new Holder();
        h.data.push(A.fromObject({a: 'a'}));
        h.data.push(B.fromObject({b: 1}));

        const expectedObj = { data: [ { type: 'A', a: 'a' }, { type: 'B', b: 1 } ] };
        const expectedJson = `{"data":[{"type":"A","a":"a"},{"type":"B","b":1}]}`;
        expect(h.toObject()).to.eql(expectedObj);
        expect(h.toJson()).to.equal(expectedJson);

        const h2 = Holder.fromObject(expectedObj);
        expect(h2.data.length).to.equal(2);
        expect(h2.data[0].type).to.equal('A');
        expect((h2.data[0] as A).a).to.equal('a');
        expect(h2.data[1].type).to.equal('B');
        expect((h2.data[1] as B).b).to.equal(1);
    });
})

describe("Mixin", () => {
    type MixinConstructor<T={}> = new(...args: any[]) => T;
    function PageMaxin<T extends MixinConstructor>(Base: T) {
        class PageMaxinClass extends Base {
            @DataMember({name: 'page_index'})
            pageIndex: number;
            @DataMember({name: 'page_size', validate: k => k > 0})
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
    it('Normal', ()=> {
        class A extends PageMaxin(SearchMixin(DataContract)) {
            @DataMember()
            version: string;
        }
        const a = new A();
        a.version = '4.0';
        a.query = 'q';
        a.pageIndex = 1;
        a.pageSize = 10;

        expect(a.findFirstInvalidProperty()).to.be.undefined;

        const value = { version: '4.0', query: 'q', page_index: 1, page_size: 10 };
        const jsonValue = `{"version":"4.0","query":"q","page_index":1,"page_size":10}`;
        expect(a.toObject()).to.eql(value);
        expect(a.toJson()).to.eql(jsonValue);

        const b = A.fromObject(value);
        expect(b.version).to.eql('4.0');
        expect(b.query).to.eql('q');
        expect(b.pageIndex).to.eql(1);
        expect(b.pageSize).to.eql(10);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql(value);

        a.pageSize = -1;
        expect(a.findFirstInvalidProperty()).to.be.equal('page_size');
        expect(()=>a.validate()).to.throw(InvalidValueError).that.satisfies(function (error) {
            return error.memberName === 'page_size' && error.memberValue === -1;
        });
    });
})


describe('Special Test', () => {
    it('No decorator', () => {
        class A extends DataContract {
            version: string;
            @DataMember()
            takes: number;
        }
        const a = new A();
        a.version = '4.0';
        a.takes = 100;
        const value = { version: '4.0', takes: 100 };
        const jsonValue = `{"version":"4.0","takes":100}`;
        expect(a.toObject()).to.eql({takes: 100 });
        expect(a.toJson()).to.eql(`{"takes":100}`);

        const b = A.fromObject(value);
        expect(b.version).to.be.undefined;
        expect(b.takes).to.eql(100);

        const c = A.fromJson(jsonValue);
        expect(c.toObject()).to.eql({takes: 100 });
    });
})
