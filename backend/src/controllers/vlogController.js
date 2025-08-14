"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchApprovedVlogs = exports.addApprovedVlog = void 0;
var approvedVlogs = []; // Temporary in-memory storage for approved vlogs
var addApprovedVlog = function (vlog) {
    approvedVlogs.push(vlog);
};
exports.addApprovedVlog = addApprovedVlog;
var fetchApprovedVlogs = function () {
    return approvedVlogs;
};
exports.fetchApprovedVlogs = fetchApprovedVlogs;
