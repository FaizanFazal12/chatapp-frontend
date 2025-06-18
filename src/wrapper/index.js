'use client';

import { SocketProvider } from "@/context/SocketProvider";
import { UserProvider } from "@/context/UserProvider";
import ReduxProvider from "@/provider/redux-provider";

export default function Wrapper({ children }) {

    return (
        <SocketProvider>
            <UserProvider>

            <ReduxProvider>
                {children}
            </ReduxProvider>
            </UserProvider>

        </SocketProvider>
    )
}
