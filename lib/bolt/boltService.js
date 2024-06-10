'use strict';
const _ = require('lodash');
const cryptoUtil = require('./../util/cryptoUtil');
const boltConnections = require('./boltConnections')
// const TrackNeo4jCommandSocket = require('./../websocket/TrackNeo4jCommandSocket')

const MaxReturnLimit = 20000;

function containsWriteAndUpdateOperation(command) {
	//remove the content, 
	let checkCommand = command.replace(/\'.+\'|\".+\"/ig, '###').trim();
	let isContains = false;

	if ((/CALL/ig).test(command) && (/dbms.procedures|apoc.index.search|apoc.meta|apoc.index.list|db.indexes|db.index.fulltext|db.schema|db.labels|db.relationshipTypes|db.index.explicit.searchNodes/ig).test(checkCommand)) {
		isContains = false;
	} else if ((/(CALL|CREATE|DELETE|DROP|DETACH|REMOVE|LOAD|SET|START|ADD) /ig).test(checkCommand)) {
		isContains = true;
	}

	return isContains
}


function excuteCommand(sessionID,
	command,
	options,
	cb,
	disableWritePermission,
	queryLimit = MaxReturnLimit,
	params = null) {

	options.username = cryptoUtil.decrypt(options.username)
	options.password = cryptoUtil.decrypt(options.password)
	options.host = options.host || `${options.hostname}:${options.boltPort}`

	queryLimit = parseInt(queryLimit) || MaxReturnLimit;
	if (queryLimit > MaxReturnLimit) {
		queryLimit = MaxReturnLimit
	}

	command = String(command).trim().replace(/[\t\n]/gim, " ").trim().replace(/;$/ig, '');

	//auto add limit 2000
	if ((/RETURN/ig).test(command)) {
		let limitReg = /\s+limit\s+(\d+)$/ig;
		let limitNumber = limitReg.test(command) ? (parseInt(command.replace(/.+limit\s+(\d+)$/ig, "$1")) || queryLimit) : queryLimit;
		limitNumber = limitNumber > queryLimit ? queryLimit : limitNumber;
		command = `${command.replace(limitReg, '')} LIMIT ${limitNumber}`;

		console.log("Auto handle limit command:", command);
	} else {
		console.log("Command :", command);
	}

	let callback = function callback(err, data) {

		if (cb) {
			cb(err, data);
		}
		console.log(sessionID, 'command', {
			status: err ? 1 : 0,
			message: err ? err.message : "Successful.",
			content: {
				host: options.host,
				query: command
			}
		})
		// TrackNeo4jCommandSocket.tracking(sessionID, 'command', {
		// 	status: err ? 1 : 0,
		// 	message: err ? err.message : "Successful.",
		// 	content: {
		// 		host: options.host,
		// 		query: command
		// 	}
		// })
	}

	if (!disableWritePermission && options.options && options.options.defaultAccessMode) {
		options.options.defaultAccessMode = 'WRITE'
	}

	if (disableWritePermission && containsWriteAndUpdateOperation(command)) {
		let erro = new Error("This operation requires additional permissions.");
		console.error(erro.message, command);
		return callback(erro);
	}

	boltConnections.excuteCommand(command, options, callback, params)
}


module.exports = {
	// query: query,
	excuteCommand: excuteCommand,
	checkConnect: boltConnections.checkConnect,
	cleanCacheNeo4jDrivers: boltConnections.cleanCacheNeo4jDrivers,
	maxReturnLimit: MaxReturnLimit
}