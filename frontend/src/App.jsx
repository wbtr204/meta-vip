import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const HomePage = lazy(() => import("./pages/home/HomePage"));
const LoginPage = lazy(() => import("./pages/auth/login/LoginPage"));
const SignUpPage = lazy(() => import("./pages/auth/signup/SignUpPage"));
const NotificationPage = lazy(() => import("./pages/notification/NotificationPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const SearchPage = lazy(() => import("./pages/search/SearchPage"));
const ExplorePage = lazy(() => import("./pages/explore/ExplorePage"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const BookmarkPage = lazy(() => import("./pages/bookmark/BookmarkPage"));
const PostPage = lazy(() => import("./pages/post/PostPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { useSocketContext } from "./context/SocketContext";

const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-full flex-1 flex flex-col"
    >
        {children}
    </motion.div>
);

function App() {
	const [theme, setTheme] = useState(localStorage.getItem("theme") || "vibenet");
    const queryClient = useQueryClient();
    const { socket } = useSocketContext();
    const location = useLocation();

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);
        
        if (theme === "vibenet" || theme === "black" || theme === "business") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
	}, [theme]);

	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/auth/me");
                
                // Silent check: Nếu là 401 thì trả về null ngay, không ném lỗi ra console
                if (res.status === 401) return null;

				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				return null;
			}
		},
		retry: false,
	});

    // Global Synchronization System Pulse
    useEffect(() => {
        if (!socket || !authUser) return;

        const handleGlobalSync = () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        };

        socket.on("newMessage", handleGlobalSync);
        socket.on("newNotification", handleGlobalSync);

        return () => {
            socket.off("newMessage", handleGlobalSync);
            socket.off("newNotification", handleGlobalSync);
        };
    }, [socket, authUser, queryClient]);

	if (isLoading) {
		return (
			<div className='h-screen flex justify-center items-center'>
				<LoadingSpinner size='lg' />
			</div>
		);
	}

	return (
		<>
			<AnimatePresence mode="wait">
                <Suspense fallback={<div className='h-screen flex justify-center items-center bg-slate-950'><LoadingSpinner size='lg' /></div>}>
                    <Routes location={location} key={location.pathname}>
                        {/* Auth Routes - True Full Screen */}
                        <Route path='/login' element={!authUser ? <PageWrapper><LoginPage /></PageWrapper> : <Navigate to='/' />} />
                        <Route path='/signup' element={!authUser ? <PageWrapper><SignUpPage /></PageWrapper> : <Navigate to='/' />} />

                        {/* App Routes - Balanced Layout */}
                        <Route path='*' element={
                            <div className={`${authUser ? 'max-w-[1320px] mx-auto w-full' : 'max-w-none w-full'} flex ${authUser 
                                ? 'pt-16 pb-20 lg:pb-0 px-4 sm:px-6 lg:px-8 gap-6 justify-center' 
                                : 'justify-center items-center h-screen'}`}>
                                {authUser && <Sidebar theme={theme} setTheme={setTheme} />}
                                
                                <main className={`flex-1 min-w-0 flex flex-col overflow-hidden ${location.pathname === '/' ? 'max-w-[680px] gap-6 pt-4 min-h-screen' : location.pathname === '/chat' ? 'max-w-none pt-2 sm:pt-4 h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-4.5rem)] pb-2 lg:pb-4' : 'max-w-none gap-6 pt-4 min-h-screen'}`}>
                                    <Routes>
                                        <Route path='/' element={authUser ? <PageWrapper><HomePage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/notifications' element={authUser ? <PageWrapper><NotificationPage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/profile/:username' element={authUser ? <PageWrapper><ProfilePage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/search' element={authUser ? <PageWrapper><SearchPage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/explore' element={authUser ? <PageWrapper><ExplorePage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/chat' element={authUser ? <PageWrapper><ChatPage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/bookmarks' element={authUser ? <PageWrapper><BookmarkPage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/post/:id' element={authUser ? <PageWrapper><PostPage /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/settings' element={authUser ? <PageWrapper><SettingsPage theme={theme} setTheme={setTheme} /></PageWrapper> : <Navigate to='/login' />} />
                                        <Route path='/admin' element={(authUser?.role === 'admin' || authUser?.email === 'admin@gmail.com') ? <PageWrapper><AdminPage /></PageWrapper> : <Navigate to='/' />} />
                                    </Routes>
                                </main>
                                {authUser && location.pathname === '/' && <RightPanel />}
                            </div>
                        } />
                    </Routes>
                </Suspense>
            </AnimatePresence>
			
			<Toaster />
		</>
	);
}

export default App;
