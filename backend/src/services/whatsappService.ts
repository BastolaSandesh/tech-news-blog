import axios from 'axios';

// WhatsApp Cloud API configuration
const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const RECIPIENT_PHONE_NUMBER = process.env.RECIPIENT_PHONE_NUMBER; // Your phone number

const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

export interface ArticleApprovalRequest {
    title: string;
    content: string;
    sourceUrl: string;
    imageUrl?: string;
    messageId?: string;
}

const pendingApprovals = new Map<string, ArticleApprovalRequest>();

export const sendArticleForApproval = async (article: ArticleApprovalRequest): Promise<string> => {
    try {
        const message = `*New Tech Article for Review*\n\n` +
            `*Title:* ${article.title}\n\n` +
            `*Content:*\n${article.content}\n\n` +
            `*Source:* ${article.sourceUrl}\n\n` +
            `To approve: Reply with "APPROVE"\n` +
            `To request rewrite: Reply with "REWRITE <your feedback>"\n` +
            `To reject: Reply with "REJECT"`;

        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: RECIPIENT_PHONE_NUMBER,
                type: "text",
                text: { body: message }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                }
            }
        );

        const messageId = response.data.messages[0].id;
        pendingApprovals.set(messageId, article);
        
        return messageId;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
};

interface WebhookBody {
    entry: Array<{
        changes: Array<{
            value: {
                messages?: Array<{
                    context?: {
                        id: string;
                    };
                    text?: {
                        body: string;
                    };
                }>;
            };
        }>;
    }>;
}

export const handleWhatsAppWebhook = async (body: WebhookBody) => {
    try {
        const { entry } = body;
        
        for (const e of entry) {
            const changes = e.changes;
            for (const change of changes) {
                if (change.value.messages) {
                    const message = change.value.messages[0];
                    const messageId = message.context?.id;
                    const responseText = message.text?.body?.toUpperCase();

                    if (!messageId || !responseText) continue;

                    const pendingArticle = pendingApprovals.get(messageId);
                    if (!pendingArticle) continue;

                    if (responseText === 'APPROVE') {
                        // Handle approval
                        return {
                            status: 'approved',
                            article: pendingArticle
                        };
                    } else if (responseText.startsWith('REWRITE')) {
                        // Handle rewrite request
                        const feedback = responseText.replace('REWRITE', '').trim();
                        return {
                            status: 'rewrite',
                            feedback,
                            article: pendingArticle
                        };
                    } else if (responseText === 'REJECT') {
                        // Handle rejection
                        return {
                            status: 'rejected',
                            article: pendingArticle
                        };
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing WhatsApp webhook:', error);
        throw error;
    }
};

export const verifyWebhook = (mode: string, token: string, challenge: string) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return challenge;
        }
        throw new Error('Invalid verification token');
    }
    throw new Error('Invalid webhook parameters');
};
