let neo4j = require('neo4j-driver');
let helps = require('./helps')
const GRAPH = 'GRAPH'
const PLAN = 'PLAN'
const WARNINGS = 'WARNINGS'
const ERRORS = 'ERRORS'
const TABLE = 'TABLE'
const CODE = 'CODE'
const ERROR = 'ERROR'
const TEXT = 'TEXT'

const resultContainsGraphKeys = keys => {
    return keys.includes('nodes') && keys.includes('relationships')
}

const flattenArray = arr => {
    return arr.reduce((all, curr) => {
        if (Array.isArray(curr)) return all.concat(flattenArray(curr))
        return all.concat(curr)
    }, [])
}

const extractNodesAndRelationshipsFromPath = (item, rawNodes, rawRels) => {
    let paths = Array.isArray(item) ? item : [item]
    paths.forEach(path => {
        let segments = path.segments
        // Zero length path. No relationship, end === start
        if (!Array.isArray(path.segments) || path.segments.length < 1) {
            segments = [{
                ...path,
                end: null
            }]
        }
        segments.forEach(segment => {
            if (segment.start) rawNodes.push(segment.start)
            if (segment.end) rawNodes.push(segment.end)
            if (segment.relationship) rawRels.push(segment.relationship)
        })
    })
}

const arrayIntToString = (arr, converters) => {
    return arr.map(item => itemIntToString(item, converters))
}

const numberFormat = anything => {
    if (Math.floor(anything) === anything) {
        return `${anything}.0`
    }
    return undefined
}

const spacialFormat = anything => {
    const zString = anything.z ? `, z:${anything.z}` : ''
    return `point({srid:${anything.srid}, x:${anything.x}, y:${anything.y}${zString}})`
}

const isTemporalType = anything =>
    anything instanceof neo4j.types.Date ||
    anything instanceof neo4j.types.DateTime ||
    anything instanceof neo4j.types.Duration ||
    anything instanceof neo4j.types.LocalDateTime ||
    anything instanceof neo4j.types.LocalTime ||
    anything instanceof neo4j.types.Time


const stringFormat = anything => {
    if (typeof anything === 'number') {
        return numberFormat(anything)
    }
    //here is big int, return the as string at first
    if (neo4j.isInt(anything)) {
        return anything.toString();
    }

    if (anything instanceof neo4j.types.Point) {
        return spacialFormat(anything)
    }
    if (isTemporalType(anything)) {
        return `${anything.toString()}`
    }
    return undefined
}

const itemIntToString = (item) => {
    const converters = {
        intChecker: neo4j.isInt,
        intConverter: val => val.toNumber(),
        objectConverter: extractFromNeoObjects
    }
    if (['number', 'string', 'boolean'].indexOf(typeof item) !== -1) return item
    const res = stringFormat(item)
    if (res) return res
    if (converters.intChecker(item)) return converters.intConverter(item)
    if (Array.isArray(item)) return arrayIntToString(item, converters)
    if (item === null) return item
    if (typeof item === 'object') return objIntToString(item, converters)
}

const extractFromNeoObjects = (obj, converters) => {
    if (
        obj instanceof neo4j.types.Node ||
        obj instanceof neo4j.types.Relationship
    ) {
        return obj.properties
    } else if (obj instanceof neo4j.types.Path) {
        return [].concat.apply([], extractPathForRows(obj, converters))
    }
    return obj
}

const resultHasNodes = (request, types = neo4j.types) => {
    if (!request) return false
    if (!request || !request.records) return false
    const {
        records = undefined
    } = request
    if (!records || !records.length) return false
    let keys = records[0].keys
    for (let i = 0; i < records.length; i++) {
        const graphItems = keys.map(key => records[i].get(key))
        const items = recursivelyExtractGraphItems(types, graphItems)
        const flat = flattenArray(items)
        const nodes = flat.filter(
            item => item instanceof types.Node || item instanceof types.Path
        )
        const relationships = flat.filter(
            item => item instanceof types.Relationship
        )
        if (nodes.length || relationships.length) return true
    }
    return false
}

