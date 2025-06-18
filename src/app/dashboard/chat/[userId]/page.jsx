'use client';
import { useParams } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import Chat from '@/component/Chat';
import { useGetUserByIdQuery, useGetUsersQuery } from '@/store/api/userApi';

export default function UserChatPage() {
    const { userId } = useParams();
    const { user } = useUser();
    const { data: selectedUser, isLoading } = useGetUserByIdQuery(userId);

    // Find the selected user from the list


    if (isLoading) return <div>Loading...</div>


    return (
        <Chat sender={user} selectedUser={selectedUser} />
    );
} 