import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Popup from './popup'; // Import the Popup component

const socket = io('https://chat-backend-9pci.onrender.com'); // Backend URL

const Chat = ({ token, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [receiverId, setReceiverId] = useState(null);
  const [senderId, setSenderId] = useState(null);
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://chat-backend-9pci.onrender.com/users', {
          headers: { Authorization: token },
        });
        setUsers(response.data);
        const userMapping = response.data.reduce((acc, user) => {
          acc[user.id] = user.username;
          return acc;
        }, {});
        setUserMap(userMapping);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    const fetchSenderId = () => {
      try {
        const decodedToken = parseJwt(token);
        setSenderId(decodedToken.userId);
        setReceiverId(decodedToken.userId);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    };

    fetchUsers();
    fetchSenderId();

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('notification', (notification) => {
      setNotifications((prevNotifications) => [...prevNotifications, notification]);
      setPopupMessage(notification.content);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000); // Hide popup after 5 seconds
    });

    return () => {
      socket.off('message');
      socket.off('notification');
    };
  }, [token]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (receiverId && senderId) {
        try {
          const response = await axios.get(`https://chat-backend-9pci.onrender.com//messages/${senderId}/${receiverId}`, {
            headers: { Authorization: token },
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      }
    };

    fetchMessages();

    if (senderId) {
      socket.emit('register', senderId);
    }
  }, [receiverId, senderId, token]);

  const handleSendMessage = () => {
    if (receiverId && content) {
      socket.emit('message', { token, receiverId, content });
      setContent('');
    }
  };

  const handleJoinRoom = (id) => {
    setReceiverId(id);
    socket.emit('joinRoom', { token, receiverId: id });
  };

  const handleMarkNotificationsSeen = async () => {
    try {
      await axios.post('https://chat-backend-9pci.onrender.com/notifications/mark-seen', {
        notificationIds: notifications.map((n) => n.id),
      }, {
        headers: { Authorization: token },
      });
      setNotifications([]);
    } catch (error) {
      console.error('Failed to mark notifications as seen:', error);
    }
  };

  const handleNotificationIconClick = () => {
    if (!showNotifications) {
      handleMarkNotificationsSeen();
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-blue-500 text-white flex justify-between items-center relative">
        <h1 className="text-xl font-bold">Chat App</h1>
        <div className="relative">
          <button onClick={handleNotificationIconClick} className="relative flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.403-1.403A2 2 0 0016 14.586V13a4 4 0 10-8 0v1.586a2 2 0 00-.597 1.011L3 17h5m10 0a2 2 0 01-2 2h-4a2 2 0 01-2-2" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1 py-0.5">{notifications.length}</span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id} className="p-2 border-b last:border-b-0">
                    {notification.content}
                  </li>
                ))}
              </ul>
              <button onClick={handleMarkNotificationsSeen} className="w-full p-2 bg-blue-500 text-white rounded-b">Mark All as Seen</button>
            </div>
          )}
        </div>
        <button onClick={onLogout} className="bg-red-500 px-4 py-2 rounded">Logout</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 p-4 bg-white border-r overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => handleJoinRoom(user.id)}
                  className={`block p-2 mb-2 w-full text-left rounded ${
                    receiverId === user.id ? 'bg-blue-100' : 'hover:bg-gray-200'
                  }`}
                >
                  {user.username}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 flex flex-col bg-gray-100">
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-2 p-2 rounded ${msg.senderId === senderId ? 'bg-blue-300' : 'bg-gray-300'}`}>
                <strong>{msg.senderId === senderId ? 'You' : userMap[msg.senderId]}:</strong> {msg.content}
                <span className="text-sm text-gray-600 float-right">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white border-t flex items-center">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 border rounded p-2 mr-2"
              placeholder="Type your message"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Send
            </button>
          </div>
        </main>
      </div>

      {/* Render Popup */}
      <Popup show={showPopup} onClose={() => setShowPopup(false)} message={popupMessage} />
    </div>
  );
};

export default Chat;
