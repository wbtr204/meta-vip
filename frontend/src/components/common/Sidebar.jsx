import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import useLogout from "../../hooks/useLogout";
import AutocompleteSearch from "./AutocompleteSearch";
import BrandLogo from "./BrandLogo";

const Sidebar = () => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const location = useLocation();
    const { logout } = useLogout();

    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

    const { data: unreadNotifData } = useQuery({
        queryKey: ["unreadNotificationsCount"],
        queryFn: async () => {
            const res = await fetch("/api/notifications/unread-count");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        enabled: !!authUser,
    });

    const { data: conversations } = useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const res = await fetch("/api/messages/conversations");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadNotifCount = unreadNotifData?.count || 0;
    const unreadChatCount = conversations?.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0) || 0;
    const viewMode = new URLSearchParams(location.search).get("view") || "all";

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/" && viewMode !== "saved";
        if (path === "/?view=saved") return location.pathname === "/" && viewMode === "saved";
        return location.pathname.startsWith(path);
    };

    if (!authUser) return null;

    const navItems = [
        { to: "/", icon: "home", label: "Trang chủ" },
        { to: "/explore", icon: "explore", label: "Khám phá" },
        { to: "/notifications", icon: "notifications", label: "Thông báo", badge: unreadNotifCount },
        { to: "/?view=saved", icon: "bookmark", label: "Đã lưu" },
        { to: "/chat", icon: "mail", label: "Tin nhắn", badge: unreadChatCount },
        ...((authUser.role === "admin" || authUser.email === "admin@gmail.com")
            ? [{ to: "/admin", icon: "admin_panel_settings", label: "Quản trị" }]
            : []),
    ];
    const mobileNavItems = [
        ...navItems,
        { to: `/profile/${authUser.username}`, icon: "person", label: "Hồ sơ" },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-slate-950 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
                <div className="grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-6 px-6 py-3 w-full max-w-screen-2xl mx-auto h-16">
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link to="/" className="flex items-center gap-2.5 shrink-0">
                            <BrandLogo size="sm" />
                        </Link>
                    </div>
                    <div className="hidden md:flex w-full justify-center">
                        <div className="w-full max-w-[400px]">
                            <AutocompleteSearch />
                        </div>
                    </div>
                    <nav className="flex items-center gap-4" ref={userMenuRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className={`flex items-center gap-2 p-1 rounded-full transition-all duration-300 ${
                                    isUserMenuOpen ? "bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                            >
                                <img
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                                    src={authUser.profileImg || "/avatar-placeholder.png"}
                                    alt="Profile"
                                />
                                <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`}>
                                    expand_more
                                </span>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[60] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Link
                                        to={`/profile/${authUser.username}`}
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                        Hồ sơ của bạn
                                    </Link>
                                    <Link
                                        to="/settings"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">settings</span>
                                        Cài đặt
                                    </Link>
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                                    <button
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">logout</span>
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            <aside className="hidden lg:flex flex-col w-60 h-[calc(100vh-5rem)] sticky top-20 p-0 gap-5">
                <nav className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-2 flex flex-col overflow-hidden">
                    <Link to={`/profile/${authUser.username}`} className="flex items-center gap-3 p-3 mb-1 group rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <img
                            className="w-10 h-10 rounded-full object-cover transition-transform group-hover:scale-[1.02] border border-slate-200 dark:border-slate-700"
                            src={authUser.profileImg || "/avatar-placeholder.png"}
                            alt="Profile"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate transition-colors">{authUser.fullName}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">@{authUser.username}</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 p-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">logout</span>
                        </button>
                    </Link>

                    {navItems.map((item) => {
                        const active = isActive(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`relative flex items-center gap-3 px-4 py-3 transition-colors group rounded-xl ${
                                    active ? "text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-800/40" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                }`}
                            >
                                {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />}
                                <span
                                    className={`material-symbols-outlined transition-colors text-[20px] ${
                                        active ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                                    }`}
                                    style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    {item.icon}
                                </span>
                                <span className={`text-sm tracking-wide flex-1 ${active ? "font-bold" : ""}`}>{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md tabular-nums min-w-[18px] text-center">
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom,16px)] pt-2 bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50 z-50">
                {mobileNavItems
                    .filter((item) => ["/", "/explore", "/notifications", "/?view=saved", "/chat"].includes(item.to) || item.to === `/profile/${authUser.username}`)
                    .map((item) => {
                        const active = isActive(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors relative ${active ? "text-indigo-500" : "text-slate-400"}`}
                            >
                                <span className="material-symbols-outlined mb-0.5" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                    {item.icon}
                                </span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums ring-2 ring-white dark:ring-slate-950">
                                        {item.badge > 9 ? "9+" : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
            </nav>

            <Link
                to="/"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-indigo-500 rounded-full shadow-lg flex items-center justify-center text-white z-40 active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-2xl">edit</span>
            </Link>
        </>
    );
};

export default Sidebar;
