import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';


const SocketContext = createContext(null);


export const useSocket = () => {
    return useContext(SocketContext);
}


export const SocketProvider = ({ children }) => {
    const socket = useMemo(() => io(process.env.NEXT_PUBLIC_API_URL, {
        withCredentials: true,
    }), []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}