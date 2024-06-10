import { Inspector, Runtime } from '@observablehq/runtime';
window.runtime = new Runtime();

export const createModule = /**@returns {ShapeModule} */ function (moduleName) {
    let module = window.runtime.module();
    module._moduleName = moduleName;
    module._cachedata = {
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
    return module;
}