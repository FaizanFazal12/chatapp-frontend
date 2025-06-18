'use client';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import { useGetGroupChatQuery, useRemoveUserFromGroupMutation, useAddUsersToGroupMutation } from '@/store/api/messageApi';
import { useGetUsersQuery } from '@/store/api/userApi';
import { useSocket } from '@/context/SocketProvider';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export default function GroupChatPage() {
    const { groupId } = useParams();
    const { user } = useUser();
    const { data: groupChat, isLoading ,refetch } = useGetGroupChatQuery(groupId, { skip: !groupId });
    const { data: users } = useGetUsersQuery();
    const [removeUser] = useRemoveUserFromGroupMutation();
    const [addUsers] = useAddUsersToGroupMutation();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const socket = useSocket();
    const messagesEndRef = useRef(null);
    const existingUserIds = useMemo(() => groupChat?.groupChat?.users?.map(u => u.id) || [], [groupChat?.groupChat?.users ,addUsers , removeUser]);

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
    }, [groupChat?.groupChat?.messages ]);

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
        // document.getElementById(userId).remove();
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

    if (isLoading) return <div>Loading...</div>;

    if (!groupChat) {
        return (
            <section style={{ flex: 1, padding: '2rem', background: '#fff', height: '100vh', overflowY: 'auto' }}>
                <h2>Group Chat</h2>
                <div style={{ marginTop: '2rem', color: '#888' }}>
                    Group not found.
                </div>
            </section>
        );
    }

    const isAdmin = groupChat.groupChat?.admin_id === user?.id;

    return (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Group: {groupChat.groupChat?.name}</h2>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsAddMembersModalOpen(true)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Add Members
                        </button>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Group Members:</h3>
                        {groupChat.groupChat?.users?.map(groupUser => (
                            <div id={groupUser.id} key={groupUser.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{groupUser.name}</span>
                                {groupUser.id !== user?.id && (
                                    <button
                                        onClick={() => handleRemoveUser(groupUser.id)}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isAddMembersModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '1rem' }}>Add Members to Group</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users?.filter(u => !existingUserIds.includes(u.id)).map(user => (
                                    <div
                                        key={user.id}
                                        style={{
                                            padding: '0.5rem',
                                            margin: '0.25rem 0',
                                            background: selectedUsers.includes(user.id) ? '#e3f2fd' : '#f5f5f5',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => {}}
                                            style={{ margin: 0 }}
                                        />
                                        {user.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddMembersModalOpen(false);
                                    setSelectedUsers([]);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#f5f5f5',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMembers}
                                disabled={selectedUsers.length === 0}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: selectedUsers.length === 0 ? '#ccc' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: selectedUsers.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Add Selected Users
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                {messages?.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            marginBottom: '1rem',
                            padding: '0.5rem',
                            background: msg.user_id === user?.id ? '#f5f5f5' : '#e3f2fd',
                            borderRadius: '8px',
                            maxWidth: '70%',
                            marginLeft: msg.user_id === user?.id ? 'auto' : '0',
                        }}
                    >
                        <strong>{msg.user?.name}:</strong> {msg.content}
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
            </form>
        </section>
    );
} 