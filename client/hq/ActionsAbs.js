import _ from 'lodash';
import ExInspector from "./ExInspector";
import { IVariable, ShapeElement, ShapeModule } from "./hqApi";
/**
 * use hq's runtime handle UIs state
 */
export default class ActionsAbs {
    /**
     * 
     * @param {ShapeModule} module
     */
    constructor(module) {
        this.module = module;
        /**
         * @type {Object.<string,IVariable>}
         */
        this.variables = {};
        this.inspectors = [];
    }
    getVariable = (action) => {
        if (!this.variables[action]) {
            this.variables[action] = this.module.variable();
        }
        return this.variables[action];
    }
    /**
     * Returns a promise to the next value of the variable 
     * with the specified name on this module. 
     * If no such variable exists, or if more than one variable
     *  has the specified name, throws a runtime error.
     * 
     * @param {*} action 
     * @returns {Promise}
     */
    value = (action) => {
        if (!this.variables[action]) {
            return null;
        }
        return this.module.value(action);
    }
    /**
     * @param {ShapeElement} ele 
     */
    deleteCache = (ele) => {
        if (ele.vary) {
            ele.vary.varia.delete();
            this.inspectors.splice(this.inspectors.indexOf(ele.vary), 1);
            ele.vary.inspector.delete();
        }
    }

    /**
     * 
     * @param {ShapeElement} ele 
     * @param {string[]} args 
     * @param {function} func 
     * @param {function} successFunc 
     * @param {function} failFunc 
     */
    inspector = (ele, args, func, successFunc, failFunc) => {
        let inspector;
        if (ele.vary === undefined) {
            inspector = new ExInspector(ele, undefined, undefined, successFunc, failFunc);
            ele.vary = {
                inspector: inspector,
                varia: this.module.variable(inspector),
            }
            this.inspectors.push(ele.vary);
        }
        inspector = ele.vary.inspector;
        ele.vary.args = args;
        ele.vary.func = func;
        inspector.setFailFunc(failFunc)
        inspector.setSuccessFunc(successFunc);
        ele.vary.varia.define(ele.vary.args, ele.vary.func);
    }
    /**
     * 
     * @param {*} name 
     * @param {*} args 
     * @param {*} func 
     */
    variable = (name, args = [], func) => {
        let variable = this.getVariable(name);
        variable.define(name, args, func);
    }
}