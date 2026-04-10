import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "react-hot-toast";
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

        const handleGlobalSync = (data) => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });

            // Premium Toast Notification
            if (data && data.from) {
                let message = "";
                
                if (data.type) {
                    const name = data.from.fullName;
                    switch (data.type) {
                        case "like": message = `❤️ ${name} đã thích bài viết của bạn.`; break;
                        case "comment": message = `💬 ${name} đã bình luận bài viết của bạn.`; break;
                        case "like_comment": message = `💖 ${name} đã thích bình luận của bạn.`; break;
                        case "reply": message = `📩 ${name} đã trả lời bình luận của bạn.`; break;
                        case "follow": message = `👤 ${name} đã bắt đầu theo dõi bạn.`; break;
                        case "follow_request": message = `🔔 ${name} muốn theo dõi bạn.`; break;
                        case "follow_accept": message = `✅ ${name} đã chấp nhận yêu cầu của bạn.`; break;
                    }
                }

                if (message) {
                    toast(message, {
                        icon: '🔔',
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            borderRadius: '20px',
                            background: '#1e293b',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '12px 20px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        },
                    });
                }
            }
        };

        socket.on("newMessage", (msg) => handleGlobalSync(msg));
        socket.on("newNotification", (notif) => handleGlobalSync(notif));

        return () => {
            socket.off("newMessage");
            socket.off("newNotification");
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
                            <div className={`${authUser ? 'max-w-[1320px] mx-auto w-full' : 'max-w-none w-full'} flex flex-col lg:flex-row ${authUser 
                                ? `pt-16 pb-[88px] lg:pb-0 px-0 sm:px-6 lg:px-8 gap-0 sm:gap-6 justify-center ${location.pathname === '/chat' ? 'h-dvh overflow-hidden lg:h-auto lg:overflow-visible' : 'min-h-screen'}` 
                                : 'justify-center items-center h-screen'}`}>
                                {authUser && <Sidebar theme={theme} setTheme={setTheme} />}
                                
                                <main className={`flex-1 min-w-0 flex flex-col overflow-hidden ${location.pathname === '/' ? 'max-w-[680px] gap-6 pt-4 min-h-screen' : location.pathname === '/chat' ? 'max-w-none h-full lg:h-[calc(100vh-4.5rem)]' : 'max-w-none gap-6 pt-4 min-h-screen'}`}>
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
