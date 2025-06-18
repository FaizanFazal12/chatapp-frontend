import { commonApi } from './commonApi';

export const messageApi = commonApi.injectEndpoints({
  endpoints: (builder) => ({
    getChatMessages: builder.query({
      query: ({ chat_id }) => ({
        url: `/chat/get-chat-messages/${chat_id}`,
        method: 'GET',
      }),
    }),
    getOneToOneChat: builder.query({
      query: ({ sender_id, receiver_id }) => ({
        url: `/chat/get-chat/${sender_id}/${receiver_id}`,
        method: 'GET',
      }),
    }),
    getChats: builder.query({
      query: ({ user_id }) => ({
        url: `/chat/get-chats/${user_id}`,
        method: 'GET',
      }),
    }),
    getGroups: builder.query({
      query: () => ({
        url: `/chat/get-groups`,
        method: 'GET',
      }),
      providesTags: ['Groups'],
    }),
    getGroupChat: builder.query({
      query: (groupId) => ({
        url: `/chat/get-group-chat/${groupId}`,
        method: 'GET',
      }),
    }),
    createGroup: builder.mutation({
      query: (data) => ({
        url: `/chat/create-group`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Groups'],
    }),
    removeUserFromGroup: builder.mutation({
      query: ({ group_id, user_id }) => ({
        url: `/chat/remove-user/${group_id}/${user_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Groups'],
    }),
    addUsersToGroup: builder.mutation({
      query: ({ group_id, user_ids }) => ({
        url: `/chat/add-users/${group_id}`,
        method: 'POST',
        body: { user_ids },
      }),
      invalidatesTags: ['Groups'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetChatMessagesQuery,
  useGetOneToOneChatQuery,
  useGetChatsQuery,
  useGetGroupsQuery,
  useGetGroupChatQuery,
  useCreateGroupMutation,
  useRemoveUserFromGroupMutation,
  useAddUsersToGroupMutation,
} = messageApi; 