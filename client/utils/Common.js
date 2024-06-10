String.prototype.firstUpperCase = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.replaceNoWordToUnderline = function () {
    return this.replace(/\W/g, "_")
}

String.prototype.camelPeakToBlankSplit = function () {
    let a = "";
    for (let index = 0; index < this.length; index++) {
        if ("A" <= this.charAt(index) && this.charAt(index) <= "Z") {
            a = a + " ";
        }
        a = a + this.charAt(index);
    }
    return a;
};

const Common = {}

export default Common;