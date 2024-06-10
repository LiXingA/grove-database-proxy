import _ from 'lodash';
import { json } from "micro";
/**
 * 
 * @param {*} target 
 * @param {*} source 
 * @param {[]} fieldNames 
 */
function assign(target, source, fieldNames) {
    _.each(fieldNames, (fieldName) => {
        if (undefined !== source[fieldName]) {
            target[fieldName] = source[fieldName]
        }
    })
    return target;
}
/**
 * 
 * @param {Request} req 
 * @returns 
 */
export const getJSON = async function (req) {
    try {
        return await json(req);
    } catch (err) {
        return {};
    }
}