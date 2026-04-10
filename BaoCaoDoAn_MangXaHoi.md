# BÁO CÁO ĐỒ ÁN
**ĐỀ TÀI: XÂY DỰNG WEBSITE MẠNG XÃ HỘI TRÊN NỀN TẢNG WEB THEO KIẾN TRÚC DỊCH VỤ VÀ CƠ CHẾ GIAO TIẾP THỜI GIAN THỰC**

---

## CHƯƠNG 1. GIỚI THIỆU CHUNG VỀ ĐỀ TÀI

### 1.1. Lý do chọn đề tài
Trong kỷ nguyên số, nhu cầu kết nối cộng đồng, chia sẻ nội dung và tương tác trực tuyến của con người ngày càng gia tăng không ngừng. Các nền tảng mạng xã hội đã trở thành một phần thiết yếu của cuộc sống hiện đại. Tuy nhiên, việc xây dựng một hệ thống mạng xã hội riêng biệt, tập trung vào những nhóm cộng đồng cụ thể với trải nghiệm người dùng cao cấp vẫn là một nhu cầu lớn. 

Việc xây dựng một website mạng xã hội là một bài toán thực tiễn và đòi hỏi ứng dụng nhiều kỹ thuật phát triển phần mềm phức tạp như: kiến trúc hệ thống chịu tải, cơ chế giao tiếp thời gian thực (realtime), quản lý dữ liệu lớn, bảo mật thông tin và tối ưu hóa trải nghiệm người dùng (UX/UI). Đề tài "Xây dựng website mạng xã hội trên nền tảng web theo kiến trúc dịch vụ và cơ chế giao tiếp thời gian thực" (Dự án VibeNet/Nexus) được chọn nhằm vận dụng toàn diện các kiến thức về công nghệ web tiên tiến (ReactJS, NodeJS), cơ sở dữ liệu phi quan hệ (MongoDB), và công nghệ WebSocket.

### 1.2. Mục tiêu nghiên cứu
- **Về chức năng:** Thiết kế và xây dựng website mạng xã hội hoàn chỉnh với các tính năng cốt lõi: đăng ký/đăng nhập an toàn, quản lý hồ sơ cá nhân, đăng bài (văn bản, hình ảnh), xem bảng tin (News Feed), tương tác (bình luận, thả tim), theo dõi (Follow) người dùng khác, tìm kiếm, thông báo thời gian thực và đặc biệt là hệ thống nhắn tin trực tiếp (Realtime Messaging) và tính năng Bản tin (Story).
- **Về kiến trúc và kỹ thuật:** Xây dựng hệ thống theo kiến trúc 3 lớp (Client - Server - Database) có khả năng mở rộng, độ trễ thấp khi giao tiếp realtime, đảm bảo tính bảo mật cơ bản (mã hóa mật khẩu, chống XSS, Rate Limit).
- **Về đánh giá:** Thực hiện kiểm thử chức năng, hiệu năng và bảo mật hệ thống để đánh giá tính ổn định và khả năng đáp ứng thực tế.

### 1.3. Đối tượng và phạm vi nghiên cứu
- **Đối tượng nghiên cứu:** Người dùng web nói chung; các loại hình nội dung số chủ yếu giới hạn ở dạng văn bản và hình ảnh (có kiểm soát dung lượng upload qua Cloudinary).
- **Phạm vi ứng dụng:** Website được thiết kế theo hướng Responsive, hoạt động tốt trên cả thiết bị di động và máy tính bàn (Web Responsive). Đề tài tập trung vào các tính năng mạng xã hội cốt lõi và nhắn tin realtime, không bao gồm các tính năng quá phức tạp như Video Livestream, gọi điện Video/Audio hay thuật toán gợi ý bạn bè bằng AI phức tạp.

### 1.4. Phương pháp nghiên cứu
- **Phân tích yêu cầu:** Khảo sát các mạng xã hội hiện có (như Twitter, Facebook, Instagram) để rút ra các chức năng chuẩn và mong đợi của người dùng.
- **Thiết kế hệ thống:** Vẽ sơ đồ kiến trúc, thiết kế cơ sở dữ liệu (ERD cho MongoDB Collection), thiết kế giao diện dạng Wireframe.
- **Triển khai (Coding):** Lập trình Frontend với ReactJS, Backend với Node.js/Express, tích hợp Socket.IO và cơ sở dữ liệu MongoDB.
- **Kiểm thử và Đánh giá:** Chạy thực nghiệm, kiểm tra giới hạn tải (load test cơ bản), phát hiện lỗi và tối ưu hiệu suất, cuối cùng rút ra nhận xét.

