// Pattern Definitions - Candlestick and Chart Patterns
// This file contains comprehensive definitions for all patterns used in the chart

export const PATTERN_DEFINITIONS = {
  // ===== SINGLE CANDLE PATTERNS =====
  'hammer': 'Nến Búa (Hammer) – Mô hình đảo chiều tăng, thường xuất hiện ở cuối xu hướng giảm. Thân nến nhỏ nằm gần đỉnh biên độ, bóng dưới dài (thường ≥ 2 lần thân), bóng trên rất nhỏ hoặc không có. Tâm lý: bên bán ép giá xuống sâu nhưng bị bên mua kéo lên mạnh về cuối phiên → gợi ý lực bán suy yếu và khả năng đảo chiều tăng (nên chờ nến xác nhận).',

  'inverted_hammer': 'Nến Búa Ngược (Inverted Hammer) – Mô hình đảo chiều tăng tiềm năng ở cuối xu hướng giảm. Thân nến nhỏ, bóng trên dài, bóng dưới rất ngắn/không có. Tâm lý: bên mua đã thử đẩy giá lên cao trong phiên nhưng chưa giữ được hoàn toàn; nếu phiên sau tiếp tục tăng/đóng cửa cao hơn thì tín hiệu đáng tin hơn.',

  'hanging_man': 'Nến Người Treo Cổ (Hanging Man) – Mô hình đảo chiều giảm, thường xuất hiện sau một nhịp tăng. Hình dạng giống Hammer (thân nhỏ ở phía trên, bóng dưới dài) nhưng bối cảnh ở “đỉnh”. Tâm lý: dù đóng cửa vẫn còn cao, việc bị kéo xuống sâu trong phiên cho thấy lực bán/ chốt lời đã xuất hiện; cần nến giảm xác nhận để củng cố tín hiệu.',

  'shooting_star': 'Nến Sao Băng (Shooting Star) – Mô hình đảo chiều giảm ở cuối xu hướng tăng. Thân nhỏ nằm gần đáy biên độ, bóng trên dài (thường ≥ 2 lần thân), bóng dưới rất nhỏ/không có. Tâm lý: bên mua đẩy giá lên cao nhưng bị bán mạnh kéo về gần mức mở/đóng thấp → dấu hiệu “từ chối” vùng giá cao.',

  'long_legged_doji': 'Doji Chân Dài (Long-Legged Doji) – Mô hình trung tính thể hiện do dự/giằng co mạnh. Giá mở ≈ giá đóng (thân rất nhỏ), bóng trên và dưới dài. Tâm lý: biến động nội phiên lớn nhưng kết phiên không bên nào thắng thế rõ ràng; ý nghĩa đảo chiều hay tiếp diễn phụ thuộc xu hướng trước đó và nến xác nhận.',

  'gravestone_doji': 'Doji Bia Mộ (Gravestone Doji) – Thường được xem là tín hiệu đảo chiều giảm (đặc biệt khi xuất hiện gần kháng cự/đỉnh). Giá mở–đóng–thấp gần nhau (gần đáy), bóng trên dài. Tâm lý: bên mua từng đẩy giá lên cao nhưng bị bán mạnh “đè” về cuối phiên.',

  'dragonfly_doji': 'Doji Chuồn Chuồn (Dragonfly Doji) – Thường được xem là tín hiệu đảo chiều tăng (đặc biệt gần hỗ trợ/đáy). Giá mở–đóng–cao gần nhau (gần đỉnh), bóng dưới dài. Tâm lý: bên bán ép giá xuống mạnh nhưng bên mua kéo lại gần như hoàn toàn trước khi kết phiên.',

  'bearish_marubozu': 'Marubozu Giảm – Nến giảm mạnh gần như không có bóng (hoặc rất ngắn). Mở gần đỉnh và đóng gần đáy. Tâm lý: phe bán kiểm soát gần như toàn bộ phiên → động lượng giảm mạnh, thường dùng để xác nhận xu hướng giảm/pha breakdown.',

  'bullish_marubozu': 'Marubozu Tăng – Nến tăng mạnh gần như không có bóng (hoặc rất ngắn). Mở gần đáy và đóng gần đỉnh. Tâm lý: phe mua kiểm soát gần như toàn bộ phiên → động lượng tăng mạnh, thường dùng để xác nhận xu hướng tăng/pha breakout.',

  'bearish_belt_hold': 'Belt Hold Giảm – Mô hình 1 nến đảo chiều giảm (thường sau xu hướng tăng). Thường mở gần mức cao (ít/không bóng trên) và giảm mạnh tạo thân dài, đóng gần mức thấp. Tâm lý: áp lực bán xuất hiện ngay từ đầu phiên và duy trì đến cuối phiên.',

  'bullish_belt_hold': 'Belt Hold Tăng – Mô hình 1 nến đảo chiều tăng (thường sau xu hướng giảm). Thường mở gần mức thấp (ít/không bóng dưới) và tăng mạnh tạo thân dài, đóng gần mức cao. Tâm lý: lực mua vào áp đảo ngay từ đầu phiên.',

  // ===== TWO CANDLE PATTERNS =====
  'bullish_engulfing': 'Nhấn Chìm Tăng (Bullish Engulfing) – Mô hình 2 nến đảo chiều tăng, xuất hiện cuối xu hướng giảm. Nến thứ 2 là nến tăng có thân “nuốt trọn” thân nến giảm trước đó. Tâm lý: lực mua đảo chiều mạnh, hấp thụ toàn bộ lực bán của phiên trước; hiệu quả tốt hơn gần hỗ trợ và có xác nhận.',

  'bearish_engulfing': 'Nhấn Chìm Giảm (Bearish Engulfing) – Mô hình 2 nến đảo chiều giảm, xuất hiện cuối xu hướng tăng. Nến thứ 2 là nến giảm có thân “nuốt trọn” thân nến tăng trước đó. Tâm lý: lực bán áp đảo, đảo chiều tâm lý từ hưng phấn sang chốt lời/bán mạnh.',

  'piercing_line': 'Xuyên Thấu (Piercing Line) – Mô hình 2 nến đảo chiều tăng. Nến 1 giảm dài; nến 2 mở thấp (thường tạo “gap” trên thị trường có gap) rồi hồi mạnh và đóng trên điểm giữa thân nến 1. Tâm lý: phe mua giành lại một phần lớn của nhịp giảm, báo hiệu khả năng đảo chiều.',

  'dark_cloud_cover': 'Mây Đen Che Phủ (Dark Cloud Cover) – Mô hình 2 nến đảo chiều giảm. Nến 1 tăng; nến 2 mở cao (trên đóng cửa/đỉnh nến 1 tùy thị trường) rồi giảm và đóng dưới điểm giữa thân nến 1. Tâm lý: lực bán “phủ” lên đà tăng, gợi ý suy yếu và đảo chiều.',

  'harami': 'Harami (Nến Mang Thai) – Mô hình 2 nến: thân nến thứ 2 nằm hoàn toàn bên trong thân nến thứ 1. Có thể là đảo chiều tăng hoặc giảm tuỳ bối cảnh (xu hướng trước đó). Ý nghĩa cốt lõi: biến động co lại, đà trước đó chững lại → cần nến xác nhận để kết luận đảo chiều.',

  'bearish_harami_cross': 'Harami Cross Giảm – Sau một nến tăng lớn là một Doji (mở≈đóng) nằm trong thân nến trước. Doji thể hiện do dự sau đà tăng; nếu sau đó có nến giảm xác nhận thì khả năng đảo chiều giảm cao hơn.',

  'bullish_harami_cross': 'Harami Cross Tăng – Sau một nến giảm lớn là một Doji nằm trong thân nến trước. Doji thể hiện do dự sau đà giảm; nếu sau đó có nến tăng xác nhận thì khả năng đảo chiều tăng cao hơn.',

  'tweezer_bottom': 'Nhíp Đáy (Tweezer Bottom) – Mô hình đảo chiều tăng gồm 2+ nến có đáy gần như bằng nhau trong xu hướng giảm. “Đáy đôi ngắn hạn” cho thấy hỗ trợ mạnh, phe bán không đẩy thấp hơn được → dễ bật tăng nếu có xác nhận.',

  'tweezer_top': 'Nhíp Đỉnh (Tweezer Top) – Mô hình đảo chiều giảm gồm 2+ nến có đỉnh gần như bằng nhau trong xu hướng tăng. Cho thấy kháng cự mạnh, phe mua không vượt cao hơn được → dễ quay đầu nếu có xác nhận.',

  'bearish_kicker': 'Kicker Giảm – Mô hình đảo chiều giảm mạnh. Thường là một nến tăng, sau đó xuất hiện nến giảm mở “gap” xuống (hoặc mở thấp đáng kể) và tiếp tục giảm mạnh. Tâm lý: chuyển trạng thái đột ngột từ lạc quan sang bi quan.',

  'bullish_kicker': 'Kicker Tăng – Mô hình đảo chiều tăng mạnh. Thường là một nến giảm, sau đó xuất hiện nến tăng mở “gap” lên (hoặc mở cao đáng kể) và tăng mạnh. Tâm lý: đảo chiều đột ngột sang trạng thái hưng phấn mua vào.',

  'matching_low': 'Đóng Cửa Trùng Đáy (Matching Low) – Hai nến giảm liên tiếp có giá đóng cửa xấp xỉ nhau trong xu hướng giảm. Gợi ý có vùng hỗ trợ ngắn hạn; phe bán gặp khó khi muốn đóng cửa thấp hơn → có thể sớm hồi/đảo chiều nếu có tín hiệu bổ sung.',

  'matching_high': 'Đóng Cửa Trùng Đỉnh (Matching High) – Hai nến tăng liên tiếp có giá đóng cửa xấp xỉ nhau trong xu hướng tăng. Gợi ý có vùng kháng cự ngắn hạn; phe mua gặp khó khi muốn đóng cửa cao hơn → có thể sớm điều chỉnh/đảo chiều nếu có tín hiệu bổ sung.',

  'bearish_counterattack': 'Phản Công Giảm (Bearish Counterattack) – Mô hình 2 nến thiên về tiếp diễn/giằng co: nến 1 tăng, nến 2 giảm mở cao nhưng đóng gần mức đóng của nến 1. Tâm lý: phe bán phản công mạnh trong phiên nhưng chưa tạo phá vỡ rõ ràng; cần bối cảnh xu hướng và xác nhận.',

  'bullish_counterattack': 'Phản Công Tăng (Bullish Counterattack) – Nến 1 giảm, nến 2 tăng mở thấp nhưng đóng gần mức đóng của nến 1. Tâm lý: phe mua phản công trong phiên nhưng chưa “lật kèo” dứt khoát; cần xác nhận và bối cảnh.',

  // ===== THREE CANDLE PATTERNS =====
  'three_white_soldiers': 'Ba Chàng Lính Trắng (Three White Soldiers) – Mô hình đảo chiều tăng mạnh gồm 3 nến tăng dài liên tiếp, mỗi nến đóng cao hơn; thường mở trong thân nến trước và đóng gần đỉnh. Xuất hiện sau xu hướng giảm → thể hiện lực mua bền bỉ, khả năng đảo chiều/tạo xu hướng tăng.',

  'three_black_crows': 'Ba Con Quạ Đen (Three Black Crows) – Mô hình đảo chiều giảm mạnh gồm 3 nến giảm dài liên tiếp, mỗi nến đóng thấp hơn; thường mở trong thân nến trước và đóng gần đáy. Xuất hiện sau xu hướng tăng → thể hiện lực bán bền bỉ, khả năng đảo chiều giảm.',

  'morning_star': 'Sao Mai (Morning Star) – Mô hình 3 nến đảo chiều tăng: (1) nến giảm dài, (2) nến thân nhỏ (star) thể hiện lưỡng lự/giảm đà, (3) nến tăng dài đóng sâu vào thân nến (1) (thường trên mức giữa). Xuất hiện cuối xu hướng giảm → báo hiệu đảo chiều tăng.',

  'evening_star': 'Sao Hôm (Evening Star) – Mô hình 3 nến đảo chiều giảm: (1) nến tăng dài, (2) nến thân nhỏ (star) lưỡng lự, (3) nến giảm dài đóng sâu vào thân nến (1) (thường dưới mức giữa). Xuất hiện cuối xu hướng tăng → báo hiệu đảo chiều giảm.',

  'morning_star_doji': 'Sao Mai Doji – Biến thể Morning Star với nến giữa là Doji (do dự mạnh hơn). Thường được xem là “đáng tin” hơn Morning Star vì nhấn mạnh sự suy yếu của phe bán trước khi phe mua bứt lên.',

  'evening_star_doji': 'Sao Hôm Doji – Biến thể Evening Star với nến giữa là Doji. Thường được xem là “đáng tin” hơn Evening Star vì nhấn mạnh sự do dự/đảo chiều sau giai đoạn tăng.',

  'three_outside_up': 'Ba Nến Ngoài Tăng (Three Outside Up) – Gồm Bullish Engulfing (2 nến đầu) và nến thứ 3 tiếp tục tăng/đóng cao hơn, đóng vai trò xác nhận. Tín hiệu đảo chiều tăng mạnh hơn so với chỉ engulfing.',

  'three_inside_up': 'Ba Nến Trong Tăng (Three Inside Up) – Bắt đầu bằng Bullish Harami (2 nến đầu), sau đó nến thứ 3 tăng và đóng cao hơn nến thứ 2 → xác nhận đảo chiều tăng từ xu hướng giảm.',

  'bearish_abandoned_baby': 'Em Bé Bị Bỏ Rơi Giảm (Bearish Abandoned Baby) – Mô hình hiếm đảo chiều giảm: sau xu hướng tăng, xuất hiện Doji “tách biệt” (gap lên) rồi phiên sau gap xuống và giảm mạnh. Doji bị “cô lập” thể hiện sự bỏ rơi của lực mua; thường là tín hiệu đảo chiều mạnh khi gặp.',

  'upside_tasuki_gap': 'Tasuki Gap Tăng (Upside Tasuki Gap) – Mô hình tiếp diễn tăng (3 nến): trong xu hướng tăng có gap lên; sau đó một nến giảm lùi vào vùng gap nhưng **không** lấp kín hoàn toàn → gap giữ được, cho thấy điều chỉnh chỉ tạm thời và xu hướng tăng có thể tiếp tục.',

  'downside_tasuki_gap': 'Tasuki Gap Giảm (Downside Tasuki Gap) – Mô hình tiếp diễn giảm (3 nến): trong xu hướng giảm có gap xuống; sau đó một nến tăng hồi vào vùng gap nhưng **không** lấp kín hoàn toàn → gap giữ được, xu hướng giảm có thể tiếp tục.',

  'bearish_tri_star': 'Tri-Star Giảm – Mô hình hiếm gồm 3 Doji; Doji giữa “gap” lên so với hai Doji còn lại. Thể hiện do dự cực độ ở vùng đỉnh sau xu hướng tăng → nguy cơ đảo chiều giảm cao (cần xác nhận).',

  'bullish_tri_star': 'Tri-Star Tăng – Mô hình hiếm gồm 3 Doji; Doji giữa “gap” xuống. Thể hiện do dự cực độ ở vùng đáy sau xu hướng giảm → nguy cơ đảo chiều tăng cao (cần xác nhận).',

  'thrusting': 'Thrusting – Mô hình tiếp diễn giảm (2 nến): trong xu hướng giảm, xuất hiện một nến tăng mở thấp nhưng chỉ hồi “nông”, đóng dưới điểm giữa thân nến giảm trước. Tâm lý: lực mua yếu, chưa đủ đảo chiều → xu hướng giảm có thể tiếp diễn.',

  'upside_gap_two_crows': 'Gap Lên Hai Con Quạ (Upside Gap Two Crows) – Mô hình đảo chiều giảm (3 nến): sau một nến tăng, xuất hiện hai nến giảm nhỏ tạo gap lên, trong đó nến thứ 3 thường “nuốt” (engulf) nến thứ 2. Dù còn gap, chuỗi nến giảm cho thấy đà tăng suy yếu.',

  'three_star_in_the_south': 'Ba Sao Ở Phương Nam (Three Star in the South) – Mô hình đảo chiều tăng (hiếm) gồm 3 nến giảm ở vùng đáy, thân và bóng dưới co dần. Tâm lý: lực bán kiệt dần, áp lực giảm suy yếu → có thể chuẩn bị đảo chiều tăng.',

  'advance_block': 'Advance Block – Mô hình đảo chiều giảm: 3 nến tăng liên tiếp nhưng thân nến nhỏ dần và bóng trên dài dần. Tâm lý: phe mua vẫn đẩy giá lên nhưng gặp lực bán/chốt lời mạnh ở vùng cao → đà tăng suy yếu, nguy cơ đảo chiều/điều chỉnh.',

  'descending_hawk': 'Descending Hawk – Mô hình giảm (mô tả theo hệ thống): chuỗi nến cho thấy đỉnh sau thấp hơn đỉnh trước, áp lực bán tăng dần. Gợi ý động lượng giảm đang mạnh lên và xu hướng giảm có thể tiếp diễn.',

  'deliberation': 'Deliberation – Mô hình đảo chiều giảm tương tự Advance Block: 3 nến tăng, nhưng nến thứ 3 thể hiện sự “do dự” (thân nhỏ/giống doji). Tâm lý: sau đà tăng, lực mua chùn lại; nếu có nến giảm xác nhận thì rủi ro đảo chiều tăng.',

  // ===== MULTI-CANDLE PATTERNS =====
  'falling_three': 'Ba Phương Pháp Giảm (Falling Three Methods) – Mô hình tiếp diễn giảm (5 nến): (1) nến giảm dài, (2-4) 3 nến tăng nhỏ nằm gọn trong biên độ nến (1), (5) nến giảm dài tiếp tục phá xuống. Ý nghĩa: nhịp hồi chỉ là nghỉ/điều chỉnh trước khi xu hướng giảm tiếp diễn.',

  'rising_three': 'Ba Phương Pháp Tăng (Rising Three Methods) – Mô hình tiếp diễn tăng (5 nến): (1) nến tăng dài, (2-4) 3 nến giảm nhỏ nằm trong biên độ nến (1), (5) nến tăng dài tiếp tục phá lên. Ý nghĩa: nhịp điều chỉnh ngắn trước khi xu hướng tăng tiếp diễn.',

  'bearish_three_line_strike': 'Three Line Strike (nghịch chiều) – Biến thể đảo chiều tăng sau 3 nến giảm: 3 nến giảm liên tiếp, sau đó 1 nến tăng rất mạnh mở thấp hơn và đóng vượt lên trên vùng mở của nến đầu. Dù tên trong file là “bearish_…”, hành vi giá thường mang tính “bullish reversal” (phe mua phản công mạnh).',

  'bullish_three_line_strike': 'Three Line Strike (nghịch chiều) – Biến thể đảo chiều giảm sau 3 nến tăng: 3 nến tăng liên tiếp, sau đó 1 nến giảm rất mạnh mở cao hơn và đóng thủng xuống dưới vùng mở của nến đầu. Dù tên trong file là “bullish_…”, hành vi giá thường mang tính “bearish reversal” (phe bán phản công mạnh).',

  'ladder_top': 'Ladder Top – Mô hình đảo chiều giảm (5 nến): thường gồm 3 nến tăng liên tiếp, sau đó 1 nến tăng “đuối”/gap, rồi 1 nến giảm mạnh. Ý nghĩa: đà tăng bị “leo thang” đến kiệt sức, dễ đảo chiều ở kháng cự.',

  // ===== COMPLEX CHART PATTERNS =====
  'cup_with_handle': 'Cốc Tay Cầm (Cup with Handle) – Mô hình tiếp diễn tăng: giá tạo đáy cong dạng chữ “U” (cốc) sau nhịp giảm/điều chỉnh, sau đó tích lũy/đi ngang hơi nghiêng xuống (tay cầm). Tín hiệu mua thường khi phá vỡ (breakout) lên khỏi kháng cự vùng tay cầm, lý tưởng kèm khối lượng tăng. Mục tiêu tham chiếu thường lấy “độ sâu cốc” cộng vào điểm breakout.',

  'flag_pattern': 'Cờ (Flag) – Mô hình tiếp diễn xuất hiện sau một pha tăng/giảm mạnh (cột cờ). Giai đoạn sau là tích lũy/điều chỉnh ngắn tạo kênh giá gần song song (lá cờ), thường nghiêng ngược chiều xu hướng chính. Khi phá vỡ theo hướng xu hướng trước đó, giá có xu hướng tiếp diễn với động lượng.',

  'pennant': 'Cờ Đuôi Nheo (Pennant) – Mô hình tiếp diễn: sau một “cột cờ” mạnh, giá tích lũy ngắn trong tam giác nhỏ (hai đường xu hướng hội tụ). Thường kéo dài ngắn (vài phiên đến vài tuần tuỳ khung). Breakout thường xảy ra theo hướng xu hướng trước đó.',

  'double_tops': 'Hai Đỉnh (Double Top) – Mô hình đảo chiều giảm: giá tạo 2 đỉnh gần nhau tại vùng kháng cự và thất bại khi vượt qua. “Đường cổ” (neckline) là đáy giữa hai đỉnh; khi phá xuống neckline → xác nhận. Mục tiêu tham chiếu: chiều cao từ đỉnh đến neckline chiếu xuống.',

  'double_bottoms': 'Hai Đáy (Double Bottom) – Mô hình đảo chiều tăng: giá tạo 2 đáy gần nhau tại vùng hỗ trợ và bật lên. Neckline là đỉnh giữa hai đáy; khi phá lên neckline → xác nhận. Mục tiêu tham chiếu: chiều cao từ neckline đến đáy chiếu lên.',

  'double_pattern': 'Mô hình “Double” – Nhóm mô hình hai đỉnh (bearish) và hai đáy (bullish). Điểm mấu chốt là giá thử lại một vùng quan trọng 2 lần rồi đảo chiều; cần phá neckline để xác nhận.',

  'head_and_shoulders': 'Vai–Đầu–Vai (Head and Shoulders) – Mô hình đảo chiều giảm: 3 đỉnh, đỉnh giữa cao nhất (đầu) kẹp giữa 2 đỉnh thấp hơn (vai). Neckline nối các đáy giữa các đỉnh; phá xuống neckline → xác nhận đảo chiều. Mục tiêu tham chiếu thường bằng khoảng cách từ “đầu” đến neckline chiếu xuống từ điểm phá vỡ.',

  'inverse_head_and_shoulders': 'Vai–Đầu–Vai Ngược (Inverse Head and Shoulders) – Mô hình đảo chiều tăng: 3 đáy, đáy giữa thấp nhất (đầu) kẹp giữa 2 đáy cao hơn (vai). Phá lên neckline → xác nhận. Mục tiêu tham chiếu thường bằng độ sâu từ neckline đến “đầu” chiếu lên từ điểm breakout.',

  'triangle_ascending': 'Tam Giác Tăng (Ascending Triangle) – Thường là mô hình tiếp diễn/tăng: kháng cự ngang và hỗ trợ dốc lên. Người mua ngày càng “trả giá cao hơn”, tạo sức ép lên kháng cự; breakout lên (đặc biệt kèm volume) là tín hiệu tích cực.',

  'triangle_descending': 'Tam Giác Giảm (Descending Triangle) – Thường là mô hình tiếp diễn/giảm: hỗ trợ ngang và kháng cự dốc xuống. Người bán ngày càng “bán rẻ hơn”, tạo sức ép xuống hỗ trợ; breakdown xuống là tín hiệu tiêu cực.',

  'triangle_symmetrical': 'Tam Giác Cân (Symmetrical Triangle) – Mô hình trung tính/tiếp diễn: hai đường xu hướng hội tụ (đỉnh thấp dần, đáy cao dần), biến động co lại. Thường phá vỡ theo hướng xu hướng trước đó, nhưng cũng có thể đảo chiều; thường thấy volume co lại trong tam giác và tăng mạnh khi breakout.',

  'triangle_pattern': 'Nhóm mô hình Tam Giác – Bao gồm tam giác tăng, giảm và cân. Điểm chung: tích lũy với biên độ co hẹp, “nén” biến động trước khi bùng nổ theo một hướng; cần theo dõi điểm phá vỡ (breakout/breakdown) và xác nhận.'
};
