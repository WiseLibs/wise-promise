'use strict'

// Safely represent a value as a string, in all node versions.
module.exports = function (value) {
  if (value instanceof Array) {
    return '[' + String(value) + ']'
  }
  if (typeof value === 'string') {
    return '"' + value + '"'
  }
  if (typeof value === 'symbol') {
    return value.toString()
  }
  return String(value)
}
