import { createModule } from "./hqUtils";
import ActionsAbs from "../hq/ActionsAbs";

window.innerMain = createModule("inner");
/**
 * use hq's runtime handle UIs state
 */
class Actions extends ActionsAbs {
    constructor() {
        super(window.innerMain);
        this.types = {
            /**
             * @type {{ 
             *  loading:boolean,
             *  cb:function
             * }}
             */
            LOADING: 'LOADING',
            /**
             * @type {[]}
             */
            DATABASES: "DATABASES",
        }
    }
}
const actions = new Actions();
window.actions = actions;
export default actions;