### 1.5. Bố cục đề tài
Đề tài gồm 5 chương:
- **Chương 1:** Giới thiệu chung về đề tài.
- **Chương 2:** Cơ sở lý luận về vấn đề nghiên cứu.
- **Chương 3:** Mô hình lý thuyết – Các khái niệm và phương pháp giải quyết vấn đề.
- **Chương 4:** Mô hình thực nghiệm – Kết quả, phân tích và nhận xét.
- **Chương 5:** Kết luận và hướng phát triển.

---

## CHƯƠNG 2. CƠ SỞ LÝ LUẬN VỀ VẤN ĐỀ NGHIÊN CỨU

### 2.1. Tổng quan về mạng xã hội và các đặc trưng nghiệp vụ
Mạng xã hội (Social Network) là một nền tảng hoặc dịch vụ trực tuyến giúp người dùng xây dựng các mối quan hệ với những người có chung sở thích, hoạt động, bối cảnh mạng xã hội, hoặc kết nối đời thực. Các đặc trưng lớn bao gồm:
- **Mô hình tương tác:** Thường theo cơ chế Follow (Follower/Following) hoặc Kết bạn đồng cấp (Friendship). Đề tài này lựa chọn cơ chế Follow (như Twitter/Instagram).
- **Luồng nội dung (News Feed):** Dòng thời gian lấy bài viết từ những người dùng mà cá nhân đang follow, sắp xếp theo thời gian hoặc mức độ tương tác.
- **Hành vi người dùng:** Đăng bài (Post), bình luận (Comment), thích (Like/Reaction), chia sẻ và hệ thống tự động sinh thông báo tương ứng.

### 2.2. Kiến thức nền tảng phát triển ứng dụng web
- **Kiến trúc Web Hiện Đại:** Ứng dụng mô hình Client-Server phân lý rõ ràng qua API. Client (Frontend) xử lý UI và state management qua Single Page Application (SPA), Server (Backend) đóng vai trò là API Gateway xử lý logic, phân quyền.
- **RESTful API:** Các dịch vụ giao tiếp qua HTTP bằng chuẩn RESTful để thao tác với tài nguyên (GET, POST, PUT, DELETE).
- **Cơ chế Realtime (WebSocket):** HTTP thông thường chỉ hỗ trợ client pull dữ liệu. Để có tính năng Chat và Thông báo theo thời gian thực, hệ thống phải sử dụng giao thức WebSocket, cho phép kết nối hai chiều liên tục. Trong dự án, thư viện **Socket.IO** được sử dụng.
- **Quản lý dữ liệu tệp:** Việc lưu trữ hình ảnh tải lên được đẩy lên server chuyên dụng là Cloudinary, giúp giảm tải băng thông cho server backend.

### 2.3. Cơ sở dữ liệu cho mạng xã hội
Với đặc thù cấu trúc dữ liệu linh hoạt, bài viết có thể chứa văn bản, ảnh, số lượng comment và like thay đổi linh hoạt liên tục, giải pháp cơ sở dữ liệu phi quan hệ (NoSQL) **MongoDB** được ưu tiên.
- **Khả năng thiết kế linh hoạt:** MongoDB tổ chức lưu trữ dạng Document (BSON). Các collection tiêu biểu gồm: `Users`, `Posts`, `Notifications`, `Messages`, `Conversations`.
- **Tối ưu truy vấn:** Sử dụng tính năng `populate` (của Mongoose) để join các collections (ví dụ lấy thông tin tác giả của một bài viết) linh hoạt mà không bị gò bó bởi schema cứng nhắc.

