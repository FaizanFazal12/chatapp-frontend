'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGetOneToOneChatQuery } from '@/store/api/messageApi';
import { useUser } from '@/context/UserProvider';
import { useSocket } from '@/context/SocketProvider';

const Chat = ({ sender, selectedUser }) => {
  const [message, setMessage] = useState('');
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { data, isLoading, error, refetch } = useGetOneToOneChatQuery(
    { sender_id: sender?.id, receiver_id: selectedUser?.id },
    { skip: !sender?.id || !selectedUser?.id }
  );
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, data?.messages]);

  // Initialize messages when data changes
  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
  
    if (!message.trim() || !selectedUser || !data?.chat?.id) return;

    // Emit the message event
    socket.emit('send_message', {
      chat_id: data.chat.id,
      content: message.trim(),
      receiver_id: selectedUser?.id,
      sender_id: user?.id
    });

    setMessage('');
  }, [message, selectedUser, user, data?.chat?.id, socket]);

  const handleReceiveMessage = useCallback((newMessage) => {
    console.log('newMessage', newMessage);
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !data?.chat?.id) return;

    // Join the chat room
    socket.emit('join', data.chat.id);

    // Listen for new messages
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('join');
      socket.emit('leave', data.chat.id);
      // refetch();
    };
  }, [socket, data?.chat?.id, handleReceiveMessage]);

  const startRecording = async () => {
    try {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert("No microphone found.");
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert("Microphone access denied by the user.");
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert("Microphone is in use or cannot be accessed.");
      } else {
        // console.error("Error accessing microphone:", error);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob || !selectedUser || !data?.chat?.id) return;


    // Emit the voice note event
    socket.emit('send_voice_note', {
      chat_id: data.chat.id,
      audio: audioBlob,
      receiver_id: selectedUser?.id,
      sender_id: user?.id
    });

    setAudioBlob(null);
  };

  if (!selectedUser) {
    return (
      <section style={{ flex: 1, padding: '2rem', background: '#fff', height: '100vh', overflowY: 'auto' }}>
        <h2>Chat Area</h2>
        <div style={{ marginTop: '2rem', color: '#888' }}>
          Select a user to start chatting.
        </div>
      </section>
    );
  }

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h2>Chat with {selectedUser.name}</h2>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {isLoading && <div>Loading messages...</div>}
        {error && <div style={{ color: 'red' }}>Failed to load messages.</div>}

        {data?.chat?.messages?.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              background: msg.sender_id === selectedUser?.id ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px',
              maxWidth: '70%',
              marginLeft: msg.sender_id === selectedUser?.id ? 'auto' : '0',
            }}
          >
            <strong>{msg?.sender?.name}:</strong>
            {msg.type === 'voice' ? (
              <audio controls src={`${process.env.NEXT_PUBLIC_API_URL}${msg.content}`} style={{ marginTop: '0.5rem' }} />
            ) : (
              msg.content
            )}
          </div>
        ))}
        {messages?.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              background: msg.sender_id === selectedUser?.id ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px',
              maxWidth: '70%',
              marginLeft: msg.sender_id === selectedUser?.id ? 'auto' : '0',
            }}
          >
            <strong>{msg?.sender?.name}:</strong>
            {msg.type === 'voice' ? (
              <audio controls src={`${process.env.NEXT_PUBLIC_API_URL}${msg.content}`} style={{ marginTop: '0.5rem' }} />
            ) : (
              msg.content
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '1rem',
          borderTop: '1px solid #eee',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        />
        {audioBlob ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <audio controls src={URL.createObjectURL(audioBlob)} style={{ maxWidth: '200px' }} />
            <button
              type="button"
              onClick={handleSendVoiceNote}
              style={{
                padding: '0.5rem 1rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send Voice Note
            </button>
            <button
              type="button"
              onClick={() => setAudioBlob(null)}
              style={{
                padding: '0.5rem 1rem',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                padding: '0.5rem 1rem',
                background: isRecording ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isRecording ? 'Stop Recording' : 'Record Voice Note'}
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </>
        )}
      </form>
    </section>
  );
};

export default Chat; 