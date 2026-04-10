const fs = require('fs');
const file = 'frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldFunc = `        const handleGlobalSync = () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        };

        socket.on("newMessage", handleGlobalSync);
        socket.on("newNotification", handleGlobalSync);

        return () => {
            socket.off("newMessage", handleGlobalSync);
            socket.off("newNotification", handleGlobalSync);
        };`;

// Using a more flexible regex to find the block
const regex = /const handleGlobalSync = \(\) => {[\s\S]*?};[\s\S]*?socket\.on\("newMessage", handleGlobalSync\);[\s\S]*?socket\.on\("newNotification", handleGlobalSync\);[\s\S]*?return \(\) => {[\s\S]*?socket\.off\("newMessage", handleGlobalSync\);[\s\S]*?socket\.off\("newNotification", handleGlobalSync\);[\s\S]*?};/;

const newContent = `const handleGlobalSync = (data) => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });

            // Premium Toast Notification
            if (data && data.from) {
                const isMessage = !!data.text && !data.type;
                let message = "";
                
                if (isMessage) {
                    message = \`💬 \${data.from.fullName} đã gửi tin nhắn cho bạn.\`;
                } else if (data.type) {
                    const name = data.from.fullName;
                    switch (data.type) {
                        case "like": message = \`❤️ \${name} đã thích bài viết của bạn.\`; break;
                        case "comment": message = \`💬 \${name} đã bình luận bài viết của bạn.\`; break;
                        case "like_comment": message = \`💖 \${name} đã thích bình luận của bạn.\`; break;
                        case "reply": message = \`📩 \${name} đã trả lời bình luận của bạn.\`; break;
                        case "follow": message = \`👤 \${name} đã bắt đầu theo dõi bạn.\`; break;
                        case "follow_accept": message = \`✅ \${name} đã chấp nhận yêu cầu của bạn.\`; break;
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
        };`;

if (content.match(regex)) {
    content = content.replace(regex, newContent);
    fs.writeFileSync(file, content);
    console.log("Updated App.jsx successfully");
} else {
    // Fallback search
    console.log("Could not find the block in App.jsx. Checking string inclusion...");
    if (content.indexOf('const handleGlobalSync = () => {') !== -1) {
         // Alternative approach...
    }
}
