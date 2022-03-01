import React from 'react';
import { Box } from '@material-ui/core';
import { SenderBubble, OtherUserBubble } from '.';
import moment from 'moment';

const Messages = (props) => {
  const { messages, otherUser, userId } = props;
  const messageLength = messages.length;
  return (
    <Box>
      {messages.map((message, index) => {
        const time = moment(message.createdAt).format('h:mm');
        return message.senderId === userId ? (
          <SenderBubble 
            key={message.id} 
            text={message.text} 
            time={time} 
            read={messageLength-1===index && message.read===true}
            readBy={otherUser}
          />
 
        ) : (
          <OtherUserBubble
            key={message.id}
            text={message.text}
            time={time}
            otherUser={otherUser}
          />
        );
      })}
    </Box>
  );
};

export default Messages;