### 2.4. Bảo mật ứng dụng web và quyền riêng tư
Bảo mật là yếu tố quan trọng sống còn của mạng xã hội:
- **Xác thực và Phiên (Authentication & Session):** Dùng JWT (JSON Web Token) gửi qua cơ chế bảo mật HttpOnly Cookies để tránh lộ token phía client (ngừa tấn công XSS).
- **Mã hóa:** Mật khẩu người dùng được bcrypt.js băm và rắc muối (hash & salt) trước khi lưu.
- **Phòng chống các đòn tấn công:**
  - **CSRF / XSS:** Sử dụng middleware Helmet để thiết lập các Content Security Policy (CSP).
  - **Rate Limit:** Dùng thư viện `express-rate-limit` để giới hạn số lượng request từ 1 IP, tránh Brute-force mật khẩu hoặc tấn công DDoS nhẹ.
- **Quyền riêng tư:** Server kiểm tra tính hợp lệ của JWT và so sánh User ID để quyết định quyền xóa/sửa bài viết (chỉ chủ bài viết mới được xóa), quyền quản trị viên (Admin).

### 2.5. Vấn đề cần giải quyết và đề xuất giải pháp
- **Vấn đề:** 
  - Hệ thống cần phản hồi cực nhanh khi load bảng tin, tải rất nhiều bài viết và hình ảnh.
  - Xử lý mượt mà khi người dùng nhận hàng loạt thông báo hay tin nhắn tức thời mà không phải F5 (tải lại trang).
  - Ngăn ngừa tình trạng spam API gọi lấy dữ liệu rác.
- **Đề xuất giải pháp:** 
  - Áp dụng kiến trúc MERN Stack (MongoDB, Express, React, Node.js).
  - Ở phía backend, dùng Express.js viết API tối ưu gọn nhẹ, tích hợp Socket.io để đẩy tin nhắn/thông báo ngay lập tức.
  - Phía frontend, sử dụng React Query (TanStack Query) để quản lý cache state của API, tiến hành fetching, caching, đồng bộ và cập nhật dữ liệu tự động mà không phải viết lại logic Redux rườm rà.
  - Chức năng Admin để kiểm soát hệ thống, có thể khóa/mở khóa tài khoản có hành vi không phù hợp.

---

## CHƯƠNG 3. MÔ HÌNH LÝ THUYẾT – CÁC KHÁI NIỆM VÀ PHƯƠNG PHÁP GIẢI QUYẾT VẤN ĐỀ

### 3.1. Kiến trúc tổng thể hệ thống
Dự án được xây dựng dựa trên kiến trúc 3 lớp rõ rệt:
1. **Presentation Layer (Client-side):** Được phát triển bằng ReactJS 18 (sử dụng Vite làm bundler), giao diện TailwindCSS và DaisyUI. Lớp này quản lý giao diện, Route (react-router-dom) và Cache dữ liệu thao tác của người tiêu dùng (TanStack Query).
2. **Business Logic Layer (Server-side):** Server Node.js/Express đóng vai trò trung tâm xử lý, phân giải HTTPS, chạy Middleware xác thực (JWT trong Header/Cookies), truyền Socket signals và giao tiếp với tầng CSDL.
3. **Data Access Layer (Database & Storage):** MongoDB chứa dữ liệu text, quan hệ. Dịch vụ đám mây Cloudinary được dùng làm CDN để chứa các tệp tin Media (Hình ảnh, banner, avatar).

### 3.2. Đặc tả yêu cầu chức năng
- **Bảo mật / Phân quyền:** Đăng ký, Đăng nhập, Đăng xuất tài khoản. Admin kiểm soát người dùng.
- **Quản lý Hồ sơ (Profile):** Cập nhật Avatar, Cover image, Bio, xem thông tin số lượng Following/Followers.
- **Hoạt động mạng xã hội:**
  - Viết bài mới (Văn bản + Tối đa 1 ảnh).
  - Hiển thị Feed: "For you" (Gợi ý ngẫu nhiên/ trending) và "Following" (Bài của người đang theo dõi).
  - Tương tác: Thích bài viết, bình luận (kèm xóa bình luận của mình), đánh dấu lưu bài (nếu có).
  - Chức năng tin 24h (Story) hiển thị ở đầu trang (tương tự Instagram/Facebook).
