import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import jwt from 'jsonwebtoken'; // Make sure to import jwt

const socket = io('https://chat-backend-9pci.onrender.com'); // Backend URL

const Chat = ({ token, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [receiverId, setReceiverId] = useState(null);
  const [senderId, setSenderId] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch users and set up socket connection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://chat-backend-9pci.onrender.com/users', {
          headers: { Authorization: token },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();

    socket.on('message', (message) => {
      if (receiverId === message.senderId || receiverId === message.receiverId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('message');
    };
  }, [token, receiverId]);

  // Fetch senderId from the token
  useEffect(() => {
    try {
      const decodedToken = jwt.decode(token);
      setSenderId(decodedToken.userId);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }, [token]);

  // Fetch messages when receiverId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (receiverId) {
        try {
          const response = await axios.get(`https://chat-backend-9pci.onrender.com/messages/${senderId}/${receiverId}`, {
            headers: { Authorization: token },
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      }
    };

    fetchMessages();
  }, [receiverId, senderId, token]);

  // Send message through socket
  const handleSendMessage = () => {
    if (receiverId && content) {
      socket.emit('message', { token, receiverId, content });
      setContent('');
    }
  };

  // Join a room and set receiverId
  const handleJoinRoom = (id) => {
    setReceiverId(id);
    socket.emit('joinRoom', { token, receiverId: id });
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-blue-500 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat App</h1>
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
              <div key={msg.id} className={`mb-2 p-2 rounded ${msg.senderId === senderId ? 'bg-gray-300' : 'bg-blue-300'}`}>
                <strong>{msg.senderId}:</strong> {msg.content}
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
    </div>
  );
};

export default Chat;