const extractPathForRows = (path, converters) => {
    let segments = path.segments
    // Zero length path. No relationship, end === start
    if (!Array.isArray(path.segments) || path.segments.length < 1) {
        segments = [{
            ...path,
            end: null
        }]
    }
    return segments.map(function (segment) {
        return [
            objIntToString(segment.start, converters),
            objIntToString(segment.relationship, converters),
            objIntToString(segment.end, converters)
        ].filter(part => part !== null)
    })
}

const objIntToString = (obj, converters) => {
    let entry = converters.objectConverter(obj, converters)
    let newObj = null
    if (Array.isArray(entry)) {
        newObj = entry.map(item => itemIntToString(item, converters))
    } else if (entry !== null && typeof entry === 'object') {
        newObj = {}
        Object.keys(entry).forEach(key => {
            newObj[key] = itemIntToString(entry[key], converters)
        })
    }
    return newObj
}

const recursivelyExtractGraphItems = (types, item) => {
    if (item instanceof types.Node) return item
    if (item instanceof types.Relationship) return item
    if (item instanceof types.Path) return item
    if (Array.isArray(item)) {
        return item.map(i => recursivelyExtractGraphItems(types, i))
    }
    if (['number', 'string', 'boolean'].indexOf(typeof item) !== -1) return false
    if (item === null) return false
    if (typeof item === 'object') {
        return Object.keys(item).map(key =>
            recursivelyExtractGraphItems(types, item[key])
        )
    }
    return item
}


const extractRecordsToResultArray = (records = []) => {
    records = Array.isArray(records) ? records : []
    const keys = records[0] ? [records[0].keys] : undefined
    return (keys || []).concat(
        records.map(record => {
            return record.keys.map((key, i) => record._fields[i])
        })
    )
}

const getResultType = (result) => {
    if (resultHasNodes(result)) {
        return GRAPH
    } else if (result.status === 'error') {
        return ERROR
    }

    return TABLE
}

function convertData(result) {
    let type = getResultType(result)
    let response = {}
    switch (type) {
        case GRAPH:
            {
                response = extractNodesAndRelationshipsFromRecords(result.records, neo4j.types, true)
                break
            }
        case TABLE:
            {
                response = {
                    type: TABLE,
                    data: helps.extractRecordsToResultArray(result.records)
                }

                break
            }

    }

    return response
}


function extractNodesAndRelationshipsFromRecords(
    records,
    types,
    filterRels
) {
    if (records.length === 0) {
        return {
            nodes: [],
            relationships: []
        }
    }
    let keys = records[0].keys
    let rawNodes = []
    let rawRels = []
    if (resultContainsGraphKeys(keys)) {
        rawNodes = [...rawNodes, ...records[0].get(keys[0])]
        rawRels = [...rawRels, ...records[0].get(keys[1])]
    } else {
        records.forEach(record => {
            let graphItems = keys.map(key => record.get(key))
            graphItems = flattenArray(
                recursivelyExtractGraphItems(types, graphItems)
            ).filter(item => item !== false)
            rawNodes = [
                ...rawNodes,
                ...graphItems.filter(item => item instanceof types.Node)
            ]
            rawRels = [
                ...rawRels,
                ...graphItems.filter(item => item instanceof types.Relationship)
            ]
            let paths = graphItems.filter(item => item instanceof types.Path)
            paths.forEach(item =>
                extractNodesAndRelationshipsFromPath(item, rawNodes, rawRels, types)
            )
        })
    }
    const nodes = rawNodes.map(item => {
        return {
            id: item.identity.toString(),
            labels: item.labels,
            properties: itemIntToString(item.properties)
        }
    })
    let relationships = rawRels
    // if (filterRels) {
    //     relationships = rawRels.filter(
    //         item =>
    //             nodes.filter(node => node.id === item.start.toString()).length > 0 &&
    //             nodes.filter(node => node.id === item.end.toString()).length > 0
    //     )
    // }
    relationships = relationships.map(item => {
        return {
            id: item.identity.toString(),
            startNodeId: item.start.toString(),
            endNodeId: item.end.toString(),
            type: item.type,
            properties: itemIntToString(item.properties)
        }
    })
    return {
        data: {
            nodes: nodes,
            relationships: relationships
        },
        type: GRAPH
    }
}

module.exports = {
    extractNodesAndRelationshipsFromRecords,
    convertData
}