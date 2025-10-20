Kiến trúc Real-time: Cập nhật và Phát hiện Mẫu hình Nến
Tài liệu này mô tả chi tiết kiến trúc và luồng hoạt động để cập nhật và hiển thị dữ liệu giá cổ phiếu gần-thời-gian-thực (near real-time) từ vnstock, đồng thời tích hợp khả năng quét và phát hiện các mẫu hình nến do người dùng lựa chọn.

🎯 Mục tiêu
Cập nhật tự động: Lấy dữ liệu giá cổ phiếu trong ngày (intraday) mới nhất sau mỗi vài giây.

Tương tác người dùng: Cho phép người dùng chọn một mẫu hình nến cụ thể (ví dụ: Hammer, Bullish Engulfing) từ danh sách để theo dõi.

Phân tích Real-time: Khi có dữ liệu mới, hệ thống phải tự động phân tích xem có sự xuất hiện của mẫu hình nến đang được chọn hay không.

Thông báo tức thì: Nếu phát hiện mẫu hình, hệ thống sẽ đẩy thông báo cùng dữ liệu nến tới client.

Hiển thị trực quan: Đánh dấu (highlight) vị trí xuất hiện mẫu hình trên biểu đồ của client một cách rõ ràng.

🏛️ Sơ đồ kiến trúc & Luồng hoạt động chi tiết
Sơ đồ dưới đây mô tả luồng thông tin từ khi người dùng chọn một mẫu hình cho đến khi kết quả được hiển thị trên biểu đồ.

Code snippet

sequenceDiagram
participant ClientService as Client (Browser)
participant AlertService as Alert Service (Java)
participant DataService as Data Service (Python)

    alt Khởi tạo
        ClientService->>AlertService: 1. Mở kết nối WebSocket
        AlertService-->>ClientService: Kết nối thành công
    end

    alt Người dùng chọn mẫu hình
        ClientService->>AlertService: 2. Gửi yêu cầu theo dõi mẫu hình "Hammer" qua WebSocket
        AlertService->>AlertService: 3. Ghi nhận: "Client này đang theo dõi Hammer"
    end

    loop Luồng cập nhật (mỗi 5 giây)
        AlertService->>DataService: 4. Gọi API lấy 5 nến intraday cuối cùng
        DataService-->>AlertService: 5. Trả về dữ liệu 5 nến (dạng JSON)

        AlertService->>AlertService: 6. Phân tích dữ liệu nhận được
        Note right of AlertService: Chạy logic `getHammerCandles` trên 5 nến

        alt Kịch bản 1: Mẫu hình "Hammer" được phát hiện
            AlertService->>ClientService: 7a. Đẩy message: { candleData: {...}, detectedPattern: "Hammer" }
        end

        alt Kịch bản 2: Không phát hiện mẫu hình
            AlertService->>ClientService: 7b. Đẩy message: { candleData: {...}, detectedPattern: null }
        end
    end

    alt Hiển thị kết quả
        ClientService->>ClientService: 8. Cập nhật biểu đồ với nến mới
        ClientService->>ClientService: 9. Nếu `detectedPattern` tồn tại, đánh dấu (marker) lên biểu đồ
    end
Diễn giải luồng hoạt động chi tiết:
Bước 1: Khởi tạo kết nối

Khi người dùng truy cập trang main.html, mã JavaScript sẽ tự động thiết lập một kết nối WebSocket tới Alert Service. Kết nối này sẽ được duy trì để nhận dữ liệu đẩy từ server.

Bước 2: Người dùng chọn mẫu hình

Người dùng chọn một mẫu hình từ dropdown, ví dụ "Hammer".

Sự kiện onchange trên dropdown được kích hoạt, gọi hàm JavaScript sendWatchedPattern().

Client gửi một message qua WebSocket đến destination /app/watch-pattern với nội dung là tên của mẫu hình ("hammer").

Bước 3: Server ghi nhận yêu cầu

Trên Alert Service, RealTimePatternController nhận được message.

Controller gọi WatchedPatternService để lưu lại trạng thái: người dùng này hiện đang muốn theo dõi mẫu hình "hammer".

Bước 4 & 5: Lấy dữ liệu định kỳ

RealTimeDataService trong Alert Service có một tác vụ (@Scheduled) chạy mỗi 5 giây.

Tác vụ này gọi đến API của Data Service (Python) tại endpoint /intraday/<symbol>.

Data Service dùng vnstock để lấy 5 cây nến intraday gần nhất và trả về dưới dạng JSON.

Bước 6: Phân tích Real-time trên Server

RealTimeDataService nhận được danh sách 5 cây nến.

Nó kiểm tra xem người dùng đang muốn theo dõi mẫu hình nào (lấy từ WatchedPatternService).

Nó chuyển đổi dữ liệu JSON thô sang định dạng List<CandleStick>.

Nó gọi phương thức tương ứng trong DetectCandlePatternService (ví dụ: getHammerCandlesFromList(recentCandles)) để thực hiện phân tích ngay trên tập dữ liệu nhỏ này.

Bước 7: Gửi kết quả về Client

Dựa trên kết quả phân tích, Alert Service tạo một đối tượng RealTimeUpdateDTO.

Nếu mẫu hình được phát hiện ở cây nến cuối cùng, detectedPattern sẽ là "hammer".

Nếu không, detectedPattern sẽ là null.

Alert Service đẩy (broadcast) đối tượng DTO này qua WebSocket tới topic mà client đang lắng nghe (ví dụ: /topic/updates/VIC).

Bước 8 & 9: Hiển thị trên Client

Mã JavaScript trên main.html nhận được DTO.

Hàm updateChartWithRealtimeData() được gọi để cập nhật cây nến mới nhất lên biểu đồ bằng API candleseries.update().

Sau đó, nó kiểm tra trường detectedPattern trong DTO. Nếu trường này có giá trị, hàm addPatternMarker() sẽ được gọi để vẽ một biểu tượng (marker) và chữ "HAMMER" phía trên cây nến vừa được cập nhật, thông báo cho người dùng một cách trực quan.

🚀 Lợi ích của kiến trúc này
Hiệu quả: Client không cần phải hỏi server liên tục (polling). Server sẽ chủ động đẩy dữ liệu khi có cập nhật, giúp giảm tải mạng và tăng tốc độ phản hồi.

Tập trung logic: Toàn bộ logic phát hiện mẫu hình nến được xử lý ở backend (Alert Service), giúp client chỉ tập trung vào việc hiển thị.

Mở rộng được: Dễ dàng thêm các mẫu hình nến mới vào DetectCandlePatternService mà không cần thay đổi nhiều ở client.

Trải nghiệm người dùng tốt: Biểu đồ được cập nhật mượt mà và các cảnh báo mẫu hình xuất hiện ngay lập tức, mang lại trải nghiệm chuyên nghiệp.