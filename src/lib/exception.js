"use strict";

const Exception = class Exception extends Error {}
const AlreadyOptimized = class AlreadyOptimized extends Exception {}
const ModelNotFound = class ModelNotFound extends Exception {}

exports.Exception = Exception;
exports.AlreadyOptimized = AlreadyOptimized;
exports.ModelNotFound = ModelNotFound;
