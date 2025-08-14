import { WebClient } from "@slack/web-api";

// Development mode switch - set to true to bypass Slack integration
const DEV_MODE = true;

// Mock implementations for development mode
const mockSendMessage = async (message: string): Promise<{ ts: string }> => {
    console.log("[DEV MODE] Would send to Slack:", message);
    return { ts: new Date().getTime().toString() };
};

const mockSendInteractiveMessage = async (message: string): Promise<string> => {
    console.log("[DEV MODE] Would send to Slack for approval:", message);
    console.log("[DEV MODE] Auto-approving content after 2 seconds...");
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("[DEV MODE] Content auto-approved");
            resolve("approve");
        }, 2000);
    });
};

// Real Slack implementation
let slackClient: WebClient | undefined;
let channelId: string | undefined;

if (!DEV_MODE) {
    const token = process.env.SLACK_BOT_TOKEN;
    channelId = process.env.SLACK_CHANNEL_ID;

    if (!token || !channelId) {
        console.error("Slack configuration missing. Set SLACK_BOT_TOKEN and SLACK_CHANNEL_ID environment variables.");
    } else {
        slackClient = new WebClient(token);
    }
}

export const sendMessageToSlack = async (message: string) => {
    if (DEV_MODE) {
        return mockSendMessage(message);
    }

    if (!slackClient || !channelId) {
        throw new Error("Slack not configured");
    }

    try {
        const result = await slackClient.chat.postMessage({
            channel: channelId,
            text: message,
        });
        console.log("Message sent to Slack:", result.ts);
        return result;
    } catch (error) {
        console.error("Error sending message to Slack:", error);
        throw error;
    }
};

export const sendInteractiveMessageToSlack = async (message: string): Promise<string> => {
    if (DEV_MODE) {
        return mockSendInteractiveMessage(message);
    }

    if (!slackClient || !channelId) {
        console.log("Slack not configured, auto-approving content");
        return "approve";
    }

    try {
        const result = await slackClient.chat.postMessage({
            channel: channelId,
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
        });

        console.log("Interactive message sent to Slack:", result.ts);
        
        // For now, auto-approve after 2 seconds
        return new Promise((resolve) => {
            setTimeout(() => resolve("approve"), 2000);
        });
    } catch (error) {
        console.error("Error sending interactive message to Slack:", error);
        console.log("Falling back to auto-approve");
        return "approve";
    }
};
