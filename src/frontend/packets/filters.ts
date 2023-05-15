import { Packet, ROOT, NULL } from "./lib"

export namespace FILTER {
  type testSig = (val: string|undefined, testVal: string|RegExp) => boolean;
  export class Type {
    static _id = 0;
    static map: Map<number, Type> = new Map();
  
    id: number;
    label: string;
    check: testSig;
    hasValue: boolean;
  
    constructor(label: string, check: testSig, hasValue: boolean=true) {
      this.label = label;
      this.check = check;
      this.id = Type._id++;
      Type.map.set(this.id, this);
      this.hasValue = hasValue;
    }
  }

  export const EQUALS = new Type('==', (v, t) => v === t);
  export const NOT_EQUALS = new Type('!=', (v, t) => v !== t);
  export const MATCHES = new Type('~',  (v, t) => v !== undefined && (t as RegExp).test(v));
  export const NOT_MATCHES = new Type('!~', (v, t) => v !== undefined && !(t as RegExp).test(v));
  export const GROUP = new Type('Group By', () => true, false);

  export function forEach(callback: (filter: Type) => void) {
    Type.map.forEach(callback);
  }
}

class Filter {
  static _id = 0;

  id: number;
  field: string;
  type: FILTER.Type;
  value: string | RegExp;

  constructor(field: string, type: FILTER.Type, value: string|RegExp) {
    this.id = Filter._id++;
    this.field = field;
    this.type = type;
    this.value = value;
  }
}

export class Filters {
  filters: Map<string, Filter[]> = new Map();

  getGroups() {
    const groups: string[] = [];
    for (const [key, filters] of this.filters) {
      for (const filter of filters) {
        if (filter.type === FILTER.GROUP) {
          groups.push(key);
        }
      }
    }
    return groups;
  }

  /** Returns the values of a set of groups for a packet. */
  getPacketGrouping(packet: Packet, groups?: string[]): string {
    if (groups === undefined) {
      groups = this.getGroups();
    }
    if (groups.length === 0) {
      return ROOT;
    }
    const fields: Map<string, string> = new Map();
    groups.forEach(grp => {
      fields.set(grp, (packet[grp] ?? NULL) as string);
    });
    return new URLSearchParams(Object.fromEntries(fields)).toString();
  }

  /** Test if a packet should be filtered (returns true if filtered) */
  isFiltered(packet: Packet) {
    for (const [key, conditions] of this.filters) {
      if (this._runFilters(conditions, packet[key] as string|undefined)) {
        return true;
      }
    }
    return false;
  }

  /** Test if a value should be filtered (returns true if filtered) */
  valueIsFiltered(key: string, value: string|undefined): boolean {
    const conditions = this.filters.get(key);
    if (conditions === undefined) return false;
    return this._runFilters(conditions, value);
  }

  /** Run a series of filters, returning true if filtered, false if not */
  _runFilters(conditions: Filter[], value: string|undefined): boolean {
    for (const filter of conditions) {
      if (!filter.type.check(value, filter.value)) {
        return true;
      }
    }
    return false;
  }

  /** Add a grouping */
  addGroup(key: string): boolean {
    const index = this.getGroups().indexOf(key);
    if (index === -1) {
      return this.addFilter(key, FILTER.GROUP, NULL);
    }
    return false;
  }

  /** Remove a grouping */
  removeGroup(key: string): boolean {
    return this.removeFilter(key, FILTER.GROUP, NULL);
  }

  /** Adds a particular filter, initiated by user.  */
  addFilter(key: string, type: FILTER.Type, value: string): boolean {
    let parsedValue: string|RegExp = value;
    if (type === FILTER.MATCHES || type === FILTER.NOT_MATCHES) {
      parsedValue = RegExp(value);
    }

    const map = this.filters.get(key);
    if (map === undefined) {
      this.filters.set(key, [new Filter(key, type, value)]);
      return true;
    }
    map.push(new Filter(key, type, value));
    return false;
  }

  /** Removes a particular filter, initiated by user. */
  removeFilter(key: string, type: FILTER.Type, value: string): boolean {
    const map = this.filters.get(key);
    if (map === undefined) {
      console.error('Unknown filter key: ', key);
      return false;
    }

    let ids: number[] = [];
    map.forEach((filter, i) => {
      if (filter.type == type && filter.value == value) {
        ids.push(i);
      }
    });
    ids.reverse().forEach(i => map.splice(i, 1));

    if (map.length === 0) {
      this.filters.delete(key);
      return true;
    }
    return false;
  }

  /** Retrieve filters in a way that's friendly to the web UI */
  getFilters(): Filter[] {
    const filters = new Map<number, Filter>();
    for (const [k, v] of this.filters) {
      for (const f of v) {
        filters.set(f.id, f);
      }
    }
    return Array.from(filters.keys()).sort().map(i => filters.get(i)) as Filter[];
  }
}