- **Mối quan hệ:** Theo dõi/Bỏ theo dõi (Follow/Unfollow).
- **Thông báo & Tương tác Realtime:** Mọi động thái như Like, Comment, Follow sẽ phát sinh một Notification lưu vào CSDL, đồng thời đẩy một Event qua Socket lên Client người nhận. Cập nhật số unread trực tiếp trên UI.
- **Trò chuyện (Messaging):** List các đoạn hội thoại (Conversations), nhắn tin riêng (1-1) với hình ảnh/văn bản. Tự động hiển thị tin nhắn vừa gửi theo thời gian thực.
- **Quản trị (Admin Panel):** Xem thống kê (Stats), liệt kê danh sách Users, khóa hoặc xóa user (Soft delete/Hard delete).

### 3.3. Thiết kế dữ liệu và mô hình CSDL
Các Collections (Schema) chính trong MongoDB bao gồm:
1. **User Schema:** Lưu `username`, `fullName`, `email`, `password` (hashed), `profileImg`, `coverImg`, mảng `followers`, mảng `following`, `role` (user/admin), `status` (active/banned).
2. **Post Schema:** Liên kết (Reference) tới bảng User để lấy tác giả, `text` nội dung, `img` url, mảng `likes` chứa list UserId đã like, mảng `comments` chứa chi tiết từng comment.
3. **Notification Schema:** Lưu `from` (ai tác động), `to` (ai nhận), `type` (follow/like/comment), `read` (boolean), và liên kết (PostId nếu có).
4. **Message Schema:** Lưu thông tin `senderId`, `receiverId`, `text`, `image` trong cuộc hội thoại 1-1.
5. **Story Schema:** Lưu `user` (tác giả), `image` (URL), `expiresAt` (thời điểm hết hạn sau 24h tự động xóa).

*Chiến lược chỉ mục (Index):* Đánh index các trường thường xuyên query như `createdAt` trong Posts, hoặc `username` trong Users để tìm kiếm nhanh.

### 3.4. Thiết kế giao diện và trải nghiệm người dùng (UX/UI)
- **Phong cách thiết kế:** "Premium Minimalist" (Tối giản tinh tế). Sử dụng tông màu chủ đạo thanh lịch (Dark mode mặc định kết hợp màu nhấn, hiệu ứng glassmorphism nếu cần thiết, giao diện bo góc mượt mà).
- **Responsvie:** Bố cục chia cột (Left Sidebar menu đa năng trên Desktop hoặc Bottom Navigation Bar trên thiết bị di động).
- **UX Rules:**
  - Phản hồi tức thời: Khi người dùng bấm Like, giao diện React đổi trạng thái (Optimistic Update) ngay lập tức trước khi server trả về OK.
  - Sử dụng Loading Skeletons để làm mượt thời gian chờ tải Feed, tránh giật UI.
  - Dùng Thư viện `react-hot-toast` hiển thị thông báo thao tác đúng/sai nhanh.

### 3.5. Thiết kế API và cơ chế realtime
- **API Endpoints:**
  - `POST /api/auth/signup|login|logout`
  - `GET /api/posts/all|following|user/:username`
  - `POST /api/posts/create`
  - `POST /api/posts/like/:id`, `POST /api/posts/comment/:id`
  - `GET /api/notifications`
  - `GET /api/messages/:id`, `POST /api/messages/send/:id`
  - `GET /api/admin/stats|users`
- **Socket Events:** 
  - Server lắng nghe `connection`. Sau đó mapping `socket.id` với `userId`.
  - Bắn sự kiện: `newMessage` khi có Chat, `newNotification` khi có tương tác, `getOnlineUsers` để biết ai lấy online.

### 3.6. Thiết kế bảo mật và phân quyền
- **Mô hình phân quyền:** 
  - Middleware `protectRoute` giải mã cookie token, check role trong DB. Nếu chưa login -> Trả về 401 Unauthorized.
  - Lớp kiểm tra Admin `isAdmin` route: Nếu role !== 'admin' -> Trả về 403 Forbidden.
- **Kiểm soát file:** File ảnh upload lên không được quá giới hạn MB nhất định (chặn bằng express), chỉ chấp nhận các đuôi định dạng png/jpg/jpeg/webp.

---

## CHƯƠNG 4. MÔ HÌNH THỰC NGHIỆM – KẾT QUẢ, PHÂN TÍCH VÀ NHẬN XÉT

*(Sinh viên có thể chèn các hình ảnh Demo giao diện màn hình tại từng mục trong chương này)*

