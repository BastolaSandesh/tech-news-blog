import express from 'express';
import { verifyWebhook, handleWhatsAppWebhook, sendArticleForApproval } from '../services/whatsappService';
import { addApprovedVlog } from '../controllers/vlogController';
import { rewriteContentWithLLM } from '../services/rssService';

const router = express.Router();

// WhatsApp webhook verification endpoint
router.get('/webhook', (req, res) => {
    try {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;

        const response = verifyWebhook(mode, token, challenge);
        res.status(200).send(response);
    } catch (error) {
        res.status(403).send('Webhook verification failed');
    }
});

// WhatsApp webhook endpoint for receiving messages
router.post('/webhook', async (req, res) => {
    try {
        const result = await handleWhatsAppWebhook(req.body);
        
        if (result) {
            switch (result.status) {
                case 'approved': {
                    await addApprovedVlog(result.article.content);
                    break;
                }
                    
                case 'rewrite': {
                    // Rewrite the content based on feedback
                    const rewrittenContent = await rewriteContentWithLLM(
                        `${result.article.content}\n\nPlease rewrite this content with the following feedback: ${result.feedback}`
                    );
                    // Send the rewritten content back for approval
                    await sendArticleForApproval({
                        ...result.article,
                        content: rewrittenContent
                    });
                    break;
                }
                    
                case 'rejected': {
                    // No action needed for rejected content
                    break;
                }
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});

export default router;
