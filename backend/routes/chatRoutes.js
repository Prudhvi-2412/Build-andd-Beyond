const express = require('express');
const router = express.Router();
const { getChatPage } = require('../controllers/chatController');
const isAuthenticated = require('../middlewares/auth');

// Render the chat page for a specific room ID
router.get('/chat/:roomId', isAuthenticated, getChatPage);

module.exports = router;