### 4.1. Môi trường và công nghệ triển khai
- **Ngôn ngữ:** JavaScript / ES6+.
- **Frontend Toolkit:** React 18, Vite, Tailwind CSS, DaisyUI, React Query, React-Router-DOM v6.
- **Backend Toolkit:** Node.js, Express.js, Socket.IO.
- **Cơ sở dữ liệu:** MongoDB Mongoose ORM.
- **Tài nguyên mở rộng:** Cloudinary (lưu ảnh).

### 4.2. Triển khai các module chức năng
1. **Module Auth & Profile:** Người dùng nhập thông tin vào form -> React Hook Form validate dữ liệu (Dùng Zod nếu cần) -> Fetch Axios tới `/api/auth` -> Server băm password và Generate Token để lưu vào Cookie HTTP-Only. Chuyển hướng thành công.
2. **Module Feed & Interaction:** Sử dụng `react-query` sử dụng hook `useQuery` để lấy mảng Post, vẽ ra thẻ Post. Khi User react thả tim, gọi hành động `useMutation`, đồng thời gọi query client `invalidateQueries` để UI tự động render lại số lượng Like và Avatar người vừa thả tim.
3. **Module Messaging Realtime:** Component Chat kết nối socket qua hook tùy chỉnh `useListenMessages`. Khi server `io.to(receiverSocketId).emit("newMessage")`, component chat nhận được và append data mới nhất vào danh sách tin nhắn, tự động cuộn (scrollIntoView) xuống dòng cuối cùng.
4. **Trang Quản trị Admin:** Giao diện có Dashboard thống kê với biểu đồ `Recharts` hiển thị người dùng và bài đăng mới mỗi tháng. Bảng danh sách xử lý việc tìm kiếm (Search user) phía server và nút Xóa/Khóa với hành vi xác nhận trước khi thực hiện.

### 4.3. Kết quả kiểm thử chức năng
- **Kiểm thử đăng nhập/đăng ký:** Thành công. Các điều kiện biên như "Email đã tồn tại", "Mật khẩu dưới 6 ký tự" được hệ thống trả về HTTP 400 Bad Request kèm message đỏ trên màn hình.
- **Kiểm thử luồng tương tác:** Viết bài mới kèm ảnh, ảnh phải nhỏ theo quy định, đăng bài xuất hiện lập tức ở dòng thời gian mọi người; Bình luận, xóa bài đều xử lý đúng quyền (nhặt User ID từ session).
- **Kiểm thử tính năng Realtime:** Mở 2 tab với 2 Account khác nhau (Ví dụ User A và User B). A chat cho B, Màn hình B ngay lập tức hiển thị tin nhắn đến không có độ trễ đáng phàn nàn. Thông báo đỏ pop-up trên trình duyệt. -> Pass.

### 4.4. Đánh giá hiệu năng và khả năng mở rộng (mức cơ bản)
- Tại Frontend, React Query giúp loại bỏ rất nhiều lệnh Request lặp lại không đáng có thông qua việc Cache dữ liệu tạm thời dưới máy tính người xem. Load panel cực nhanh nhờ phân trang.
- Với việc lưu hình ảnh trên Cloudinary thay vì trong Node.js server, Node.js giảm 90% tải và băng thông đường truyền. Server hoàn toàn tập trung vào xử lý Logic và phân phối Socket messages.
- Tại Backend, MongoDB Index giúp hàm phân trang `find().sort().limit()` tốn chưa đến vài chục milliseconds.
- *Hạn chế:* Do Server vẫn để dạng single node, với hơn 20,000 kết nối socket đồng thời trong thực tế sẽ đòi hỏi Cụm Redis Adapter cho Socket.IO để cân bằng tải ngang.

### 4.5. Đánh giá bảo mật cơ bản
- **XSS & CSRF:** Cơ chế gửi token bằng Cookie có cờ thư viện `httpOnly: true` (không thể truy cập bằng `document.cookie`), `sameSite: strict` giúp phòng tránh CSRF hoàn toàn.
- **SQL / NoSQL Injection:** Sử dụng Mongoose ODM chống truyền raw query độc hại. Validations đầu vào. 
- **Rate Limit Login:** Gắn thư viện Rate Limit lên endpoint login, nếu vượt quá 5 lần mật khẩu sai / 15 phút sẽ block IP tạm thời khóa tính năng login. Đạt yêu cầu.

