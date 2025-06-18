import UserList from '@/component/UserList';



export default function RootLayout({ children }) {

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <UserList />
            <main style={{ flex: 1, background: '#f9f9f9' }}>
            {children}
            </main>
        </div>
    );
}
