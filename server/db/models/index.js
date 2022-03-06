const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");

// associations

User.hasMany(Conversation, { through: ConversationUser });
Message.belongsTo(Conversation);
Conversation.hasMany(Message);
Conversation.belongsToMany(User, { through: ConversationUser });
Conversation.hasMany(ConversationUser);
ConversationUser.belongsTo(Conversation);
ConversationUser.belongsTo(User);

module.exports = {
  User,
  ConversationUser,
  Conversation,
  Message
};
