const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");

// associations

User.belongsToMany(Conversation, { through: ConversationUser });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);
Conversation.belongsToMany(User, { through: ConversationUser });
Conversation.hasMany(ConversationUser);
User.hasMany(UserConversation);
ConversationUser.belongsTo(User);
ConversationUser.belongsTo(Conversation);

module.exports = {
  User,
  ConversationUser,
  Conversation,
  Message
};
