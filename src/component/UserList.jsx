'use client'
import React, { useEffect, useState } from 'react';
import { useGetUsersQuery } from '@/store/api/userApi';
import { useGetGroupsQuery } from '@/store/api/messageApi';
import { useRouter, usePathname, useParams } from 'next/navigation';
import CreateGroupModal from './CreateGroupModal';
import { UserGroupIcon, UserIcon, PlusCircleIcon } from '@heroicons/react/24/solid';

const UserList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const { data: groups, isLoading: groupsLoading } = useGetGroupsQuery();
  const [activeTab, setActiveTab] = useState('users');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // Determine selected user/group from URL
  const selectedUserId = pathname.startsWith('/dashboard/chat/') ? params.userId : null;
  const selectedGroupId = pathname.startsWith('/dashboard/group/') ? params.groupId : null;

  
  useEffect(() => {
    setActiveTab(selectedUserId ? 'users' : 'groups');
  }, [selectedUserId, selectedGroupId]);
  const handleGroupCreated = (newGroup) => {
    setActiveTab('groups');
    router.push(`/dashboard/group/${newGroup.id}`);
  };



  return (
    <aside className="w-64 bg-white h-screen p-4 flex flex-col border-r border-gray-200">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setActiveTab('users');
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition font-medium ${activeTab === 'users' ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
        >
          <UserIcon className="h-5 w-5" /> Users
        </button>
        <button
          onClick={() => {
            setActiveTab('groups');
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition font-medium ${activeTab === 'groups' ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
        >
          <UserGroupIcon className="h-5 w-5" /> Groups
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Users</h2>
          <ul className="space-y-2 overflow-y-auto flex-1">
            {usersLoading ? (
              <li>Loading users...</li>
            ) : (
              users?.map(user => (
                <li
                  key={user.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedUserId == user.id ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
                  onClick={() => {
                    router.push(`/dashboard/chat/${user.id}`);
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="truncate">{user.name}</span>
                </li>
              ))
            )}
          </ul>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-800">Groups</h2>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Create
            </button>
          </div>
          <ul className="space-y-2 overflow-y-auto flex-1">
            {groupsLoading ? (
              <li>Loading groups...</li>
            ) : (
              groups?.groups?.map(group => (
                <li
                  key={group.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedGroupId == group.id ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
                  onClick={() => {
                    router.push(`/dashboard/group/${group.id}`);
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-base">
                    {group.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="truncate">{group.name}</span>
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
