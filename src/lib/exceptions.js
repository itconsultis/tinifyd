"use strict";

const NotImplemented = class NotImplemented extends Error {}
const Exception = class Exception extends Error {}
const AlreadyOptimized = class AlreadyOptimized extends Exception {}
const NotFound = class ModelNotFound extends Exception {}
const Conflict = class Conflict extends Exception {};
const UnexpectedValue = class UnexpectedValue extends Exception {};

exports.NotImplemented = NotImplemented;
exports.Exception = Exception;
exports.AlreadyOptimized = AlreadyOptimized;
exports.NotFound = NotFound;
exports.Conflict = Conflict;
exports.UnexpectedValue = UnexpectedValue;
