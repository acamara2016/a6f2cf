const router = require("express").Router();
const { Conversation, Message } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");
const { Op } = require("sequelize");
const activeChats = require("../../activeChats");

// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;
    // if we already know conversation id, we can save time and just add it to message and return
    if (conversationId) {
      let read = false;
      if(activeChats[recipientId] && activeChats[senderId])
        activeChats[recipientId].includes(senderId) && activeChats[senderId].includes(recipientId) ? read = true : read = false;
    
      const message = await Message.create({ 
        senderId, 
        text, 
        conversationId, 
        read 
      });
      return res.json({ message, sender });
    }
    // if we don't have conversation id, find a conversation to make sure it doesn't already exist
    let conversation = await Conversation.findConversation(
      senderId,
      recipientId
    );

    if (!conversation) {
      // create conversation
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
      });
      if (onlineUsers.includes(sender.id)) {
        sender.online = true;
      }
    }
    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
    });
    res.json({ message, sender });
  } catch (error) {
    next(error);
  }
});

//update message status to read true 
router.put("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const { conversationId } = req.body;
    const matchingConvo = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId },
        ]
      }
    });
    if (matchingConvo === null) {
      return res.sendStatus(403);
    }
    await Message.update(
      { read: true },
      {
        where: {
          senderId: { [Op.ne]: userId },
          conversationId: conversationId
        },
      }
    );
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
