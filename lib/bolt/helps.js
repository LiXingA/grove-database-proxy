/*
 * Copyright (c) 2002-2018 "Neo4j, Inc"
 * Network Engine for Objects in Lund AB [http://neotechnology.com]
 *
 * This file is part of Neo4j.
 *
 * Neo4j is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var neo4j = require('neo4j-driver');
var boltMapping = require('./boltMapping')

const getRecordsToDisplayInTable = (result, maxRows) => {
  if (!result) return []
  return result && result.records && result.records.length > maxRows
    ? result.records.slice(0, maxRows)
    : result.records
}

const resultHasNodes = (request, types = bolt.neo4j.types) => {
  if (!request) return false
  const { result = {} } = request
  if (!result || !result.records) return false
  const { records = undefined } = result
  if (!records || !records.length) return false
  let keys = records[0].keys
  for (let i = 0; i < records.length; i++) {
    const graphItems = keys.map(key => records[i].get(key))
    const items = boltMapping.recursivelyExtractGraphItems(types, graphItems)
    const flat = boltMapping.flattenArray(items)
    const nodes = flat.filter(
      item => item instanceof types.Node || item instanceof types.Path
    )
    if (nodes.length) return true
  }
  return false
}

const resultHasRows = request => {
  return !!(
    request &&
    request.result &&
    request.result.records &&
    request.result.records.length
  )
}

const resultHasWarnings = request => {
  return !!(
    request &&
    request.result &&
    request.result.summary &&
    request.result.summary.notifications &&
    request.result.summary.notifications.length
  )
}

const resultHasPlan = request => {
  return !!(
    request &&
    request.result &&
    request.result.summary &&
    !!(request.result.summary.plan || request.result.summary.profile)
  )
}

const resultIsError = request => {
  return !!(request && request.result && request.result.code)
}

/**
 * Takes an array of objects and stringifies it using a
 * modified version of JSON.stringify.
 * It takes a replacer without enforcing quoting rules to it.
 * Used so we can have Neo4j integers as string without quotes.
 */
const stringifyResultArray = (formatter = stringFormat, arr = []) => {
  return arr.map(col => {
    if (!col) return col
    return col.map(fVal => {
      return stringifyMod(fVal, formatter)
    })
  })
}

/**
 * Transforms an array of neo4j driver records to an array of objects.
 * Flattens graph items so only their props are left.
 * Leaves Neo4j Integers as they were.
 */
const transformResultRecordsToResultArray = records => {
  return records && records.length
    ? [records]
      .map(extractRecordsToResultArray)
      .map(
        flattenGraphItemsInResultArray.bind(null, neo4j.types, neo4j.isInt)
      )[0]
    : undefined
}

/**
 * Transforms an array of neo4j driver records to an array of objects.
 * Leaves all values as they were, just changing the data structure.
 */
const extractRecordsToResultArray = (records = []) => {
  records = Array.isArray(records) ? records : []
  const keys = records[0] ? [records[0].keys] : undefined
  return (keys || []).concat(
    records.map(record => {
      return record.keys.map((key, i) => record._fields[i])
    })
  )
}

const flattenGraphItemsInResultArray = (
  types = neo4j.types,
  intChecker = neo4j.isInt,
  result = []
) => {
  return result.map(flattenGraphItems.bind(null, types, intChecker))
}

/**
 * Recursively looks for graph items and elevates their properties if found.
 * Leaves everything else (including neo4j integers) as is
 */
const flattenGraphItems = (
  types = neo4j.types,
  intChecker = neo4j.isInt,
  item
) => {
  if (Array.isArray(item)) {
    return item.map(flattenGraphItems.bind(null, types, intChecker))
  }
  if (
    typeof item === 'object' &&
    item !== null &&
    !isGraphItem(types, item) &&
    !intChecker(item)
  ) {
    let out = {}
    const keys = Object.keys(item)
    for (let i = 0; i < keys.length; i++) {
      out[keys[i]] = flattenGraphItems(types, intChecker, item[keys[i]])
    }
    return out
  }
  if (isGraphItem(types, item)) {
    return extractPropertiesFromGraphItems(types, item)
  }
  return item
}

const isGraphItem = (types = neo4j.types, item) => {
  return (
    item instanceof types.Node ||
    item instanceof types.Relationship ||
    item instanceof types.Path ||
    item instanceof types.PathSegment,
    item instanceof neo4j.types.Date ||
    item instanceof neo4j.types.DateTime ||
    item instanceof neo4j.types.Duration ||
    item instanceof neo4j.types.LocalDateTime ||
    item instanceof neo4j.types.LocalTime ||
    item instanceof neo4j.types.Time ||
    item instanceof neo4j.types.Point
  )
}

function extractPropertiesFromGraphItems (types = neo4j.types, obj) {
  if (obj instanceof types.Node || obj instanceof types.Relationship) {
    return obj.properties
  } else if (obj instanceof types.Path) {
    return [].concat.apply([], arrayifyPath(types, obj))
  }
  return obj
}

const arrayifyPath = (types = neo4j.types, path) => {
  let segments = path.segments
  // Zero length path. No relationship, end === start
  if (!Array.isArray(path.segments) || path.segments.length < 1) {
    segments = [{ ...path, end: null }]
  }
  return segments.map(function (segment) {
    return [
      extractPropertiesFromGraphItems(types, segment.start),
      extractPropertiesFromGraphItems(types, segment.relationship),
      extractPropertiesFromGraphItems(types, segment.end)
    ].filter(part => part !== null)
  })
}

module.exports={
    resultHasNodes,
    resultHasPlan,
    resultIsError,
    resultHasWarnings,
    extractRecordsToResultArray,
    transformResultRecordsToResultArray
}
