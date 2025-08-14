"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAndPostContent = exports.rewriteContentWithLLM = exports.getRSSFeeds = void 0;
var rss_parser_1 = require("rss-parser");
var axios_1 = require("axios");
var slackService_1 = require("./slackService");
var vlogController_1 = require("../controllers/vlogController");
var parser = new rss_parser_1.default();
var GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
var GROQ_API_KEY = "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";
var RSS_FEED_URLS = [
    "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    "https://www.theverge.com/rss/index.xml",
    "https://feeds.feedburner.com/TechCrunch/",
    "https://www.wired.com/feed/rss",
    "https://www.cnet.com/rss/news/",
    "https://www.engadget.com/rss.xml",
    "https://arstechnica.com/feed/",
    "https://www.zdnet.com/news/rss.xml",
    "https://www.pcworld.com/index.rss",
    "https://www.computerworld.com/index.rss",
];
var getRSSFeeds = function () { return __awaiter(void 0, void 0, void 0, function () {
    var feedPromises, feeds;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                feedPromises = RSS_FEED_URLS.map(function (url) { return __awaiter(void 0, void 0, void 0, function () {
                    var feed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, parser.parseURL(url)];
                            case 1:
                                feed = _a.sent();
                                return [2 /*return*/, feed.items.map(function (item) { return ({
                                        title: item.title,
                                        link: item.link,
                                        pubDate: item.pubDate,
                                        contentSnippet: item.contentSnippet,
                                    }); })];
                        }
                    });
                }); });
                return [4 /*yield*/, Promise.all(feedPromises)];
            case 1:
                feeds = _a.sent();
                return [2 /*return*/, feeds.flat()];
        }
    });
}); };
exports.getRSSFeeds = getRSSFeeds;
var rewriteContentWithLLM = function (content) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.post(GROQ_API_URL, {
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant that rewrites technology news articles." },
                            { role: "user", content: content },
                        ],
                    }, {
                        headers: {
                            Authorization: "Bearer ".concat(GROQ_API_KEY),
                            "Content-Type": "application/json",
                        },
                    })];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data.choices[0].message.content];
            case 2:
                error_1 = _a.sent();
                console.error("Error rewriting content with LLM:", error_1);
                throw new Error("Failed to rewrite content");
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.rewriteContentWithLLM = rewriteContentWithLLM;
var processAndPostContent = function () { return __awaiter(void 0, void 0, void 0, function () {
    var feeds, _i, feeds_1, feed, content, rewrittenContent, approved, message, slackResponse, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 11, , 12]);
                return [4 /*yield*/, (0, exports.getRSSFeeds)()];
            case 1:
                feeds = _a.sent();
                _i = 0, feeds_1 = feeds;
                _a.label = 2;
            case 2:
                if (!(_i < feeds_1.length)) return [3 /*break*/, 10];
                feed = feeds_1[_i];
                content = "".concat(feed.title, "\n\n").concat(feed.contentSnippet, "\n\nRead more: ").concat(feed.link);
                return [4 /*yield*/, (0, exports.rewriteContentWithLLM)(content)];
            case 3:
                rewrittenContent = _a.sent();
                approved = false;
                _a.label = 4;
            case 4:
                if (!!approved) return [3 /*break*/, 9];
                message = "New Content:\n\n".concat(rewrittenContent, "\n\nReact with \u2705 to approve or \u274C to reject.");
                return [4 /*yield*/, (0, slackService_1.sendInteractiveMessageToSlack)(message)];
            case 5:
                slackResponse = _a.sent();
                if (!(slackResponse === "approve")) return [3 /*break*/, 6];
                console.log("Content approved. Posting to frontend...");
                (0, vlogController_1.addApprovedVlog)(rewrittenContent); // Add to approved vlogs
                approved = true;
                return [3 /*break*/, 8];
            case 6:
                if (!(slackResponse === "reject")) return [3 /*break*/, 8];
                console.log("Content rejected. Rewriting...");
                return [4 /*yield*/, (0, exports.rewriteContentWithLLM)(content)];
            case 7:
                rewrittenContent = _a.sent(); // Rewrite content again
                _a.label = 8;
            case 8: return [3 /*break*/, 4];
            case 9:
                _i++;
                return [3 /*break*/, 2];
            case 10: return [3 /*break*/, 12];
            case 11:
                error_2 = _a.sent();
                console.error("Error processing and posting content:", error_2);
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.processAndPostContent = processAndPostContent;
