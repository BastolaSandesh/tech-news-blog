"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var rssController_1 = require("../controllers/rssController");
var router = (0, express_1.Router)();
router.get("/rss", rssController_1.fetchRSSFeeds);
exports.default = router;
