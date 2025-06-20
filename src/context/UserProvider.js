import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';


const userContext = createContext(null);


export const useUser = () => {
    return useContext(userContext);
}



export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    if (pathname !== '/') {
                        window.location.href = '/';
                        return;
                    }
                }
                const data = await res.json();
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