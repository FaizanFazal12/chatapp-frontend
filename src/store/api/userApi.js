import { commonApi } from "./commonApi";

export const userApi = commonApi.injectEndpoints({
    endpoints: (builder) => ({
        loginUser: builder.mutation({
            query: (data) => ({
                url: `/user/login`,
                method: "POST",
                body: data,
            }),
        }),
        registerUser: builder.mutation({
            query: (data) => ({
                url: `/user/register`,
                method: "POST",
                body: data,
            }),
        }),
        getUsers: builder.query({
            query: () => ({
                url: `/user/users`,
                method: "GET",
            }),
        }),
        getUserById: builder.query({
            query: (id) => ({
                url: `/user/user/${id}`,
                method: "GET",
            }),
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: `/user/logout`,
                method: "POST",
            }),
        }),
        getMe: builder.query({
            query: () => ({
                url: `/user/me`,
                method: "GET",
            }),
        }),
        
    }),
    overrideExisting: true,
});

export const {
    useLoginUserMutation,
    useGetUsersQuery,
    useRegisterUserMutation,
    useGetUserByIdQuery,
    useLogoutUserMutation,
    useGetMeQuery,
} = userApi;
