'use client';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import { useGetGroupChatQuery, useRemoveUserFromGroupMutation, useAddUsersToGroupMutation } from '@/store/api/messageApi';
import { useGetUsersQuery } from '@/store/api/userApi';
import { useSocket } from '@/context/SocketProvider';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UserPlusIcon, UserMinusIcon, PaperAirplaneIcon, MicrophoneIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function GroupChatPage() {
    const { groupId } = useParams();
    const { user } = useUser();
    const { data: groupChat, isLoading, refetch } = useGetGroupChatQuery(groupId, { skip: !groupId });
    const { data: users } = useGetUsersQuery();
    const [removeUser] = useRemoveUserFromGroupMutation();
    const [addUsers] = useAddUsersToGroupMutation();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const socket = useSocket();
    const messagesEndRef = useRef(null);
    const existingUserIds = useMemo(() => groupChat?.groupChat?.users?.map(u => u.id) || [], [groupChat?.groupChat?.users, addUsers, removeUser]);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [audioBlob, setAudioBlob] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, groupChat?.groupChat?.messages]);

    useEffect(() => {
        if (groupChat) {
            setMessages(groupChat?.groupChat?.messages);
        }
    }, [groupChat?.groupChat?.messages]);

    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        if (!message.trim() || !groupId) return;
        socket.emit('send_group_message', {
            group_id: groupId,
            content: message.trim(),
            user_id: user?.id
        });
        setMessage('');
    }, [message, groupId, user?.id, socket]);

    const handleReceiveMessage = useCallback((newMessage) => {
        setMessages(prev => [...prev, newMessage]);
    }, []);

    useEffect(() => {
        if (!socket || !groupId) return;

        socket.emit('join_group', groupId);
        socket.on('receive_group_message', handleReceiveMessage);

        return () => {
            socket.off('receive_group_message', handleReceiveMessage);
            socket.emit('leave_group', groupId);
        };
    }, [socket, groupId, handleReceiveMessage]);

    const handleRemoveUser = async (userId) => {
        if (!confirm('Are you sure you want to remove this user from the group?')) return;
        socket.emit('remove_user_from_group', { group_id: groupId, user_id: userId, admin_id: user?.id });
        refetch();
    };

    const handleAddMembers = async () => {
        try {
            await addUsers({ group_id: groupId, user_ids: selectedUsers }).unwrap();
            setIsAddMembersModalOpen(false);
            setSelectedUsers([]);
            refetch();
        } catch (error) {
            alert(error.data?.message || 'Failed to add members');
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

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
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleSendVoiceNote = async () => {
        if (!audioBlob || !groupId) return;

        socket.emit('send_group_voice_note', {
            group_id: groupId,
            audio: audioBlob,
            sender_id: user?.id
        });

        setAudioBlob(null);
    };

    if (isLoading) return <div className="p-6">Loading...</div>;

    if (!groupChat) {
        return (
            <section className="flex-1 p-8 bg-white h-screen overflow-y-auto">
                <h2 className="text-xl font-bold">Group Chat</h2>
                <div className="mt-4 text-gray-500">Group not found.</div>
            </section>
        );
    }

    const isAdmin = groupChat.groupChat?.admin_id === user?.id;

    return (
        <section className="flex-1 flex flex-col h-screen bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2 sm:gap-6">
                <h2 className="text-lg font-semibold text-gray-800">Group: {groupChat.groupChat?.name}</h2>
                {isAdmin && (
                    <div className="flex flex-wrap gap-4 items-center">
                        <button
                            onClick={() => setIsAddMembersModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            <UserPlusIcon className="h-5 w-5" /> Add Members
                        </button>
                        <div className="flex flex-wrap gap-2">
                            {groupChat.groupChat?.users?.map(groupUser => (
                                <div key={groupUser.id} className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${groupUser.id === user?.id ? 'bg-green-500' : 'bg-blue-500'}`}>
                                        {groupUser.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm">{groupUser.name}</span>
                                    {groupUser.id !== user?.id && (
                                        <button
                                            onClick={() => handleRemoveUser(groupUser.id)}
                                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs"
                                        >
                                            <UserMinusIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isAddMembersModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <h2 className="mb-4 text-lg font-semibold">Add Members</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {users?.filter(u => !existingUserIds.includes(u.id)).map(user => (
                                <div
                                    key={user.id}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedUsers.includes(user.id) ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                    onClick={() => toggleUserSelection(user.id)}
                                >
                                    <input type="checkbox" checked={selectedUsers.includes(user.id)} readOnly />
                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                        {user.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span>{user.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setIsAddMembersModalOpen(false);
                                    setSelectedUsers([]);
                                }}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMembers}
                                disabled={selectedUsers.length === 0}
                                className={`px-4 py-2 rounded text-white ${selectedUsers.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                Add Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages?.map((msg) => (
                    <div key={msg.id} className={`flex items-end ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.user_id !== user?.id && (
                            <div className="mr-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                {msg?.user?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                        <div className={`rounded-lg px-4 py-2 max-w-xs shadow ${msg.user_id === user?.id ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                            <div className="text-xs font-semibold mb-1">{msg?.user?.name}</div>
                            {msg.type === 'voice' ? (
                                <audio controls src={`${process.env.NEXT_PUBLIC_API_URL}${msg.content}`} className="mt-1 w-[300px]" />
                            ) : (
                                <span>{msg.content}</span>
                            )}
                        </div>
                        {msg.user_id === user?.id && (
                            <div className="ml-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                                {user?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 bg-white flex items-center gap-2"
            >
                {audioBlob ? (
                    <div className="flex items-center gap-2">
                        <audio controls src={URL.createObjectURL(audioBlob)} className="w-40" />
                        <button
                            type="button"
                            onClick={handleSendVoiceNote}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                            title="Send Voice Note"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAudioBlob(null)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                            title="Cancel"
                        >
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2 rounded-full transition ${isRecording ? 'bg-red-100' : 'bg-gray-100'} hover:bg-blue-100`}
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
                        <button
                            type="submit"
                            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white"
                            disabled={!!audioBlob}
                        >
                            <PaperAirplaneIcon className="h-6 w-6 rotate-90" />
                        </button>
                    </>
                )}
            </form>
        </section>
    );
}
