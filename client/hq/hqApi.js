import _ from 'lodash';
/**
 * An observer watches a variable, being notified via asynchronous callback 
 * whenever the variable changes state. See the standard inspector for reference.
 */
export const IObservers = {
    /**
     * Called shortly before the variable is computed. For a generator variable, 
     * this occurs before the generator is constructed, but not before each 
     * subsequent value is pulled from the generator.
     */
    pending: () => { },
    /**
     * Called shortly after the variable is fulfilled with a new value.
     * @param {*} value 
     */
    fulfilled: (value) => { },
    /**
     * Called shortly after the variable is rejected with the given error.
     * @param {*} error 
     */
    rejected: (error) => { },
    delete: () => { },
    setFailFunc: (successFunc) => { },
    setFailFunc: () => { failFunc }
}
/**
 * A variable defines a piece of state in a reactive program, 
 * akin to a cell in a spreadsheet. Variables may be named to 
 * allow the definition of derived variables: variables whose 
 * value is computed from other variables’ values. Variables 
 * are scoped by a module and evaluated by a runtime.
 */
export const IVariable = {
    define:/**
     * 
     * @param {string} name 
     * @param {[]} inputs 
     * @param {Function} definition 
     */
        (name, inputs, definition) => { },
    import: /**
     * import {name as alias} from "module"
     * @param {string} name 
     * @param {string} [alias] 
     * @param {*} module 
     */
        (name, alias, module) => { },
    /**
     * Deletes this variable’s current definition and name, if any.
     */
    delete: () => { }
}
/**
 * A module is a namespace for variables; within a module, variables 
 * should typically have unique names. Imports allow variables to be 
 * referenced across modules.
 */
export const IModule = {
    _runtime: {},
    /**
     * @type Map<string,IVariable>
     */
    _scope: new Map(),
    variable: /**
     * 
     * @param {IObservers} [observer] 
     */
        (observer) => { return IVariable },
    derive: /**
     * 
     * @param {Array<{name:string,alias:string}>|string} specifiers 
     * @param {*} source 
     */
        (specifiers, source) => { },
    define: /**
     * 
     * @param {string} name 
     * @param {[string]} inputs 
     * @param {function|*} definition 
     */
        (name, inputs, definition) => { },
    import: /**
     * @link {IVariable#import}
     * @param {string} name 
     * @param {string} [alias] 
     * @param {*} from 
     */
        (name, alias, from) => { },
    redefine: /**
     * 
     * @param {string} name 
     * @param {[string]} inputs 
     * @param {function|*} definition 
     */
        (name, inputs, definition) => { },
    value: /**
     * 
     * @param {string} name 
     */
        (name = "") => { return new Promise() }
}
export const IRuntime = {
    module: /**
     * 
     * @param {function} [define] 
     * @param {function} [observer] 
     */
        (define, observer) => { return IModule },
    /**
     * Disposes this runtime, invalidating all active variables and disabling future computation.
     */
    dispose: () => { }
}

export const VariantType = {
    import: "import",
    variant: "variant"
}
export const ShapeInspector = {
    inspector: IObservers,
    varia: IVariable,
    /**@type {Array<string>} */
    args: [],
    func: () => { },
};
export const ShapeElement = _.assign(document.createElement("div"), {
    /**@type{ShapeInspector} */
    vary: ShapeInspector,
    /**@type {Array<string>} */
    cacheNames: []
})
export const ShapeVariable = {
    type: VariantType.variant,
    name: "",
    args: [],
    func: () => { },
    varia: IVariable,
    redefines: []
};
export const ShapeModule = _.assign(IModule, {
    _expire: false,
    _moduleName: "",
    _cachedata: {
        /** 
         * all variables 
         * 
         * @type {Object.<string,ShapeVariable>}
         */
        variables: {},
        /** 
         * all inspectors 
         * 
         * @type [ShapeInspector]
         */
        inspectors: [],
        /** 
         * import modules
         * <moduleName, {names,localNames}>
         * @type {Object.<string,{names:[],localNames:[]}> }
         */
        importModules: {},
    }
})

