import _ from 'lodash';
import React from 'react';
import { Modal, message as Message, notification } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import DatabaseType from '../../lib/databaseTypes';
const { confirm } = Modal;

export const ModalType = {
    None: "None",
    /**
     * @type{{database:{},databases:[{}],cb:function}}
     */
    NewDatabase: "New Database",
}
export const MODAL_Z_INDEX = 1002;
export const MODAL_WIDTH = 1024;

/**
* @param {DefaultDatabase} dbInfo 
*/
export const getTestSql = function (dbInfo) {
    let sql;
    switch (dbInfo.type) {
        case DatabaseType.MongoDB.name:
            sql = "{}";
            break;
        case DatabaseType.DynamoDB.name:
            sql = "{}"
            break;
        case DatabaseType.BigQuery.name:
            sql = "getDatasets"
            break;
        case DatabaseType.Mysql.name:
            sql = "show tables;"
            break;
        case DatabaseType.PostgreSQL.name:
            sql = `SELECT NULLIF(table_schema, current_schema()) AS schema, table_name AS name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY 1, 2`
            break;
        case DatabaseType.MSSQL.name:
            sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES;`;
            break;
        case DatabaseType.Neo4j.name:
            sql = `MATCH (n) RETURN count(n)`;
            break;
        default:
            sql = "show tables;"
            break;
    }
    return sql;
}

export function showMessage(message, type = "success", duration = 3) {
    Message[type]({
        content: message,
        duration: duration,
        style: {
            zIndex: 1005
        },
    });
}

/**
 * 
 * @param {React.ReactNode} message 
 * @param {*} okHandler 
 * @param {*} cancelHandler 
 * @param {*} description 
 * @returns {Promise<boolean>}
 */
export const showConfirm = async function (message,
    okHandler = () => { }, cancelHandler = () => { }, props = {
        cancelText: "Cancel",
        okText: "OK",
        description: '',
    }) {
    if (typeof okHandler !== 'function') { props = okHandler; okHandler = () => { } };
    const { okText, cancelText, description, ...propsa } = props;
    return await new Promise((resolve, reject) => {
        window._currentModal = confirm({
            title: <div className="confirm-title">{message}</div>,
            icon: <ExclamationCircleOutlined />,
            content: description || '',
            cancelText: cancelText || "Cancel",
            okText: okText || "OK",
            onOk: () => { okHandler(); resolve(true) },
            onCancel: () => { cancelHandler(); resolve(false) },
            zIndex: 1005,
            ...propsa
        });
        window._currentModal.resolveFunc = function (result) {
            resolve(result);
        }
    });
}
// Opera 8.0+
let isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
let isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]" 
let isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
let isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
let isEdge = !isIE && !!window.StyleMedia;

// Chrome 1 - 71
let isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

// Blink engine detection
let isBlink = (isChrome || isOpera) && !!window.CSS;

export const OSType = {
    Windows: "Windows",
    MacOS: "MacOS",
    UNIX: "UNIX",
    Linux: "Linux",
    Unkown: "Unkown",
}

export function osfunction() {
    let os = navigator.userAgent;
    let finalOs = OSType.Unkown;
    if (os.search('Windows') !== -1) {
        finalOs = OSType.Windows;
    }
    else if (os.search('Mac') !== -1) {
        finalOs = OSType.MacOS;
    }
    else if (os.search('X11') !== -1 && !(os.search('Linux') !== -1)) {
        finalOs = OSType.UNIX;
    }
    else if (os.search('Linux') !== -1 && os.search('X11') !== -1) {
        finalOs = OSType.Linux
    }

    return finalOs;
}

export const BrowserChecks = {
    isOpera: isOpera,
    isFirefox: isFirefox,
    isSafari: isSafari,
    isIE: isIE,
    isEdge: isEdge,
    isChrome: isChrome,
    isBlink: isBlink,
}
export const copyContent = function (content = "", successFunc = () => { showMessage("copy success!", "success") },
    failFunc = () => { showMessage("copy failed!", "error") }) {
    let copyFunc = () => {
        navigator.clipboard.writeText(content).then(function () {
            successFunc();
        }, function () {
            failFunc();
        });
    }
    if (BrowserChecks.isFirefox) {
        copyFunc();
    } else {
        navigator.permissions.query({ name: "clipboard-write" }).then(result => {
            if (result.state === "granted" || result.state === "prompt") {
                copyFunc();
            } else {
                failFunc();
                showMessage("no right to write clipboard!", "error")
            }
        }).catch((err) => {
            failFunc();
            console.error(err);
        });
    }
}

/**
   * parse memory file data
   * @param {File} file 
   */
export const parse = async function (file) {
    // Always return a Promise
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // Wait till complete
        reader.onloadend = function (e) {
            let content = e.target.result;
            resolve(content);
        };
        // Make sure to handle error states
        reader.onerror = function (e) {
            reject(e);
        };
        reader.readAsText(file);
    });
}