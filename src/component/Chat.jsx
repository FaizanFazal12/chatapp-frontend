'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGetOneToOneChatQuery, useSendMessageWithAttachmentMutation } from '@/store/api/messageApi';
import { useUser } from '@/context/UserProvider';
import { useSocket } from '@/context/SocketProvider';
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/solid';

const Chat = ({ sender, selectedUser }) => {
  const [message, setMessage] = useState('');
  const { user, setUser } = useUser();
  const [messages, setMessages] = useState([]);
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [sendMessageWithAttachment, { isLoading: isSendingMessageWithAttachment }] = useSendMessageWithAttachmentMutation();

  const { data, isLoading, error } = useGetOneToOneChatQuery(
    { sender_id: sender?.id, receiver_id: selectedUser?.id },
    { skip: !sender?.id || !selectedUser?.id }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, data?.messages]);

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!message.trim() || !selectedUser || !data?.chat?.id) return;

      socket.emit('send_message', {
        chat_id: data.chat.id,
        content: message.trim(),
        receiver_id: selectedUser?.id,
        sender_id: user?.id,
      });

      setMessage('');
    },
    [message, selectedUser, user, data?.chat?.id, socket]
  );

  const handleReceiveMessage = useCallback((newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    if (!socket || !data?.chat?.id) return;

    socket.emit('join', data.chat.id);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.emit('leave', data.chat.id);
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
      alert('Microphone access error: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob || !selectedUser || !data?.chat?.id) return;

    socket.emit('send_voice_note', {
      chat_id: data.chat.id,
      audio: audioBlob,
      receiver_id: selectedUser?.id,
      sender_id: user?.id,
    });

    setAudioBlob(null);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingAttachment(file);
  };

  const handleSendAttachment = async () => {
    if (!pendingAttachment || !selectedUser || !data?.chat?.id) return;

    const formData = new FormData();
    formData.append('attachment', pendingAttachment);
    formData.append('chat_id', data.chat.id);
    formData.append('receiver_id', selectedUser?.id);
    formData.append('sender_id', user?.id);
    formData.append('content', message);

    try {
      await sendMessageWithAttachment(formData).unwrap();
      setPendingAttachment(null);
      setMessage('');
    } catch (error) {
      alert(error?.message || 'Cannot send attachment');
    }
  };

  const handleCancelAttachment = () => {
    setPendingAttachment(null);
  };

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/';
  };

  if (!selectedUser) {
    return (
      <section className="flex-1 p-8 bg-white h-screen overflow-y-auto">
        <h2 className="text-2xl font-semibold">Chat Area</h2>
        <div className="mt-8 text-gray-500">Select a user to start chatting.</div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col h-screen bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2 sm:gap-6">
        <h2 className="text-lg font-semibold text-gray-800">Chat with {selectedUser.name}</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {isLoading && <div>Loading messages...</div>}
        {error && <div className="text-red-500">Failed to load messages.</div>}

        {[...(data?.chat?.messages || []), ...messages].map((msg) => {
          const isSelf = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex items-end ${isSelf ? 'justify-end' : 'justify-start'}`}>
              {!isSelf && (
                <div className="mr-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {msg?.sender?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-xs shadow ${isSelf ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
              >
                <div className="text-xs font-semibold mb-1">{msg?.sender?.name}</div>
                {msg.type === 'voice' ? (
                  <audio
                    controls
                    src={`${process.env.NEXT_PUBLIC_API_URL}${msg.content}`}
                    className="mt-1 w-[300px]"
                  />
                ) : msg.type === 'attachment' ? (

                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${msg.attachmentUrl}`}
                    download={msg.attachmentName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${isSelf ? 'text-white' : 'text-gray-800'} underline break-all`}
                  >
                    📎 {msg.attachmentName || 'Download file'}
                  </a>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
              {isSelf && (
                <div className="ml-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-white flex items-center gap-2"
      >
        {audioBlob ? (
          <div className="flex items-center gap-2">
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-40" />
            <button type="button" onClick={handleSendVoiceNote} className="p-2 bg-green-500 text-white rounded-full">
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setAudioBlob(null)} className="p-2 bg-red-500 text-white rounded-full">
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        ) : pendingAttachment ? (
          <div className="flex items-center gap-3">
            {pendingAttachment.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(pendingAttachment)}
                alt="Attachment Preview"
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="text-sm text-gray-700">📄 {pendingAttachment.name}</div>
            )}
            <button type="button" onClick={handleSendAttachment} className="p-2 bg-green-500 text-white rounded-full">
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={handleCancelAttachment} className="p-2 bg-red-500 text-white rounded-full">
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className="p-2 rounded-full transition bg-gray-100 hover:bg-blue-100"
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              <MicrophoneIcon className={`h-6 w-6 ${isRecording ? 'text-red-500' : 'text-gray-500'}`} />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={!!audioBlob}
            />
            <label htmlFor="attachment" className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full cursor-pointer">
              <ClipboardDocumentIcon className="h-6 w-6" />
            </label>
            <input type="file" id="attachment" className="hidden" onChange={handleAttachmentChange} />
            <button
              type="submit"
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              disabled={!!audioBlob}
            >
              <PaperAirplaneIcon className="h-6 w-6 rotate-90" />
            </button>
          </>
        )}
      </form>


    </section>
  );
};

export default Chat;