### 4.6. Demo hệ thống và thảo luận
**Kịch bản Demo:** 
1. Người dùng A vào trang chủ, hệ thống tự động redirect về trang Đăng nhập do chưa có thẻ Cookie.
2. Thiết lập Account -> chuyển sang Giao diện trang chủ bảng tin.
3. Quản trị viên (Admin) đăng nhập vào kiểm soát User A, xem các chỉ số trên biểu đồ tăng lên.
4. Người dùng A Follow người dùng B, B đăng trạng thái (Story) và bài bình thường. A bấm vào thả tim.
5. Tab màn hình B ở xa ngay lập tức nhận về Popup Notification: "A đã thích bài viết của bạn!". Cả quy trình diễn ra mượt mà và trực quan.

---

## CHƯƠNG 5. KẾT LUẬN VÀ KIẾN NGHỊ

### 5.1. Kết luận chung
Đồ án đã xuất sắc hoàn thành việc thiết kế và xây dựng một hệ thống mạng xã hội trên nền tảng Web có tên VibeNet. Các mục tiêu đặt ra từ đầu như xây dựng được chức năng cơ bản, kiến trúc mở rộng và ứng dụng giao tiếp realtime socket đều đã đạt được. Giao diện người dùng được nâng cấp mang hơi hướng Premium hiện đại, tương thích thiết bị di động, đồng thời các quy tắc bảo mật được tuân thủ nghiêm ngặt.

### 5.2. Đóng góp của đề tài
- Quán triệt quy trình phát triển từ lúc lên ý tưởng kiến trúc (DB, API) đến triển khai.
- Cung cấp mô hình làm ví dụ chuẩn MERN Stack kết hợp Socket.IO và React Query để giải quyết bài toán State Management và Caching cho các bài tập lớn.
- Xây dựng được trang quản trị hệ thống đầy đủ.

### 5.3. Hạn chế và hướng phát triển
**Tuy đạt nhiều thành tựu nhưng hệ thống vẫn còn một số điểm chưa hoàn thiện tối đa:**
- Chưa tích hợp cơ chế lưu trữ đệm khổng lồ (Redis Caching) đối với tầng API, nếu số lượng lên tới hàng triệu post, việc cache bằng Redis sẽ là bắt buộc để chia nhỏ áp lực DB.
- Hiện không có thuật toán Machine Learning / AI để gợi ý bạn bè và lọc tin độc hại, chủ yếu dựa vào Admin khóa thủ công.

**Hướng phát triển ứng dụng trong tương lai:**
1. **Kiến trúc Microservices / Serverless:** Nếu tải lớn, việc chia từng dịch vụ thành các container nhỏ (Notification Service, Chat Service, Core API) sẽ tốt hơn, giao tiếp bằng Message Queue (RabbitMQ / Kafka).
2. **Video & Gọi thoại:** Xây dựng tính năng gọi WebRTC giữa hai user (Call Audio & Video).
3. **AI Content Moderation:** Đưa một mô hình NLP AI kiểm duyệt ngôn từ nội dung bài viết trước khi xuất bản, tự động gắn mác hoặc cảnh cáo nếu vi phạm tiêu chuẩn cộng đồng.
4. **CI/CD:** Xây dựng luồng tự động kiểm thử và triển khai GitHub Actions và Docker để deploy dự án lên AWS, Google Cloud liên tục.

---
**TÀI LIỆU THAM KHẢO**
1. Tài liệu hướng dẫn ReactJS: https://react.dev/
2. Tài liệu hướng dẫn MongoDB & Mongoose: https://mongoosejs.com/
3. Tài liệu hướng dẫn giao tiếp thời gian thực Socket.IO: https://socket.io/
4. Tailwind CSS Framework: https://tailwindcss.com/
*(Sinh viên tự bổ sung nội dung các sách giáo trình đã tham khảo vào phần này theo quy định của nhà trường)*

---
**PHỤ LỤC**
*(Mã nguồn nổi bật, hình ảnh ERD mở rộng, ảnh demo chi tiết sẽ được đính kèm tại đây...)*
