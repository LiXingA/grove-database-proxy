'use strict';
const neo4j = require('neo4j-driver');
const _ = require('lodash');
const boltMapping = require('./boltMapping')
// const localRegex = /^localhost|(^127\.)|(^(0)?10\.)|(^172\.(0)?1[6-9]\.)|(^172\.(0)?2[0-9]\.)|(^172\.(0)?3[0-1]\.)|(^169\.254\.)/;

const Neo4jDriverMaps = {
	// host: neo4j.driver("bolt://" + host, neo4j.auth.basic(username, password)),
	// 		sessionCount: 0,
	// 		latestUseTime: new Date().getTime(),
	// 		getSession: function () {
	// 			this.sessionCount++;
	// 			return this.driver;
	// 		},
	// 		closeSession: function (session) {
	// 			this.sessionCount--;
	// 			if (session) {
	// 				session.close();
	// 			}
	// 		}
};


function cleanCacheNeo4jDrivers(removeHost, excludeHost, isForce) {

	_.forEach(Neo4jDriverMaps, (cacheDriverItem, host) => {
		if (cacheDriverItem.sessionCount < 0) {
			console.error("Please check the progress logic, maybe has cluster problem");
		}
		if (!cacheDriverItem.driver || isForce || host === removeHost
			|| (
				cacheDriverItem.sessionCount <= 0
				&& (new Date().getTime() - cacheDriverItem.latestUseTime) > 60000
				&& cacheDriverItem.driver && host !== excludeHost
			)) {
			delete Neo4jDriverMaps[host];
			cacheDriverItem.driver && cacheDriverItem.driver.close && cacheDriverItem.driver.close();
		}
	})


}


function excuteCommand(command, options, callback, params) {

	let host = options.host || `${options.hostname}:${options.boltPort}`
	// repalce all new line to whitespace 
	command = String(command).trim().replace(/[\t\n]/gim, " ");
	// let currentNeo4jDB = options.currentNeo4jDB;
	let neo4jSessionOptions = options.options;
	// if(!neo4jSessionOptions && currentNeo4jDB && currentNeo4jDB !== ''){
	// 	neo4jSessionOptions = {
	// 		defaultAccessMode: neo4j.session.READ,
	// 		database: currentNeo4jDB,
	// 	}
	// }

	boltSessionRunCommand(
		command,
		host,
		options.username,
		options.password,
		callback,
		params,
		neo4jSessionOptions)

}


// do not use cache
// function boltSessionRunCommand(command, host, username, password, cb) {

// 	let startTime = new Date().getTime();
// 	let callback = function (err, data) {
// 		console.log("Query use time:", (new Date().getTime() - startTime) / 1000, 's');
// 		cb(err, data);
// 	}

// 	let driver = neo4j.driver("bolt://" + host, neo4j.auth.basic(username, password), {
// 		encrypted: true,
// 		trust: "TRUST_ALL_CERTIFICATES",
// 		logging: {
// 			level: 'error',//"info",
// 			logger: (level, message) => {
// 				console.error(`Neo4j driver ${level}: ${message}`);
// 			}
// 		}
// 	});

// 	let session = driver.session();
// 	session
// 		.run(command)
// 		.then(result => {
// 			let data = boltMapping.convertData(result);
// 			session.close();
// 			driver.close();
// 			callback(null, data);
// 		})
// 		.catch(error => {
// 			console.error(error.message)
// 			driver.close();
// 			callback(error);
// 		})

// }

// Use cache drivers
const DefaultEncrypted = false;
function boltSessionRunCommand(
	command,
	host,
	username,
	password,
	cb,
	params = {},
	neo4jSessionOptions,
	encrypted = DefaultEncrypted) {


	//track the use time
	let startTime = new Date().getTime();
	let callback = function (err, data) {
		console.log("Query use time:", (new Date().getTime() - startTime) / 1000, 's  ');
		cb(err, data);
	}
	if (typeof (command) !== 'string' || command.trim() == '') {
		return callback(new Error(`Can't support the command(${command})`))
	}

	console.info("Current Cache neo4j Clients :", _.size(Neo4jDriverMaps));
	cleanCacheNeo4jDrivers(null, host);

	let cacheDriver = Neo4jDriverMaps[host] || { getSession: function () { return null } };
	let session = cacheDriver.getSession(neo4jSessionOptions)

	if (!session) {
		//neo4j support http as default, if only ws, will auto try connect use wss
		let neo4jOption = {
			encrypted: false,
			trust: "TRUST_ALL_CERTIFICATES",
			logging: {
				level: 'error',//"info",
				logger: (level, message) => {
					console.error(`Neo4j driver ${level}: ${message}`);
				}
			}
		};
		if (encrypted) {
			neo4jOption.encrypted = true;
		}

		// //If is local db, will force use the ws:
		// if (localRegex.test(host)) {
		// 	neo4jOption = Object.assign(neo4jOption, {
		// 		encrypted: false,
		// 		trust: "TRUST_SYSTEM_CA_SIGNED_CERTIFICATES",
		// 	})
		// }

		cacheDriver = {
			driver: neo4j.driver("bolt://" + host, neo4j.auth.basic(username, password), neo4jOption),
			sessionCount: 0,
			latestUseTime: new Date().getTime(),
			getSession: function (sessionOptions) {
				this.sessionCount++;
				return this.driver.session(sessionOptions || {})
			},
			closeSession: function (session) {
				this.sessionCount--;
				if (session && session.close) {
					session.close();
				}
			}
		}
		session = cacheDriver.getSession(neo4jSessionOptions);

		//clean the cache driver 
		if (Neo4jDriverMaps[host]) {
			cleanCacheNeo4jDrivers(host);
		}

		Neo4jDriverMaps[host] = cacheDriver;
	}
	cacheDriver.latestUseTime = new Date().getTime();

	session.run(command, params)
		.then(result => {
			let data = boltMapping.convertData(result);
			//neo4j driver 5 is agent
			data.summary = {
				version: result.summary.server.agent || result.summary.server.version
			}
			callback(null, data);
			cacheDriver.closeSession(session);
		})
		.catch(error => {

			cleanCacheNeo4jDrivers(host);
			// ['Neo.ClientError.Statement.SyntaxError','ServiceUnavailable','SessionExpired','ProtocolError'].includes(error.code)
			if (DefaultEncrypted === encrypted && ['ServiceUnavailable', 'ProtocolError'].includes(error.code)) {
				console.log(`will try use ${!DefaultEncrypted ? 'tls' : 'tcp'} , ${DefaultEncrypted ? 'tls' : 'tcp'} code:`, error.code);
				boltSessionRunCommand(
					command,
					host,
					username,
					password,
					cb,
					params = {},
					neo4jSessionOptions, !DefaultEncrypted)
			} else {
				console.error(command, ' >> ', error.code, error.message)
				callback(error);
			}
		})

}

function checkConnect(hostname, boltPort, username, password, cb, useCache) {
	let host = `${hostname}:${boltPort}`;
	if (!useCache) {
		cleanCacheNeo4jDrivers(host);
	}
	return boltSessionRunCommand("RETURN 'Neo4j'", host, username, password, cb);
}

module.exports = {
	// query: query,
	excuteCommand: excuteCommand,
	checkConnect: checkConnect,
	cleanCacheNeo4jDrivers: cleanCacheNeo4jDrivers
}