import { Router } from 'express';
import { validateTeamId } from '../controllers/middlewareController';
import { getChannels } from '../controllers/channelController';
import { sendMessage } from '../controllers/messageController';
import { getScheduledMessages, updateScheduledMessage, deleteScheduledMessage } from '../controllers/scheduledMessageController';
import { logout } from '../controllers/authController';

const router = Router();

router.use('/:teamId/*', validateTeamId);

router.get('/:teamId/channels', getChannels);

router.post('/:teamId/send-message', sendMessage);

router.get('/:teamId/scheduled-messages', getScheduledMessages);

router.put('/:teamId/scheduled-messages/:messageId', updateScheduledMessage);

router.delete('/:teamId/scheduled-messages/:messageId', deleteScheduledMessage);

router.post('/:teamId/logout', logout);

export default router;
