'use client'
import React, { useState } from 'react';
import { useGetUsersQuery } from '@/store/api/userApi';
import { useGetGroupsQuery } from '@/store/api/messageApi';
import { useRouter } from 'next/navigation';
import CreateGroupModal from './CreateGroupModal';

const UserList = () => {
  const router = useRouter();
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const { data: groups, isLoading: groupsLoading } = useGetGroupsQuery();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const handleGroupCreated = (newGroup) => {
    setActiveTab('groups');
    router.push(`/dashboard/group/${newGroup.id}`);
  };

  return (
    <aside style={{ width: '250px', background: '#f4f4f4', height: '100vh', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'users' ? '#007bff' : '#fff',
            color: activeTab === 'users' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'groups' ? '#007bff' : '#fff',
            color: activeTab === 'groups' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Groups
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <h2>Users</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {usersLoading ? (
              <li>Loading users...</li>
            ) : (
              users?.map(user => (
                <li
                  key={user.id}
                  style={{
                    margin: '1rem 0',
                    padding: '0.5rem',
                    background: selectedUserId === user.id ? '#d0eaff' : '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: selectedUserId === user.id ? 'bold' : 'normal',
                  }}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    router.push(`/dashboard/chat/${user.id}`);
                  }}
                >
                  {user.name}
                </li>
              ))
            )}
          </ul>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Groups</h2>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              style={{
                padding: '0.5rem 1rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Create Group
            </button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {groupsLoading ? (
              <li>Loading groups...</li>
            ) : (
              groups?.groups?.map(group => (
                <li
                  key={group.id}
                  style={{
                    margin: '1rem 0',
                    padding: '0.5rem',
                    background: selectedGroupId === group.id ? '#d0eaff' : '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: selectedGroupId === group.id ? 'bold' : 'normal',
                  }}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    router.push(`/dashboard/group/${group.id}`);
                  }}
                >
                  {group.name}
                </li>
              ))
            )}
          </ul>
        </>
      )}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </aside>
  )
}

export default UserList;
