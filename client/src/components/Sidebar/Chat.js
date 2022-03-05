import React from 'react';
import { Box } from '@material-ui/core';
import { BadgeAvatar, ChatContent } from '../Sidebar';
import { makeStyles } from '@material-ui/core/styles';
import Notification from './Notification';

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 8,
    height: 80,
    boxShadow: '0 2px 10px 0 rgba(88,133,196,0.05)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      cursor: 'grab',
    },
  },
}));

const Chat = ({ userId, conversation, setActiveChat, updateReadCount }) => {
  const classes = useStyles();
  const { otherUser } = conversation;

  const handleClick = async () => {
    await setActiveChat(otherUser);
    updateReadCount(conversation.id);
  };

  return (
    <Box onClick={() => handleClick()} className={classes.root}>
      <BadgeAvatar
        photoUrl={otherUser.photoUrl}
        username={otherUser.username}
        online={otherUser.online}
        sidebar={true}
      />
      <ChatContent 
        unread={conversation.notification>0}
        conversation={conversation} 
      />
      <Notification count={conversation.notification} />
    </Box>
  );
};

export default Chat;
