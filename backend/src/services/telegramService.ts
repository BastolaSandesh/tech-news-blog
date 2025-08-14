import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface ArticleApprovalRequest {
    title: string;
    content: string;
    sourceUrl: string;
}

class TelegramService {
    private static instance: TelegramService;
    private bot: TelegramBot;

    private constructor() {
        if (!TELEGRAM_BOT_TOKEN) {
            throw new Error('TELEGRAM_BOT_TOKEN is not configured');
        }

        this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    }

    public static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }

    public async sendArticleForApproval(article: ArticleApprovalRequest): Promise<void> {
        if (!TELEGRAM_CHAT_ID) {
            throw new Error('TELEGRAM_CHAT_ID is not configured');
        }

        const message = `📰 *New Article*\n\n` +
            `*Title:* ${article.title}\n\n` +
            `*Content:*\n${article.content}\n\n` +
            `*Source:* ${article.sourceUrl}`;

        try {
            await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
            console.log('Article sent to Telegram successfully');
        } catch (error) {
            console.error('Error sending article to Telegram:', error);
            throw error;
        }
    }
}

export const telegramService = TelegramService.getInstance();
export type { ArticleApprovalRequest };
