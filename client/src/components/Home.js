import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [previousOtherUserId, setPreviousOtherUserId] = useState(null);
  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };
 

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }

      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      const newState = [...conversations];
      newState.forEach((convo) => {
        if (convo.otherUser.id === recipientId) {
          convo.messages.push(message);
          convo.latestMessageText = message.text;
          convo.id = message.conversationId;
        }
      });
      const orderedConvos = sortSideBarConversationByDate(newState);
      setConversations(orderedConvos);
    },
    [setConversations, conversations]
  );

  //updating message state for current user
  const updateReadCount = async (conversationId) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.id === conversationId) {
          const convoCopy = { ...convo };
          convoCopy.notification = 0;
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
    await axios.put('/api/messages', { conversationId });
  };
  const sortSideBarConversationByDate = (convos) => {
    const convosCopy = [...convos];
    convosCopy.sort((a, b)=>{
      return new Date(b.latestUpdate) - new Date(a.latestUpdate);
    });
    return convosCopy;
  }

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      const { message, sender = null } = data;
      const newState = [...conversations];
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          notification: 0,
          messages: [message],
        };
        newConvo.latestMessageText = message.text;
        newConvo.latestUpdate = message.updatedAt;
        setConversations((prev) => [newConvo, ...prev]);
      }
      newState.forEach((convo) => {
        if (convo.id === message.conversationId && data.message.senderId===convo.otherUser.id) {
          let updatedNotification = 0;
          if(previousOtherUserId!==convo.otherUser.id){
            updatedNotification = convo.notification+1;
          }
          convo.notification = updatedNotification;
          convo.read = false;
          convo.messages.push(message);
          convo.latestMessageText = message.text;
          convo.latestUpdate = message.updatedAt;
        }else if(convo.id === message.conversationId){
          convo.read = false;
          convo.messages.push(message);
          convo.latestMessageText = message.text;
        }
      });
      const orderedConvos = sortSideBarConversationByDate(newState);
      setConversations(orderedConvos);
    },
    [setConversations, conversations, previousOtherUserId]
  );

  const setActiveChat = (otherUser) => {
    //if user was in a previous chat, leave chat before joining chat
    if(previousOtherUserId!==null)
      socket.emit('leave-chat', user.id, previousOtherUserId);
    socket.emit('join-chat', user.id, otherUser.id);
    setActiveConversation(otherUser.username);
    setPreviousOtherUserId(otherUser.id);
  };

  //update when other user read unread message from currentUser
  const handleReadUpdate = useCallback(async(currentUser, other)=>{
    const newState = [...conversations];
    const messageTobeUpdated = [];
    newState.forEach(convo=>{
      if(convo.otherUser.id===currentUser){
        convo.messages.forEach(message=>{
          if(message.senderId===other && !message.read){
            messageTobeUpdated.push(message);
            message.read = true;
          }
        }) 
      }
    })
    setConversations(newState);
  },[setConversations, conversations]);

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addMessageToConversation);
    socket.on('user-in-chat', handleReadUpdate);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addMessageToConversation);
      socket.off('user-in-chat', handleReadUpdate);
    };
  }, [addMessageToConversation, addOnlineUser, removeOfflineUser, handleReadUpdate, socket]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/conversations');
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
          updateReadCount={updateReadCount}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
