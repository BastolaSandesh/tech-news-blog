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
exports.sendInteractiveMessageToSlack = exports.sendMessageToSlack = exports.handleDiscordReactions = exports.sendMessageToDiscord = void 0;
var discord_js_1 = require("discord.js");
var web_api_1 = require("@slack/web-api");
var DISCORD_BOT_TOKEN = "YOUR_DISCORD_BOT_TOKEN";
var SLACK_BOT_TOKEN = "Yxoxb-9352846701894-9354740601668-QTwXBsCeTnVUZ5EJO2JlToF4"; // Replace with your bot token
var CHANNEL_ID = "C09ACQWPZBQ"; // Replace with the ID of the channel where the bot will send messages
var client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent],
});
var slackClient = new web_api_1.WebClient(SLACK_BOT_TOKEN);
client.once("ready", function () {
    var _a;
    console.log("Logged in as ".concat((_a = client.user) === null || _a === void 0 ? void 0 : _a.tag, "!"));
});
client.login(DISCORD_BOT_TOKEN);
var sendMessageToDiscord = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var channel, sentMessage, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, client.channels.fetch(CHANNEL_ID)];
            case 1:
                channel = (_a.sent());
                if (!channel)
                    throw new Error("Channel not found");
                return [4 /*yield*/, channel.send(message)];
            case 2:
                sentMessage = _a.sent();
                // Add reactions for approval
                return [4 /*yield*/, sentMessage.react("✅")];
            case 3:
                // Add reactions for approval
                _a.sent(); // Approve
                return [4 /*yield*/, sentMessage.react("❌")];
            case 4:
                _a.sent(); // Reject
                return [2 /*return*/, sentMessage];
            case 5:
                error_1 = _a.sent();
                console.error("Error sending message to Discord:", error_1);
                throw error_1;
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.sendMessageToDiscord = sendMessageToDiscord;
var handleDiscordReactions = function (onApprove, onReject) {
    client.on("messageReactionAdd", function (reaction, user) { return __awaiter(void 0, void 0, void 0, function () {
        var emoji, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (user.bot)
                        return [2 /*return*/]; // Ignore bot reactions
                    emoji = reaction.emoji, message = reaction.message;
                    if (!(emoji.name === "✅")) return [3 /*break*/, 2];
                    return [4 /*yield*/, message.reply("Content approved!")];
                case 1:
                    _a.sent();
                    onApprove();
                    return [3 /*break*/, 4];
                case 2:
                    if (!(emoji.name === "❌")) return [3 /*break*/, 4];
                    return [4 /*yield*/, message.reply("Content rejected!")];
                case 3:
                    _a.sent();
                    onReject();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); });
};
exports.handleDiscordReactions = handleDiscordReactions;
var sendMessageToSlack = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, slackClient.chat.postMessage({
                        channel: CHANNEL_ID,
                        text: message,
                    })];
            case 1:
                result = _a.sent();
                console.log("Message sent to Slack:", result.ts);
                return [2 /*return*/, result];
            case 2:
                error_2 = _a.sent();
                console.error("Error sending message to Slack:", error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.sendMessageToSlack = sendMessageToSlack;
var sendInteractiveMessageToSlack = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, slackClient.chat.postMessage({
                        channel: CHANNEL_ID,
                        text: message,
                        attachments: [
                            {
                                text: "Do you approve this content?",
                                fallback: "You are unable to approve or reject.",
                                callback_id: "content_approval",
                                actions: [
                                    {
                                        name: "approve",
                                        text: "Approve",
                                        type: "button",
                                        value: "approve",
                                    },
                                    {
                                        name: "reject",
                                        text: "Reject",
                                        type: "button",
                                        value: "reject",
                                    },
                                ],
                            },
                        ],
                    })];
            case 1:
                result = _a.sent();
                console.log("Interactive message sent to Slack:", result.ts);
                // Simulate user response for testing purposes
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () { return resolve("approve"); }, 5000); // Replace with actual Slack response handling
                    })];
            case 2:
                error_3 = _a.sent();
                console.error("Error sending interactive message to Slack:", error_3);
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.sendInteractiveMessageToSlack = sendInteractiveMessageToSlack;
