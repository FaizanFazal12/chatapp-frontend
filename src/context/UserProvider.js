import { createContext, useContext, useEffect, useState } from 'react';



const userContext = createContext(null);


export const useUser = () => {
    return useContext(userContext);
}



export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
                    credentials: 'include',
                });

                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                console.log(data);
                setUser(data.user);
            } catch (err) {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []); // Run once on mount
    ;

    return (
        <userContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>
            {children}
        </userContext.Provider>
    )
}