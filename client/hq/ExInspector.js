import { Inspector } from '@observablehq/runtime';
import _ from 'lodash';

export default class ExInspector extends Inspector {
    /**
     * 
     * @param {HTMLElement} node 
     * @param {Function} successFunc
     * @param {Function} failFunc
     * 
     */
    constructor(node, successFunc, failFunc) {
        super(node);
        /**@type {function} call when fulfilled */
        this.successFunc = successFunc;
        /**@type {function} call when rejected */
        this.failFunc = failFunc;
        /**@type {boolean} flag is deleted */
        this.del = false;
    }

    /**
     * Inspects the specified value, replacing the contents of 
     * this inspector’s element as appropriate, and dispatching 
     * an update event. If the specified value is a DOM element 
     * or text node, and the value is not already attached to 
     * the DOM, it is inserted into this inspector’s element, replacing 
     * any existing contents. Otherwise, for other arbitrary values 
     * such as numbers, arrays, or objects, an expandable display of 
     * the specified value is generated into this inspector’s element. 
     * Applies the observablehq class to this inspector’s element, and 
     * for non-element values, the observablehq--inspect class.
     * @param {*} value 
     * @param {*} name 
     */
    fulfilled(value, name) {
        super.fulfilled(value, name);
        if (!this.del && this.successFunc !== undefined) {
            this.successFunc();
        }
    }

    /**
     * Inspects the specified error, replacing the contents 
     * of this inspector’s element as appropriate with the 
     * error’s description, and dispatching an error event. 
     * Applies the observablehq and observablehq--error class 
     * to this inspector’s element.
     * @param {*} error 
     * @param {*} name 
     */
    rejected(error, name) {
        super.rejected(error, name);
        if (!this.del && this.failFunc !== undefined) {
            this.failFunc(error);
        }
    }

    setFailFunc(failFunc) {
        this.failFunc = failFunc;
    }

    setSuccessFunc(successFunc) {
        this.successFunc = successFunc;
    }

    delete() {
        this.del = true;
    }
}
