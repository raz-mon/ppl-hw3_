import { add, any, concat, map, zipWith } from "ramda";
import { Value } from './L21-value-store';
import { Result, makeFailure, makeOk, bind, either } from "../shared/result";

// ========================================================
// Box datatype
// Encapsulate mutation in a single type.
type Box<T> = T[];
const makeBox = <T>(x: T): Box<T> => ([x]);
const unbox = <T>(b: Box<T>): T => b[0];
const setBox = <T>(b: Box<T>, v: T): void => { b[0] = v; return; }

// ========================================================
// Store datatype
//export interface emptyStore {tag: "emptyStore"}
export interface Store {
    tag: "Store";
    vals: Box<Value>[];
}
//export const makeStrExp = (s: string): StrExp => ({tag: "StrExp", val: s});
export const isStore = (x: any): x is Store => x.tag === "Store";
export const makeEmptyStore = (): Store => ({tag: "Store", vals: makeBox([])});
//export const isEmptyStore = (x: any): x is emptyStore => x.tag === "emptyStore";
export const theStore: Store = makeEmptyStore();
export const extendStore = (s: Store, val: Value): Store =>
{
    s.vals = s.vals.concat([makeBox(val)])
    return s;
    //({tag: "Store", vals: concat(s.vals, [makeBox(val)])});
}

export const applyStore = (store: Store, address: number): Result<Value> =>
    store.vals.length <= address ? makeFailure(`value not found ${address}`) :
    makeOk(unbox(store.vals[address]));
    
export const setStore = (store: Store, address: number, val: Value): void => 
    store.vals.length > address ? setBox(store.vals[address], val) : 
    setBox(store.vals[0], unbox(store.vals[0]))     // This is just to avoid compilation error.

// ========================================================
// Environment data type
// export type Env = EmptyEnv | ExtEnv;
export type Env = GlobalEnv | ExtEnv;

interface GlobalEnv {
    tag: "GlobalEnv";
    vars: Box<string[]>;
    addresses: Box<number[]>
}

export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    addresses: number[];
    nextEnv: Env;
}

const makeGlobalEnv = (): GlobalEnv =>
    ({tag: "GlobalEnv", vars: makeBox([]), addresses:makeBox([])});

export const isGlobalEnv = (x: any): x is GlobalEnv => x.tag === "GlobalEnv";

// There is a single mutable value in the type Global-env
export const theGlobalEnv: GlobalEnv = makeGlobalEnv();

export const makeExtEnv = (vs: string[], addresses: number[], env: Env): ExtEnv =>
    ({tag: "ExtEnv", vars: vs, addresses: addresses, nextEnv: env});

const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";

export const isEnv = (x: any): x is Env => isGlobalEnv(x) || isExtEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<number> =>
    isGlobalEnv(env) ? applyGlobalEnv(env, v) :
    applyExtEnv(env, v);

const applyGlobalEnv = (env: GlobalEnv, v: string): Result<number> => 
    unbox(env.vars).includes(v) ? makeOk(unbox(env.addresses)[unbox(env.vars).indexOf(v)]) :
    makeFailure(`could not find variable ${v}`)

export const globalEnvAddBinding = (v: string, addr: number): void =>
{
    setBox(theGlobalEnv.vars, unbox(theGlobalEnv.vars).concat([v]))
    setBox(theGlobalEnv.addresses, unbox(theGlobalEnv.addresses).concat([addr]))
}

const applyExtEnv = (env: ExtEnv, v: string): Result<number> =>
    env.vars.includes(v) ? makeOk(env.addresses[env.vars.indexOf(v)]) :
    applyEnv(env.nextEnv, v);

export const applyEnvStore = (env: Env, v: string): Result<Value> => 
      bind(applyEnv(env, v),
         (addr: number) => applyStore(theStore, addr)); 


         