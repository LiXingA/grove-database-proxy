// Nodejs encryption with CTR
const crypto = require('crypto');
const { config } = require('./../config');

const algorithm = 'aes-256-ctr';
const inputEncoding = 'utf8';
const outputEncoding = 'hex';
const password = config.encryption && config.encryption.password ? config.encryption.password : 'kineviz-graphxr@Cool2018';
const key = crypto.createHash('md5').update(password).digest("hex");

module.exports = {
    encrypt: function encrypt(text) {
        //skip empty and already encrypt text(More 32 chart is encrypt) 
        if (!text || (/^[a-z0-9]{32,}$/g).test(text)) {
            return text;
        }
        const iv = Buffer.from(crypto.randomBytes(16));
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let crypted = cipher.update(text, inputEncoding, outputEncoding);
        crypted += cipher.final(outputEncoding);
        return `${iv.toString('hex')}${crypted.toString()}`;
    },
    decrypt: function decrypt(text) {

        if (!text || !(/^[a-z0-9]{32,}$/g).test(text)) {
            return text;
        }

        //extract the IV from the first half of the value
        const IV = Buffer.from(text.substr(0, 32), outputEncoding);

        //extract the encrypted text without the IV
        const encryptedText = Buffer.from(text.substr(32), outputEncoding);

        //decipher the string
        const decipher = crypto.createDecipheriv(algorithm, key, IV);
        let decrypted = decipher.update(encryptedText, outputEncoding, inputEncoding);
        decrypted += decipher.final(inputEncoding);
        return decrypted.toString();
    },
    // isEmail: function isEmail(text) {
    //     return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(text)
    // },
};