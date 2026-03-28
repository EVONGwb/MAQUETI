const conversationController = require("./conversation.controller");

module.exports = {
  ...conversationController,
  getOrCreateConversation: conversationController.createOrGetConversation,
  getUserConversations: conversationController.getConversations,
  getConversationMessages: conversationController.getMessages,
  markConversationAsRead: conversationController.markAsRead,
};
