'use client'
import React, { useState } from 'react';
import { useGetUsersQuery } from '@/store/api/userApi';
import { useCreateGroupMutation } from '@/store/api/messageApi';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { data: users, isLoading } = useGetUsersQuery();
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const response = await createGroup({
        name: groupName.trim(),
        user_ids: selectedUsers
      }).unwrap();
      
      onGroupCreated(response.group);
      onClose();
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      alert(error.data?.message || 'Failed to create group');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
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
        <h2 style={{ marginBottom: '1rem' }}>Create New Group</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Select Users
            </label>
            {isLoading ? (
              <div>Loading users...</div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {users?.map(user => (
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
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
              style={{
                padding: '0.5rem 1rem',
                background: isCreating || !groupName.trim() || selectedUsers.length === 0 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isCreating || !groupName.trim() || selectedUsers.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal; 