/**
 * sysdesk.js  v1.0.0
 * ─ Trợ lý giám sát hệ thống server / network
 * ─ Live2D Girls' Frontline: UMP45 · M4A1 · SOPMOD-II · HK416
 * ─ Bubble cảnh báo thông minh theo ngưỡng CPU/RAM/Disk/Temp
 * ─ Giám sát trạng thái dịch vụ (AdGuard, WiFi AP, ...)
 * ─ TTS linh hoạt (WebSpeech / Google TTS / HA Service)
 * ─ Chế độ Mini nổi + Ghim góc màn hình
 *
 * Config YAML:
 *   type: custom:sys-desk
 *   name: Anh Long          # tên admin hiển thị trong lời chào
 *   height: 440
 *   float_height: 600
 *   float_width:  380
 *
 *   # ── TTS ENGINE ──────────────────────────────────────────────
 *   tts:
 *     engine: webspeech       # webspeech | google_translate | ha_service | none
 *     lang: vi-VN
 *     rate: 1.05
 *     pitch: 1.1
 *
 *   # ── SERVER SENSORS (entity mặc định đã cài — chỉ khai báo nếu khác) ──
 *   # Home Assistant
 *   ha_cpu:   sensor.system_monitor_processor_use
 *   ha_disk:  sensor.system_monitor_disk_usage
 *   ha_ram:   sensor.system_monitor_memory_usage
 *   ha_temp:  sensor.system_monitor_processor_temperature
 *
 *   # pfSense
 *   pf_cpu:   sensor.pfsense_cpu_usage
 *   pf_ram:   sensor.pfsense_memory_used
 *
 *   # Frigate (VM 200)
 *   fri_cpu:  sensor.frigate_200_cpu_used
 *   fri_ram:  sensor.qemu_frigate_200_memory_used_percentage
 *
 *   # NAS
 *   nas_cpu:  sensor.nas_cpu
 *   nas_ram:  sensor.nas_memory
 *   nas_disk_temp: sensor.data_drive_1_temperature
 *
 *   # Ngưỡng (mặc định — không cần khai báo nếu dùng giá trị này):
 *   #   CPU  warn≥70%  crit≥90%
 *   #   RAM  warn≥75%  crit≥90%
 *   #   Disk warn≥70%  crit≥85%
 *   #   CPU Temp  warn≥70°C  crit≥85°C
 *   #   Drive Temp warn≥40°C crit≥55°C
 *
 *   # Services / AP (cảnh báo khi off/unavailable)
 *   adguard: switch.adguard_home_protection
 *   wifi_5:  sensor.5_office_state
 *   wifi_6:  sensor.6_living_state
 *   wifi_7:  sensor.7_kitchen_state
 *   wifi_8:  sensor.8_garage_state
 *   wifi_9:  sensor.9_outside_state
 *   nano_hd: sensor.nano_hd_state
 */

// ─── i18n ────────────────────────────────────────────────────
const SD_LANG = (() => {
  try { return localStorage.getItem('sd_lang') || 'vi'; } catch(e) { return 'vi'; }
})();

function _sdSetLang(lang) {
  try { localStorage.setItem('sd_lang', lang); } catch(e) {}
}

const SD_I18N = {
  vi: {
    // ── Card UI ──
    btn_mini:         'Mini',
    btn_pin:          'Ghim',
    btn_unpin:        'Bỏ ghim',
    btn_hide:         'Ẩn',
    btn_prev:         '◀ Trước',
    btn_next:         '▶ Sau',
    btn_report:       '💬 Báo cáo',
    btn_tts:          '🔊 TTS',
    btn_tts_off:      '🔇 TTS',
    btn_reload:       '🔄 Reload',
    badge_checking:   'Đang kiểm tra...',
    badge_ok:         'Hệ thống ổn',
    badge_alerts:     (n) => `${n} cảnh báo`,
    badge_all_ok:     '✅ Tất cả hệ thống bình thường',
    // ── Float overlay ──
    float_restore:    '⬆ Vào card',
    float_click_tip:  (cn) => `${cn} đang trực canh server góc phải nha~ 🛡️ Đúp click để về card!`,
    float_tips:       (cn) => [
      `${cn} đang trực canh server góc phải nha~`,
      'Đúp click để về card nghen!',
      `Hệ thống vẫn đang ổn! ${cn} canh cho!`,
    ],
    // ── Pin overlay ──
    pin_btn_unpin:    '📍 Bỏ ghim',
    pin_btn_pin:      '📍 Ghim',
    // ── Status messages (from code) ──
    reload_done:      (cn) => `${cn} reload xong rồi nha~ 🔄`,
    hide_msg:         (cn) => `${cn} tạm nghỉ trực rồi nha~ 📴 Gọi lại nếu cần!`,
    back_to_card:     (cn) => `${cn} về card rồi nha~ ✅`,
    char_click_tips:  (cn) => [
      `Hệ thống đang được ${cn} canh chừng kỹ lưỡng nha~`,
      `${cn} đang theo dõi tất cả server 24/7! Yên tâm đi~`,
      `Ôi chọc ${cn} rồi! Mà thôi, hệ thống vẫn ổn nha~ 😄`,
      `${cn} đang scan network... Mọi thứ bình thường!`,
    ],
    // ── Badge status text ──
    badge_crit_count: (n) => `${n} cảnh báo`,
    badge_warn_count: (n) => `${n} cảnh báo`,
    // ── Report ──
    report_intro_ok:  (cn) => `${cn} xin báo cáo! Có các vấn đề như sau: ✅ Không có cảnh báo nào — tất cả hệ thống đang hoạt động bình thường!`,
    report_intro_ok_tts: (cn) => `${cn} xin báo cáo! Có các vấn đề như sau: Không có cảnh báo nào, tất cả hệ thống đang hoạt động bình thường!`,
    report_intro_err: (cn, problems) => `${cn} xin báo cáo! Có các vấn đề như sau: ${problems.join(', ')}`,
    // ── sysQuote badge labels ──
    severity_crit:    'nghiêm trọng',
    severity_warn:    'cảnh báo',
    svc_offline:      (label) => `🔴 ${label} đang offline`,
    // ── Status build ──
    sys_all_ok:       (cn, name) => `${cn} vừa kiểm tra xong — tất cả ${name === 'admin' ? 'hệ thống' : 'server của ' + name} đang hoạt động bình thường! ✅`,
    alert_crit:       (name, n) => `🚨 ${name} ơi, có ${n} cảnh báo NGUY HIỂM cần xử lý ngay! Kiểm tra badge phía trên nha!`,
    alert_warn:       (cn, name, n) => `⚠️ ${cn} phát hiện ${n} chỉ số đang vượt ngưỡng cảnh báo — ${name} xem badge trên góc trái nha~`,
    alert_down:       (name, n) => `🔴 ${n} dịch vụ đang offline! ${name} cần kiểm tra lại ngay~`,
    // ── Greeting by hour ──
    greet_dawn:       (name, cn) => [`Dậy sớm dữ vậy ${name}~ ${cn} cũng vừa bắt đầu ca trực! 🌅`, `Server đêm qua ổn định, ${name} yên tâm nha~ 🌙`],
    greet_morning:    (name, cn) => [`Chào buổi sáng ${name}! ${cn} đang scan toàn bộ hệ thống~ ☀️`, `${name} ơi, ${cn} vừa kiểm tra xong — tất cả ổn! ✅`],
    greet_noon:       (name, cn) => [`Trưa rồi ${name} ơi! Hệ thống đang bình thường, cứ nghỉ ngơi đi~ 🍱`, `${cn} trực liên tục nha! ${name} cứ ăn trưa đi~ 😄`],
    greet_afternoon:  (name, cn) => [`Chiều rồi ${name}~ ${cn} vẫn đang theo dõi server 24/7! 💪`, `${name} ơi, hệ thống chiều nay đang ổn định lắm~ ⛅`],
    greet_evening:    (name, cn) => [`Tối rồi ${name}~ Báo cáo: hệ thống ngày hôm nay ổn định! ✅`, `${cn} sẽ trực cả đêm cho ${name} yên tâm nhé~ 🌙`],
    greet_night:      (name, cn) => [`Khuya rồi ${name} ơi! ${cn} vẫn đang canh server nha~ 😴💪`, `${name} đi ngủ đi, ${cn} trực đêm cho! 🌃`],
    // ── Editor ──
    editor_title_general:    '⚙️ Cài đặt chung',
    editor_title_appearance: '🎨 Giao diện',
    editor_title_sensors:    '🖥️ Server Sensors',
    editor_title_services:   '📡 Dịch vụ & Access Points',
    editor_title_tts:        '🔊 Giọng nói (TTS)',
    editor_lang_label:       '🌐 Ngôn ngữ giao diện',
    editor_lang_vi:          '🇻🇳 Tiếng Việt',
    editor_lang_en:          '🇬🇧 English',
    editor_owner_label:      '👤 Tên admin',
    editor_owner_hint:       '(nhân vật gọi tên này)',
    editor_owner_ph:         'vd: Anh Long, admin...',
    editor_char_label:       '✏️ Tên tự xưng nhân vật',
    editor_char_hint:        '(để trống = tên gốc)',
    editor_char_ph:          'vd: UMP45, SOPMOD...',
    editor_height_label:     '📐 Chiều cao card (px)',
    editor_blur_label:       '🪟 Độ mờ nền (blur)',
    editor_blur_hint:        '0px = trong suốt · 30px = mờ tối đa',
    editor_float_tag:        'Chế độ Mini / Ghim',
    editor_float_h_label:    '📐 Chiều cao nhân vật nổi (px)',
    editor_float_w_label:    '📐 Chiều rộng nhân vật nổi (px)',
    editor_sensors_hint:     'Nhân vật cảnh báo ngay khi vượt ngưỡng. Bạn có thể đổi tên hiển thị và thêm/xóa entity tùy ý.',
    editor_thresh_type:      'Loại',
    editor_sensor_rename_ph: 'Đổi tên hiển thị (để trống = dùng tên gốc)',
    editor_add_sensor:       '➕ Thêm sensor',
    editor_custom_sensor_ph: 'Tên hiển thị',
    editor_services_hint:    'Cảnh báo ngay khi state là <strong>off</strong> hoặc <strong>unavailable</strong>. Đổi tên hoặc thêm dịch vụ/AP tùy ý.',
    editor_service_ph:       'Tên dịch vụ/AP',
    editor_add_service:      '➕ Thêm dịch vụ / AP',
    editor_tts_engine:       '⚙️ Engine TTS',
    editor_tts_off:          '🔇 Tắt',
    editor_ws_title:         '🗣️ WEB SPEECH API',
    editor_ws_lang:          '🌐 Ngôn ngữ',
    editor_ws_rate:          '⏩ Tốc độ đọc',
    editor_ws_pitch:         '🎵 Cao độ (pitch)',
    editor_gt_title:         '🌐 GOOGLE TRANSLATE TTS',
    editor_gt_hint:          'Dùng API Google Translate. Giới hạn ~200 ký tự/lần.',
    editor_gt_lang:          '🌐 Mã ngôn ngữ',
    editor_ha_title:         '🏠 HOME ASSISTANT TTS SERVICE',
    editor_ha_svc:           '⚙️ Service',
    editor_ha_svc_ph:        'tts.speak',
    editor_ha_entity:        '🎯 Entity ID',
    editor_ha_media:         '📻 Media player',
    editor_ha_media_hint:    '(tuỳ chọn)',
    editor_tts_none_hint:    '🔇 TTS tắt. Nhân vật vẫn hiện bubble text.',
    editor_tip:              '💡 <strong>Tip:</strong> Sau khi chỉnh xong, bấm <strong>LƯU</strong>. YAML: <code>type: custom:sys-desk</code>',
    editor_svc_hint_title:   '🔒 Service',
    editor_svc_hint_val:     '(vd: tts.speak)',
    // ── Model greetings ──
    model_greeting_ump45:  'UMP45 báo cáo! Hệ thống đang được theo dõi~ 🔫',
    model_greeting_m4a1:   'M4A1 xin chào! Bắt đầu giám sát server~ 🛡️',
    model_greeting_sopmod: 'SOPMOD đây!! Có gì bất thường là mình phát hiện ngay! 🔥',
    model_greeting_hk416:  'HK416 báo cáo! Tất cả hệ thống đang được kiểm soát~ 🎯',
    model_greeting_k2:     'K2 xin chào~ Để mình theo dõi hệ thống cho anh nhé! Đừng lo lắng, mình luôn ở đây! 🌸',
    model_greeting_pkp:    'PKP báo cáo! Server đang ổn định — uống trà và thư giãn đi anh ơi~ 🍵',
    model_greeting_rfb:    'RFB ở đây rồi! Hệ thống của anh đang trong tầm ngắm của mình~ Yên tâm đi! 🎄',
    model_greeting_lewis:  'Lewis xin chào! Mình sẽ canh gác mọi thứ cho anh — cứ để mình lo nhé~ 🌼',
    model_greeting_dsr50:  'DSR-50 đã sẵn sàng! Không có gì lọt qua tầm quan sát của mình đâu~ Hệ thống an toàn! 🔭',
    model_greeting_gelina: 'Gelina báo cáo! Tất cả cảm biến đã được kết nối — bắt đầu giám sát ngay bây giờ! ⚙️',
    // ── Card description ──
    card_description: 'SysDesk — Trợ lý giám sát server & network với Live2D Girls Frontline',
    // ── server_warn messages ──
    msg_warn_cpu: [
      '⚠️ {n} ơi, {c} vừa phát hiện {label} CPU đang chạy tới {v} phần trăm rồi đó! Có tiến trình nào đang ngốn tài nguyên bất thường không? {n} kiểm tra task manager xem sao nha~',
      '🔥 {c} báo cáo: {label} CPU đang ở mức {v} phần trăm — vượt ngưỡng cảnh báo rồi! Nếu tình trạng này kéo dài, hệ thống có thể bị chậm hoặc treo đó {n}. Kiểm tra ngay đi nha!',
      '⚠️ Chú ý {n}! CPU của {label} đang leo tới {v} phần trăm. {c} nghĩ có thể là cron job hoặc backup đang chạy nền — {n} vào xem log xem thử nhé~',
    ],
    msg_warn_ram: [
      '⚠️ {n} ơi, {label} RAM đã lên tới {v} phần trăm rồi! Bộ nhớ đang bị dùng nhiều hơn bình thường — coi chừng hệ thống bắt đầu swap sang disk thì chậm lắm đó. {n} xem có process nào leak memory không nhé~',
      '💾 {c} phát hiện {label} RAM đang ở mức {v} phần trăm — vượt ngưỡng an toàn rồi {n} ơi! Nếu còn tăng nữa là nguy hiểm đó. {n} restart service không cần thiết đi cho nhẹ máy nha~',
      '⚠️ Bộ nhớ {label} đang hao tới {v} phần trăm rồi! {c} khuyên {n} nên xem lại xem container nào đang chiếm RAM nhiều, dọn dẹp một chút đi nha~',
    ],
    msg_warn_disk: [
      '⚠️ {n} ơi, ổ cứng {label} đang dùng tới {v} phần trăm dung lượng rồi! Nếu đầy hoàn toàn thì log sẽ không ghi được, service có thể crash đó. {n} dọn dẹp file cũ hoặc mở rộng dung lượng sớm nha~',
      '💿 {c} báo động: {label} disk đã {v} phần trăm — sắp không còn chỗ lưu trữ liệu rồi! {n} xem thư mục nào đang chiếm nhiều nhất, rm hoặc archive bớt đi nhé. Đừng để đầy là khổ lắm~',
      '⚠️ Dung lượng {label} còn lại không nhiều — hiện đang ở mức {v} phần trăm rồi {n} ơi! {c} nhắc {n} backup và dọn log định kỳ cho an toàn nha~',
    ],
    msg_warn_temp: [
      '🌡️ {n} ơi, {label} CPU đang nóng tới {v} độ C rồi! {c} lo lắng lắm — kiểm tra quạt tản nhiệt xem còn chạy tốt không, paste nhiệt có cần thay không nhé. Nếu để quá nóng lâu sẽ ảnh hưởng tuổi thọ linh kiện đó~',
      '♨️ {c} phát hiện nhiệt độ CPU {label} đang ở {v} độ C — vượt ngưỡng cảnh báo rồi! Phòng server có thông thoáng không {n}? {n} kiểm tra airflow trong case xem sao nha, đừng để nóng thêm~',
      '🌡️ CPU {label} đang chạy ở {v} độ C rồi {n} ơi! {c} khuyên {n} xem lại tốc độ quạt trong BIOS hoặc iDRAC — nếu quạt chưa tăng tốc thì cần can thiệp ngay đó nhé~',
    ],
    msg_warn_disk_temp: [
      '🌡️ {n} ơi, ổ cứng {label} đang ấm tới {v} độ C rồi! Ổ HDD thường an toàn dưới 45 độ — {n} kiểm tra luồng gió trong tủ rack hoặc case máy chủ xem có bị chặn không nha~',
      '🔥 {c} thấy nhiệt độ drive {label} đang ở {v} độ C — hơi cao rồi đó {n}! Ổ đang nóng có thể ảnh hưởng tuổi thọ và tốc độ đọc ghi. {n} kiểm tra quạt case và đảm bảo cáp không chặn airflow nha~',
      '🌡️ Drive {label} đang chạy ở nhiệt độ {v} độ C rồi {n} ơi! {c} nhắc {n} theo dõi S.M.A.R.T data của ổ này thêm, nếu reallocated sectors tăng thì backup ngay đi nha~',
    ],
    // ── server_crit messages ──
    msg_crit_cpu: [
      '🚨 KHẨN CẤP! {n} ơi, {label} CPU đang ở mức {v} phần trăm — QUÁ TẢI NGHIÊM TRỌNG rồi! Hệ thống có thể trở nên không phản hồi bất cứ lúc nào! {n} vào kill process ngốn CPU ngay đi, không được chần chừ!',
      '🆘 {c} báo khẩn cấp: {label} CPU đã vọt lên {v} phần trăm! Đây là mức nguy hiểm, load average đang rất cao. {n} kiểm tra xem có tấn công hay runaway process nào không — nếu cần thì restart service ngay!',
      '🚨 Cảnh báo đỏ! CPU {label} đang {v} phần trăm — {c} không thể bỏ qua được! {n} phải can thiệp ngay bây giờ! SSH vào máy chủ, chạy top hoặc htop để xác định process thủ phạm và xử lý!',
    ],
    msg_crit_ram: [
      '🚨 KHẨN CẤP! {label} RAM đã lên tới {v} phần trăm — SẮP HẾT BỘ NHỚ HOÀN TOÀN rồi {n} ơi! Hệ thống đang swap nặng, hiệu suất cực kỳ tệ! {n} phải tắt bớt service hoặc restart ngay trước khi bị OOM killer tự động kill process!',
      '🆘 {c} báo động đỏ: {label} RAM {v} phần trăm! Nếu không can thiệp kịp, kernel OOM killer sẽ tự kill process ngẫu nhiên — cực kỳ nguy hiểm với database! {n} xử lý ngay nha!',
      '🚨 Nguy hiểm! Bộ nhớ {label} đang ở {v} phần trăm — {c} khuyến cáo {n} thêm swap hoặc tắt bớt container/service không cần thiết ngay lập tức. Đừng để OOM crash hệ thống!',
    ],
    msg_crit_disk: [
      '🚨 ĐẦY Ổ CỨNG! {label} disk đã {v} phần trăm — CỰC KỲ NGUY HIỂM {n} ơi! Khi ổ đầy 100%, log không ghi được, database có thể corrupt, service sẽ crash hàng loạt! {n} phải xóa hoặc di chuyển dữ liệu NGAY BÂY GIỜ!',
      '🆘 {c} báo gấp: {label} disk {v} phần trăm — SẮP ĐẦY HOÀN TOÀN! {n} ơi, chạy du -sh /* để tìm thư mục chiếm nhiều nhất rồi dọn ngay! Log cũ, docker images unused, backup lỗi thời — xóa hết đi!',
      '🚨 Báo động đỏ! Dung lượng {label} chỉ còn lại chưa đầy {v} phần trăm — sắp chạm đáy rồi! {n} đừng để ổ đầy, nguy cơ mất data và crash service là rất cao. {c} yêu cầu xử lý khẩn cấp!',
    ],
    msg_crit_temp: [
      '🚨 QUÁ NHIỆT KHẨN CẤP! CPU {label} đang {v} độ C — NGUY CƠ HỎNG PHẦN CỨNG NGAY LẬP TỨC! {n} ơi, tắt hoặc giảm tải máy chủ này NGAY, kiểm tra quạt xem có bị kẹt không! Nhiệt độ cao kéo dài sẽ hỏng chip CPU không sửa được!',
      '🆘 EMERGENCY! {label} CPU đang {v} độ C — ĐÃ VÀO VÙNG ĐỎ! {n} ơi, CPU sẽ tự throttle mạnh để bảo vệ hoặc tự tắt máy bất ngờ! Xử lý ngay: kiểm tra quạt, thông gió, và giảm tải tức thì!',
      '🚨 {label} đang {v} độ C — NÓNG NGUY HIỂM! {c} yêu cầu {n} tắt workload nặng ngay lập tức! Nếu nhiệt không giảm trong vài phút, xem xét shutdown có kiểm soát để tránh hỏng phần cứng!',
    ],
    msg_crit_disk_temp: [
      '🚨 KHẨN CẤP! Ổ {label} đang {v} độ C — QUÁ NHIỆT NGHIÊM TRỌNG! {n} ơi, ổ cứng HDD ở nhiệt độ này cực dễ hỏng và mất data! BACKUP NGAY lập tức trước khi quá muộn! Sau đó kiểm tra hệ thống làm mát ngay!',
      '🆘 {label} drive đang {v} độ C — NGUY CƠ HỎNG Ổ CỰC CAO! {n} ơi, ở nhiệt độ này ổ có thể fail bất cứ lúc nào! {n} dừng ghi dữ liệu mới, backup khẩn cấp sang ổ khác và kiểm tra quạt case ngay!',
      '🚨 Nhiệt độ drive {label} đã vọt tới {v} độ C — DỪNG HỆ THỐNG ĐỂ KIỂM TRA! {c} cảnh báo {n} rằng S.M.A.R.T của ổ này đang trong tình trạng rất xấu! Backup data và chuẩn bị thay ổ ngay nha!',
    ],
    // ── service_down messages ──
    msg_service_down: [
      '🔴 {n} ơi, {c} phát hiện {label} vừa mất kết nối hoặc tắt rồi! Dịch vụ này đang không phản hồi — {n} vào kiểm tra xem có bị crash hay restart loop không nhé. Log service thường nằm trong journalctl hoặc dashboard của {label}~',
      '⚠️ {c} cảnh báo: {label} hiện đang ở trạng thái unavailable! Điều này có thể ảnh hưởng đến các thiết bị hoặc dịch vụ phụ thuộc vào nó. {n} kiểm tra ngay xem có phải do mất điện, cập nhật firmware, hay lỗi cấu hình không nha~',
      '🚨 {label} đang offline rồi {n} ơi! {c} không thể liên lạc được với thiết bị này nữa. Nếu đây là WiFi AP hoặc switch quan trọng, các client đang kết nối qua nó có thể bị mất mạng rồi đó — cần restore nhanh lên!',
      '🔴 Báo động: {label} không còn phản hồi! {c} đã thử kiểm tra nhưng trạng thái vẫn là down. {n} reboot thiết bị hoặc kiểm tra kết nối vật lý xem sao — có thể chỉ cần khởi động lại là ổn thôi!',
    ],
    // ── idle messages ──
    msg_idle_ump45: [
      '{n} ơi, UMP45 đang giám sát toàn bộ hệ thống 24/7~ 🔫',
      'Mọi sensor đều được UMP45 theo dõi chặt! {n} cứ yên tâm làm việc~',
      '{n} ơi, có gì bất thường UMP45 báo ngay nha! 👁️🔫',
      'UMP45 đang scan tất cả server và mạng... Mọi thứ đang được kiểm soát! ✅',
      '{n}, nhớ backup dữ liệu định kỳ nha! UMP45 nhắc đó~ 💾🔫',
      'Không có gì qua mắt UMP45 được đâu {n} ơi! Network đang ổn~ 📡',
    ],
    msg_idle_m4a1: [
      'M4A1 đang phân tích trạng thái hệ thống... Mọi thứ bình thường~ 🛡️',
      '{n} ơi, M4A1 báo cáo: tất cả server đang hoạt động ổn định~ ✅',
      'M4A1 kiểm tra xong rồi — không có cảnh báo nào đang kích hoạt! 🛡️',
      'Nhiệm vụ giám sát hệ thống — M4A1 sẽ hoàn thành tốt nhất! {n} tin không? 💪',
      '{n}, uptime hệ thống đang tốt! M4A1 canh chừng 24/7~ 🎯',
      'M4A1 nhắc {n}: cập nhật firmware định kỳ là việc quan trọng nha! 🛡️',
    ],
    msg_idle_sopmod: [
      'SOPMOD đang theo dõi tất cả sensor! Có gì bất ổn là mình phát hiện ngay~ 🔥',
      '{n} ơi, SOPMOD thích nhà có nhiều server lắm, như bãi tập vậy! 💥',
      'Yeahhh! Tất cả hệ thống đang ổn! SOPMOD không có gì để báo cáo~ 🔥',
      '{n}, đừng lo! SOPMOD canh hệ thống kỹ lắm, không gì lọt qua được! 🔥',
      'SOPMOD scan network xong — không có gì bất thường cả! {n} cứ yên tâm~ 💥',
      '{n} ơi SOPMOD nhớ bạn ghê~ Nhưng quan trọng hơn là server vẫn ổn! 🥳',
    ],
    msg_idle_hk416: [
      'HK416 báo cáo: tất cả hệ thống trong tầm kiểm soát! 🎯',
      '{n}, HK416 vừa hoàn thành vòng kiểm tra — không có anomaly nào~ ✅',
      'Kỷ luật và giám sát liên tục — đó là phong cách HK416! {n} yên tâm đi~ 🎯',
      'HK416 đang monitor CPU/RAM/Network theo thời gian thực! {n} có thể làm việc~ 🎯',
      '{n}, HK416 nhắc: đừng để disk usage vượt 80% nha! Vệ sinh định kỳ đó~ 🎯',
      'Không có gì qua mắt HK416 được — hệ thống của {n} đang rất ổn! 💪',
    ],
    sensor_groups: { ha: '🏠 Home Assistant', pfsense: '🔒 pfSense', frigate: '📷 Frigate (VM 200)', nas: '💽 NAS' },
  },
  en: {
    // ── Card UI ──
    btn_mini:         'Mini',
    btn_pin:          'Pin',
    btn_unpin:        'Unpin',
    btn_hide:         'Hide',
    btn_prev:         '◀ Prev',
    btn_next:         '▶ Next',
    btn_report:       '💬 Report',
    btn_tts:          '🔊 TTS',
    btn_tts_off:      '🔇 TTS',
    btn_reload:       '🔄 Reload',
    badge_checking:   'Checking...',
    badge_ok:         'System OK',
    badge_alerts:     (n) => `${n} alert${n>1?'s':''}`,
    badge_all_ok:     '✅ All systems normal',
    // ── Float overlay ──
    float_restore:    '⬆ Back to card',
    float_click_tip:  (cn) => `${cn} is monitoring the server from the corner~ 🛡️ Double-click to return to card!`,
    float_tips:       (cn) => [
      `${cn} is watching the server from the side~`,
      'Double-click to go back to card!',
      `All systems OK! ${cn} is on guard!`,
    ],
    // ── Pin overlay ──
    pin_btn_unpin:    '📍 Unpin',
    pin_btn_pin:      '📍 Pin',
    // ── Status messages ──
    reload_done:      (cn) => `${cn} reloaded successfully~ 🔄`,
    hide_msg:         (cn) => `${cn} is going off duty~ 📴 Call again if needed!`,
    back_to_card:     (cn) => `${cn} is back in the card~ ✅`,
    char_click_tips:  (cn) => [
      `Systems are being monitored carefully by ${cn}~`,
      `${cn} is watching all servers 24/7! Stay calm~`,
      `Oh you clicked ${cn}! But the system is still fine~ 😄`,
      `${cn} is scanning the network... Everything is normal!`,
    ],
    // ── Badge status text ──
    badge_crit_count: (n) => `${n} alert${n>1?'s':''}`,
    badge_warn_count: (n) => `${n} alert${n>1?'s':''}`,
    // ── Report ──
    report_intro_ok:  (cn) => `${cn} reporting! Summary: ✅ No alerts — all systems operating normally!`,
    report_intro_ok_tts: (cn) => `${cn} reporting! Summary: No alerts, all systems operating normally!`,
    report_intro_err: (cn, problems) => `${cn} reporting! Issues detected: ${problems.join(', ')}`,
    // ── sysQuote badge labels ──
    severity_crit:    'critical',
    severity_warn:    'warning',
    svc_offline:      (label) => `🔴 ${label} is offline`,
    // ── Status build ──
    sys_all_ok:       (cn, name) => `${cn} checked — all ${name === 'admin' ? 'systems' : name + '\'s servers'} are operating normally! ✅`,
    alert_crit:       (name, n) => `🚨 ${name}, there are ${n} CRITICAL alert${n>1?'s':''} that need immediate attention! Check the badge above!`,
    alert_warn:       (cn, name, n) => `⚠️ ${cn} detected ${n} metric${n>1?'s':''} exceeding warning threshold — ${name} check the badge on the top left~`,
    alert_down:       (name, n) => `🔴 ${n} service${n>1?'s are':' is'} offline! ${name} please check immediately~`,
    // ── Greeting by hour ──
    greet_dawn:       (name, cn) => [`Up early, ${name}~ ${cn} just started the watch! 🌅`, `Last night's servers were stable, ${name}~ 🌙`],
    greet_morning:    (name, cn) => [`Good morning ${name}! ${cn} is scanning all systems~ ☀️`, `${name}, ${cn} just finished checking — everything is fine! ✅`],
    greet_noon:       (name, cn) => [`It\'s noon, ${name}! Systems are normal, take a break~ 🍱`, `${cn} is on continuous watch! ${name} go have lunch~ 😄`],
    greet_afternoon:  (name, cn) => [`Good afternoon ${name}~ ${cn} is still monitoring servers 24/7! 💪`, `${name}, systems are very stable this afternoon~ ⛅`],
    greet_evening:    (name, cn) => [`Good evening ${name}~ Report: systems were stable today! ✅`, `${cn} will be on watch all night for ${name}~ 🌙`],
    greet_night:      (name, cn) => [`It\'s late ${name}! ${cn} is still watching the servers~ 😴💪`, `${name} go to sleep, ${cn} is on night duty! 🌃`],
    // ── Editor ──
    editor_title_general:    '⚙️ General Settings',
    editor_title_appearance: '🎨 Appearance',
    editor_title_sensors:    '🖥️ Server Sensors',
    editor_title_services:   '📡 Services & Access Points',
    editor_title_tts:        '🔊 Text-to-Speech (TTS)',
    editor_lang_label:       '🌐 Interface Language',
    editor_lang_vi:          '🇻🇳 Tiếng Việt',
    editor_lang_en:          '🇬🇧 English',
    editor_owner_label:      '👤 Admin name',
    editor_owner_hint:       '(character will call this name)',
    editor_owner_ph:         'e.g: Admin, John...',
    editor_char_label:       '✏️ Character nickname',
    editor_char_hint:        '(leave blank = use original name)',
    editor_char_ph:          'e.g: UMP45, SOPMOD...',
    editor_height_label:     '📐 Card height (px)',
    editor_blur_label:       '🪟 Background blur',
    editor_blur_hint:        '0px = transparent · 30px = max blur',
    editor_float_tag:        'Mini / Pin mode',
    editor_float_h_label:    '📐 Floating character height (px)',
    editor_float_w_label:    '📐 Floating character width (px)',
    editor_sensors_hint:     'Character alerts immediately when threshold is exceeded. You can rename and add/remove entities freely.',
    editor_thresh_type:      'Type',
    editor_sensor_rename_ph: 'Rename (leave blank = use original)',
    editor_add_sensor:       '➕ Add sensor',
    editor_custom_sensor_ph: 'Display name',
    editor_services_hint:    'Alerts immediately when state is <strong>off</strong> or <strong>unavailable</strong>. Rename or add services/APs freely.',
    editor_service_ph:       'Service/AP name',
    editor_add_service:      '➕ Add service / AP',
    editor_tts_engine:       '⚙️ TTS Engine',
    editor_tts_off:          '🔇 Off',
    editor_ws_title:         '🗣️ WEB SPEECH API',
    editor_ws_lang:          '🌐 Language',
    editor_ws_rate:          '⏩ Speech rate',
    editor_ws_pitch:         '🎵 Pitch',
    editor_gt_title:         '🌐 GOOGLE TRANSLATE TTS',
    editor_gt_hint:          'Uses Google Translate API. Limit ~200 chars/request.',
    editor_gt_lang:          '🌐 Language code',
    editor_ha_title:         '🏠 HOME ASSISTANT TTS SERVICE',
    editor_ha_svc:           '⚙️ Service',
    editor_ha_svc_ph:        'tts.speak',
    editor_ha_entity:        '🎯 Entity ID',
    editor_ha_media:         '📻 Media player',
    editor_ha_media_hint:    '(optional)',
    editor_tts_none_hint:    '🔇 TTS off. Character still shows bubble text.',
    editor_tip:              '💡 <strong>Tip:</strong> After editing, click <strong>SAVE</strong>. YAML: <code>type: custom:sys-desk</code>',
    editor_svc_hint_title:   '🔒 Service',
    editor_svc_hint_val:     '(e.g: tts.speak)',
    // ── Model greetings ──
    model_greeting_ump45:  'UMP45 reporting! System is being monitored~ 🔫',
    model_greeting_m4a1:   'M4A1 here! Starting server surveillance~ 🛡️',
    model_greeting_sopmod: 'SOPMOD on duty!! I\'ll catch anything unusual instantly! 🔥',
    model_greeting_hk416:  'HK416 reporting! All systems are under control~ 🎯',
    model_greeting_k2:     'K2 here~ Let me keep watch over the system for you! Don\'t worry, I\'m always here! 🌸',
    model_greeting_pkp:    'PKP reporting! Servers are stable — sit back and relax~ 🍵',
    model_greeting_rfb:    'RFB is here! Your systems are in my sights~ Don\'t worry! 🎄',
    model_greeting_lewis:  'Lewis here! I\'ll guard everything for you — just leave it to me~ 🌼',
    model_greeting_dsr50:  'DSR-50 ready! Nothing will slip past my observation~ Systems are safe! 🔭',
    model_greeting_gelina: 'Gelina reporting! All sensors connected — starting surveillance now! ⚙️',
    // ── Card description ──
    card_description: 'SysDesk — Server & network monitoring assistant with Live2D Girls Frontline',
    // ── server_warn messages ──
    msg_warn_cpu: [
      '⚠️ {n}, {c} just detected {label} CPU running at {v}%! Is any process hogging resources abnormally? Check task manager and see what\'s going on~',
      '🔥 {c} reports: {label} CPU is at {v}% — warning threshold exceeded! If this continues, the system may slow down or freeze, {n}. Check it now!',
      '⚠️ Heads up {n}! {label} CPU is climbing to {v}%. {c} suspects a cron job or background backup — check the logs and see~',
    ],
    msg_warn_ram: [
      '⚠️ {n}, {label} RAM has hit {v}%! Memory usage is higher than normal — watch out for disk swapping which would slow things way down. Check if any process is leaking memory~',
      '💾 {c} detected {label} RAM at {v}% — above safe threshold, {n}! If it climbs further it\'s dangerous. Restart unnecessary services to free up memory~',
      '⚠️ {label} memory usage is at {v}%! {c} recommends {n} check which container is consuming the most RAM and clean things up a bit~',
    ],
    msg_warn_disk: [
      '⚠️ {n}, {label} disk is at {v}%! If it fills completely, logs can\'t be written and services may crash. Clean up old files or expand storage soon~',
      '💿 {c} alert: {label} disk at {v}% — running out of space! {n} check which directory is taking the most, rm or archive some. Don\'t let it fill up~',
      '⚠️ {label} storage is low — currently at {v}%, {n}! {c} reminds {n} to backup and clean logs regularly for safety~',
    ],
    msg_warn_temp: [
      '🌡️ {n}, {label} CPU is heating up to {v}°C! {c} is worried — check if the cooling fan is still working, and whether thermal paste needs replacing. Prolonged overheating affects component lifespan~',
      '♨️ {c} detected {label} CPU temperature at {v}°C — warning threshold exceeded! Is the server room well ventilated, {n}? Check airflow in the case, don\'t let it get hotter~',
      '🌡️ {label} CPU is running at {v}°C, {n}! {c} recommends checking fan speeds in BIOS or iDRAC — if fans haven\'t spun up, intervene immediately~',
    ],
    msg_warn_disk_temp: [
      '🌡️ {n}, {label} drive is warming up to {v}°C! HDDs are typically safe below 45°C — check airflow in the rack or server case for blockages~',
      '🔥 {c} sees {label} drive temperature at {v}°C — a bit high, {n}! Heat can affect drive lifespan and read/write speed. Check case fans and ensure cables aren\'t blocking airflow~',
      '🌡️ {label} drive is running at {v}°C, {n}! {c} reminds {n} to monitor S.M.A.R.T data on this drive — if reallocated sectors increase, backup immediately~',
    ],
    // ── server_crit messages ──
    msg_crit_cpu: [
      '🚨 CRITICAL! {n}, {label} CPU is at {v}% — SEVERE OVERLOAD! The system may become unresponsive at any moment! Kill the CPU-hogging process now, don\'t hesitate!',
      '🆘 {c} emergency alert: {label} CPU spiked to {v}%! This is dangerous, load average is very high. {n} check for attacks or runaway processes — restart services if needed!',
      '🚨 Red alert! {label} CPU at {v}% — {c} can\'t ignore this! {n} must intervene right now! SSH into the server, run top or htop to identify the culprit process!',
    ],
    msg_crit_ram: [
      '🚨 CRITICAL! {label} RAM has reached {v}% — NEARLY OUT OF MEMORY, {n}! System is swapping heavily, performance is extremely poor! Shut down services or restart before OOM killer kills processes randomly!',
      '🆘 {c} red alert: {label} RAM at {v}%! If not resolved, kernel OOM killer will randomly kill processes — extremely dangerous for databases! Handle it now, {n}!',
      '🚨 Danger! {label} memory at {v}% — {c} urges {n} to add swap or shut down unnecessary containers/services immediately. Don\'t let OOM crash the system!',
    ],
    msg_crit_disk: [
      '🚨 DISK FULL! {label} disk at {v}% — EXTREMELY DANGEROUS, {n}! When 100% full, logs can\'t be written, databases may corrupt, services will crash en masse! Delete or move data RIGHT NOW!',
      '🆘 {c} urgent alert: {label} disk at {v}% — NEARLY FULL! {n}, run du -sh /* to find the biggest directories and clean up! Old logs, unused docker images, stale backups — delete them all!',
      '🚨 Red alert! {label} storage nearly bottomed out at {v}% — {n} don\'t let the drive fill up, risk of data loss and service crash is very high. {c} demands immediate action!',
    ],
    msg_crit_temp: [
      '🚨 CRITICAL OVERHEAT! {label} CPU at {v}°C — IMMEDIATE HARDWARE DAMAGE RISK! {n}, shut down or reduce load on this server NOW, check if fans are jammed! Prolonged high temps will destroy the CPU chip permanently!',
      '🆘 EMERGENCY! {label} CPU at {v}°C — ENTERED THE RED ZONE! {n}, CPU will throttle hard to protect itself or shut down unexpectedly! Act now: check fans, airflow, and reduce load immediately!',
      '🚨 {label} at {v}°C — DANGEROUSLY HOT! {c} demands {n} shut down heavy workloads immediately! If temps don\'t drop in a few minutes, consider a controlled shutdown to prevent hardware damage!',
    ],
    msg_crit_disk_temp: [
      '🚨 CRITICAL! {label} drive at {v}°C — SEVERE OVERHEAT! {n}, HDD at this temperature is extremely prone to failure and data loss! BACKUP IMMEDIATELY before it\'s too late! Then check cooling systems!',
      '🆘 {label} drive at {v}°C — EXTREME RISK OF DRIVE FAILURE! {n}, at this temperature the drive can fail anytime! Stop writing new data, emergency backup to another drive, and check case fans now!',
      '🚨 {label} drive temperature spiked to {v}°C — STOP SYSTEM FOR INSPECTION! {c} warns {n} that this drive\'s S.M.A.R.T status is very poor! Backup data and prepare a replacement drive now!',
    ],
    // ── service_down messages ──
    msg_service_down: [
      '🔴 {n}, {c} detected {label} just lost connection or went down! The service is not responding — check if it crashed or is in a restart loop. Service logs are usually in journalctl or the {label} dashboard~',
      '⚠️ {c} warning: {label} is currently unavailable! This may affect devices or services that depend on it. {n} check immediately — could be a power loss, firmware update, or config error~',
      '🚨 {label} is offline, {n}! {c} can no longer reach this device. If this is a WiFi AP or critical switch, clients connected through it may have lost network access — restore it quickly!',
      '🔴 Alert: {label} is no longer responding! {c} has checked but the status is still down. {n} reboot the device or check physical connections — might just need a restart to fix it!',
    ],
    // ── idle messages ──
    msg_idle_ump45: [
      '{n}, UMP45 is monitoring all systems 24/7~ 🔫',
      'Every sensor is under UMP45\'s watchful eye! {n} work without worry~',
      '{n}, if anything looks off UMP45 will report immediately! 👁️🔫',
      'UMP45 is scanning all servers and networks... Everything is under control! ✅',
      '{n}, remember to back up data regularly! UMP45 is reminding you~ 💾🔫',
      'Nothing gets past UMP45, {n}! Network is stable~ 📡',
    ],
    msg_idle_m4a1: [
      'M4A1 is analyzing system status... Everything is normal~ 🛡️',
      '{n}, M4A1 reports: all servers are operating stably~ ✅',
      'M4A1 finished checking — no alerts are currently active! 🛡️',
      'System monitoring mission — M4A1 will complete it to the best! Trust me, {n}? 💪',
      '{n}, system uptime is good! M4A1 is on watch 24/7~ 🎯',
      'M4A1 reminds {n}: regular firmware updates are important! 🛡️',
    ],
    msg_idle_sopmod: [
      'SOPMOD is watching all sensors! I\'ll catch any anomaly instantly~ 🔥',
      '{n}, SOPMOD loves a house full of servers, like a training ground! 💥',
      'Yeahhh! All systems are OK! SOPMOD has nothing to report~ 🔥',
      '{n}, don\'t worry! SOPMOD watches the system closely, nothing gets through! 🔥',
      'SOPMOD finished scanning the network — nothing abnormal at all! {n} rest easy~ 💥',
      '{n}, SOPMOD missed you~ But more importantly the servers are still fine! 🥳',
    ],
    msg_idle_hk416: [
      'HK416 reports: all systems within control parameters! 🎯',
      '{n}, HK416 just completed a check cycle — no anomalies detected~ ✅',
      'Discipline and continuous monitoring — that\'s HK416\'s style! {n} rest easy~ 🎯',
      'HK416 is monitoring CPU/RAM/Network in real time! {n} can keep working~ 🎯',
      '{n}, HK416 reminds: don\'t let disk usage exceed 80%! Regular maintenance matters~ 🎯',
      "Nothing gets past HK416 — {n}'s systems are looking great! 💪",
    ],
    sensor_groups: { ha: '🏠 Home Assistant', pfsense: '🔒 pfSense', frigate: '📷 Frigate (VM 200)', nas: '💽 NAS' },
  },
};

// ── Helper: get translated string ──────────────────────────────
function _t(key, ...args) {
  const lang = _sdGetLang();
  const dict = SD_I18N[lang] || SD_I18N['vi'];
  const val  = dict[key];
  if (typeof val === 'function') return val(...args);
  return val ?? (SD_I18N['vi'][key] ?? key);
}

// ── Read current lang (runtime, not compile-time) ──────────────
function _sdGetLang() {
  try { return localStorage.getItem('sd_lang') || 'vi'; } catch(e) { return 'vi'; }
}

// ─── Models ──────────────────────────────────────────────────
const SD_MODELS = [
  // hOffset: px dương → dịch nhân vật sang phải, âm → sang trái (so với vị trí mặc định bên phải card)
  // vOffset: px âm    → kéo nhân vật lên (cắt phần chân), dương → hạ xuống
  { name:'UMP45 🔫',
    path:'https://raw.githubusercontent.com/zenghongtu/live2d-model-assets/master/assets/moc/girls-frontline/UMP45-2/normal/model.json',
    greeting:_t('model_greeting_ump45'), hasSound:false, scale:0.8, vOffset:-30, hOffset:60 },
  { name:'M4A1 🛡️',
    path:'https://raw.githubusercontent.com/zenghongtu/live2d-model-assets/master/assets/moc/girls-frontline/M4A1-1/normal/model.json',
    greeting:_t('model_greeting_m4a1'), hasSound:false, scale:1.2, vOffset:0, hOffset:20 },
  { name:'SOPMOD-II 🔥',
    path:'https://raw.githubusercontent.com/zenghongtu/live2d-model-assets/master/assets/moc/girls-frontline/M4-SOPMOD-II-1/normal/model.json',
    greeting:_t('model_greeting_sopmod'), hasSound:false, scale:1.0, vOffset:0, hOffset:50 },
  { name:'HK416 🎯',
    path:'https://raw.githubusercontent.com/zenghongtu/live2d-model-assets/master/assets/moc/girls-frontline/HK416-1/normal/model.json',
    greeting:_t('model_greeting_hk416'), hasSound:false, scale:0.9, vOffset:-20, hOffset:10 },
  { name:'K2 🌸',
    path:'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/k2_3301/model.json',
    greeting:_t('model_greeting_k2'), hasSound:false, scale:1.0, vOffset:0, hOffset:30 },
  { name:'PKP 🍵',
    path:'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/pkp_1201/model.json',
    greeting:_t('model_greeting_pkp'), hasSound:false, scale:0.9, vOffset:0, hOffset:20 },
  { name:'RFB 🎄',
    path:'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/rfb_1601/model.json',
    greeting:_t('model_greeting_rfb'), hasSound:false, scale:0.8, vOffset:0, hOffset:20 },
  { name:'Lewis 🌼',
    path:'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/lewis_3502/model.json',
    greeting:_t('model_greeting_lewis'), hasSound:false, scale:0.8, vOffset:0, hOffset:30 },
  { name:'DSR-50 🔭',
    path:'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/dsr50_1801/model.json',
    greeting:_t('model_greeting_dsr50'), hasSound:false, scale:0.95, vOffset:0, hOffset:20 },
  { name:'Gelina ⚙️',
    path:'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/gelina/model.json',
    greeting:_t('model_greeting_gelina'), hasSound:false, scale:1.0, vOffset:0, hOffset:20 },
];

// ─── Ngưỡng cảnh báo ─────────────────────────────────────────
// Thresholds raised vs. upstream defaults (warn:70/crit:85 CPU temp, warn:40/crit:55 HDD temp)
// because under sustained homelab load: CPU temps 75-85°C and HDD temps 50-60°C are normal,
// not "warnings". User can override via card config (e.g., thresholds: { temp: { warn: ... }})
// if their cooling differs.
const SD_THRESHOLDS = {
  cpu:       { warn: 70,  crit: 90  },  // %
  ram:       { warn: 75,  crit: 90  },  // %
  disk:      { warn: 70,  crit: 85  },  // %
  temp:      { warn: 85,  crit: 95  },  // °C CPU — raised from 70/85
  disk_temp: { warn: 60,  crit: 70  },  // °C drive — raised from 40/55
};

// ─── Danh sách server sensors mặc định ───────────────────────
const SD_SERVER_SENSORS = {
  ha: [
    { key:'ha_cpu',       entity:'sensor.system_monitor_processor_use',            type:'cpu',       label:'HA CPU'        },
    { key:'ha_disk',      entity:'sensor.system_monitor_disk_usage',               type:'disk',      label:'HA Disk'       },
    { key:'ha_ram',       entity:'sensor.system_monitor_memory_usage',             type:'ram',       label:'HA RAM'        },
    { key:'ha_temp',      entity:'sensor.system_monitor_processor_temperature',    type:'temp',      label:'HA CPU Temp'   },
  ],
  pfsense: [
    { key:'pf_cpu',       entity:'sensor.pfsense_cpu_usage',                       type:'cpu',       label:'pfSense CPU'   },
    { key:'pf_ram',       entity:'sensor.pfsense_memory_used',                     type:'ram',       label:'pfSense RAM'   },
  ],
  frigate: [
    { key:'fri_cpu',      entity:'sensor.frigate_200_cpu_used',                    type:'cpu',       label:'Frigate CPU'   },
    { key:'fri_ram',      entity:'sensor.qemu_frigate_200_memory_used_percentage', type:'ram',       label:'Frigate RAM'   },
  ],
  nas: [
    { key:'nas_cpu',      entity:'sensor.nas_cpu',                                 type:'cpu',       label:'NAS CPU'       },
    { key:'nas_ram',      entity:'sensor.nas_memory',                              type:'ram',       label:'NAS RAM'       },
    { key:'nas_disk_temp',entity:'sensor.data_drive_1_temperature',                type:'disk_temp', label:'NAS Drive Temp'},
  ],
};
const SD_ALL_SENSORS = Object.values(SD_SERVER_SENSORS).flat();

// ─── Các dịch vụ / AP cần theo dõi trạng thái ────────────────
// Default list giữ tối thiểu (chỉ adguard); người dùng tự thêm wifi/AP qua `custom_services`
// trong card config để tránh "DOWN" warnings nếu entity không tồn tại.
const SD_SERVICES = [
  { key:'adguard', entity:'switch.adguard_home_protection', label:'AdGuard' },
  // { key:'wifi_5',  entity:'sensor.5_office_state',   label:'WiFi Office'  },
  // { key:'wifi_6',  entity:'sensor.6_living_state',   label:'WiFi Living'  },
  // { key:'wifi_7',  entity:'sensor.7_kitchen_state',  label:'WiFi Kitchen' },
  // { key:'wifi_8',  entity:'sensor.8_garage_state',   label:'WiFi Garage'  },
  // { key:'wifi_9',  entity:'sensor.9_outside_state',  label:'WiFi Outside' },
  // { key:'nano_hd', entity:'sensor.nano_hd_state',    label:'Nano HD AP'   },
];

// ─── Pool tin nhắn cảnh báo (i18n-aware getter) ─────────────────
function SD_MSGS() {
  return {
    server_warn: {
      cpu:       _t('msg_warn_cpu'),
      ram:       _t('msg_warn_ram'),
      disk:      _t('msg_warn_disk'),
      temp:      _t('msg_warn_temp'),
      disk_temp: _t('msg_warn_disk_temp'),
    },
    server_crit: {
      cpu:       _t('msg_crit_cpu'),
      ram:       _t('msg_crit_ram'),
      disk:      _t('msg_crit_disk'),
      temp:      _t('msg_crit_temp'),
      disk_temp: _t('msg_crit_disk_temp'),
    },
    service_down: _t('msg_service_down'),
    idle: {
      'UMP45 🔫':    _t('msg_idle_ump45'),
      'M4A1 🛡️':    _t('msg_idle_m4a1'),
      'SOPMOD-II 🔥':_t('msg_idle_sopmod'),
      'HK416 🎯':    _t('msg_idle_hk416'),
    },
  };
}

// ─── Live2D scripts (pixi-live2d-display) — lazy-loaded once globally ──────
// Replaces iframe + L2Dwidget approach. Renders directly to a canvas in the host
// document so HA view-cache reattach preserves WebGL state without remount tricks.
const SD_LIVE2D_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js',
  'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js',
  'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism2.min.js',
];
function sdEnsureLive2DScripts() {
  if (window.__sdLive2DReady) return Promise.resolve();
  if (window.__sdLive2DPromise) return window.__sdLive2DPromise;
  window.__sdLive2DPromise = SD_LIVE2D_SCRIPTS.reduce((p, src) => p.then(() => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload  = res;
    s.onerror = () => rej(new Error('[sysdesk] failed to load: ' + src));
    document.head.appendChild(s);
  })), Promise.resolve()).then(() => {
    window.__sdLive2DReady = true;
    if (!window.PIXI) window.PIXI = window.PIXI; // exposed by pixi.js browser bundle
  });
  return window.__sdLive2DPromise;
}

// ─── Float overlay CSS ────────────────────────────────────────
const SD_FLOAT_CSS = `
#sd-float-overlay{position:fixed;bottom:0;right:16px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;}
#_sd_float_bubble{pointer-events:none;margin-bottom:8px;margin-right:10px;max-width:220px;padding:10px 14px;
  background:rgba(10,20,40,0.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(80,160,255,0.45);border-radius:10px;font-size:12px;color:#c8e8ff;
  line-height:1.5;box-shadow:0 4px 20px rgba(0,0,0,0.4);opacity:0;transition:opacity 0.35s;word-break:break-word;text-shadow:0 1px 3px rgba(0,0,0,0.6);}
#_sd_float_bubble.show{opacity:1;}
#sd-float-controls{pointer-events:all;display:flex;gap:5px;margin-bottom:4px;margin-right:8px;}
.sd-fbtn{background:rgba(20,40,80,0.7);backdrop-filter:blur(8px);border:1px solid rgba(80,160,255,0.4);
  border-radius:20px;padding:4px 11px;color:#90c8ff;font-size:11px;cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.1);
  transition:all 0.2s;font-family:'Segoe UI',sans-serif;font-weight:500;}
.sd-fbtn:hover{background:rgba(30,70,140,0.8);transform:translateY(-1px);}
.sd-fbtn.restore{border-color:rgba(100,220,140,0.5);color:#a0ffb8;}
#sd-float-char{pointer-events:all;cursor:pointer;filter:drop-shadow(0 8px 24px rgba(40,80,200,0.5));transition:transform 0.25s;position:relative;}
#sd-float-char:hover{transform:scale(1.05) translateY(-6px);}
#sd-float-char iframe{border:none;background:transparent;display:block;pointer-events:none;}
#_sd_float_chat{
  pointer-events:none;position:absolute;
  bottom:68%;left:8px;width:160px;opacity:0;
  transform:scale(0.85) translateX(-6px);transform-origin:left center;
  transition:opacity 0.3s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1);z-index:10;}
#_sd_float_chat.show{opacity:1;transform:scale(1) translateX(0);}
#_sd_float_chat_inner{position:relative;padding:8px 10px;
  background:rgba(10,20,50,0.92);border:1.5px solid rgba(80,160,255,0.6);
  border-radius:10px;font-size:11px;color:#b8d8ff;font-weight:600;line-height:1.5;
  box-shadow:0 4px 20px rgba(20,60,180,0.3),inset 0 1px 0 rgba(255,255,255,0.05);
  word-break:break-word;font-family:'Segoe UI',sans-serif;}
#_sd_float_chat_inner::after{content:'';position:absolute;top:50%;right:-18px;transform:translateY(-50%);
  border:9px solid transparent;border-left-color:rgba(80,160,255,0.6);border-right:none;}
#_sd_float_chat_inner::before{content:'';position:absolute;top:50%;right:-15px;transform:translateY(-50%);
  border:7px solid transparent;border-left-color:rgba(10,20,50,0.92);border-right:none;z-index:1;}
`;

// ─── Pin overlay CSS ──────────────────────────────────────────
const SD_PIN_CSS = `
#sd-pin-overlay{position:fixed;bottom:0;right:16px;z-index:2147483646;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;}
#sd-pin-controls{pointer-events:all;display:flex;gap:5px;margin-bottom:4px;margin-right:8px;}
.sd-pin-btn{background:rgba(20,40,80,0.7);backdrop-filter:blur(8px);border:1px solid rgba(80,160,255,0.4);
  border-radius:20px;padding:4px 11px;color:#90c8ff;font-size:11px;cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:all 0.2s;font-family:'Segoe UI',sans-serif;font-weight:500;}
.sd-pin-btn:hover{background:rgba(30,70,140,0.8);transform:translateY(-1px);}
.sd-pin-btn.unpin{border-color:rgba(255,180,80,0.6);color:#ffe0a0;}
#sd-pin-char{pointer-events:all;cursor:pointer;filter:drop-shadow(0 8px 24px rgba(40,80,200,0.5));transition:transform 0.25s;position:relative;}
#sd-pin-char:hover{transform:scale(1.05) translateY(-6px);}
#sd-pin-char iframe{border:none;background:transparent;display:block;pointer-events:none;}
#_sd_pin_chat{
  pointer-events:none;position:absolute;
  bottom:68%;left:8px;width:160px;opacity:0;
  transform:scale(0.85) translateX(-6px);transform-origin:left center;
  transition:opacity 0.3s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1);z-index:10;}
#_sd_pin_chat.show{opacity:1;transform:scale(1) translateX(0);}
#_sd_pin_chat_inner{position:relative;padding:8px 10px;
  background:rgba(10,20,50,0.92);border:1.5px solid rgba(80,160,255,0.6);
  border-radius:10px;font-size:11px;color:#b8d8ff;font-weight:600;line-height:1.5;
  box-shadow:0 4px 20px rgba(20,60,180,0.3);word-break:break-word;font-family:'Segoe UI',sans-serif;}
#_sd_pin_chat_inner::after{content:'';position:absolute;top:50%;right:-18px;transform:translateY(-50%);
  border:9px solid transparent;border-left-color:rgba(80,160,255,0.6);border-right:none;}
#_sd_pin_chat_inner::before{content:'';position:absolute;top:50%;right:-15px;transform:translateY(-50%);
  border:7px solid transparent;border-left-color:rgba(10,20,50,0.92);border-right:none;z-index:1;}
`;

// ─── Card template (i18n-aware) ──────────────────────────────
function sdCardTemplate() {
  return `
<style>
  :host{display:block;}
  /* Config-driven UI hiding (set on host BEFORE innerHTML for first-paint correctness). */
  :host([data-always-pinned]) .sd-card{display:none !important;}
  :host([data-hide-toolbar]) .sd-toolbar{display:none !important;}
  :host([data-hide-toolbar]) .sd-wbtn{display:none !important;}

  .sd-card{
    background:transparent;
    backdrop-filter:none;-webkit-backdrop-filter:none;
    border-radius:22px;
    border:1px solid rgba(80,160,255,0.22);
    overflow:visible;position:relative;
    font-family:'Segoe UI',sans-serif;
    box-shadow:0 8px 32px rgba(10,30,100,0.28);
    padding:0;
  }

  .waifu-area{
    display:flex;align-items:flex-start;justify-content:flex-end;
    position:relative;overflow:visible;
    padding:0;margin:0;
    background:transparent;
  }

  /* ── Status indicator — góc trên trái, hover mở dropdown xuống ── */
  #sd-status-badge{
    position:absolute;top:10px;left:10px;z-index:30;
    pointer-events:auto;
    user-select:none;
  }
  /* Pill indicator — luôn hiển thị */
  #sd-badge-pill{
    display:inline-flex;align-items:center;gap:5px;
    padding:4px 10px 4px 8px;
    background:rgba(10,18,45,0.85);
    backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    border:1px solid rgba(80,160,255,0.35);
    border-radius:20px;
    font-size:10.5px;font-weight:700;color:#90c8ff;
    cursor:default;
    box-shadow:0 2px 10px rgba(0,0,0,0.35);
    transition:border-color 0.25s,color 0.25s;
    white-space:nowrap;
  }
  #sd-badge-pill.has-crit{border-color:rgba(255,80,80,0.7);color:#ffb0b0;animation:sd-pulse 1.2s infinite;}
  #sd-badge-pill.has-warn{border-color:rgba(255,200,60,0.6);color:#ffe090;}
  #sd-badge-pill.all-ok  {border-color:rgba(60,220,120,0.5);color:#a0ffcc;}
  #sd-badge-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;background:#a0ffcc;transition:background 0.25s;}
  #sd-badge-pill.has-crit #sd-badge-dot{background:#ff6060;}
  #sd-badge-pill.has-warn #sd-badge-dot{background:#ffd040;}
  /* Dropdown — ẩn mặc định, hiện khi hover vào #sd-status-badge */
  #sd-badge-dropdown{
    position:absolute;top:calc(100% + 5px);left:0;
    min-width:200px;max-width:240px;
    background:rgba(10,18,45,0.92);
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(80,160,255,0.38);
    border-radius:10px;
    padding:5px 6px;
    display:flex;flex-direction:column;gap:3px;
    max-height:220px;overflow-y:auto;overflow-x:hidden;
    scrollbar-width:thin;scrollbar-color:rgba(80,160,255,0.35) transparent;
    box-shadow:0 8px 24px rgba(0,0,0,0.45);
    opacity:0;pointer-events:none;
    transform:translateY(-6px);
    transition:opacity 0.2s ease,transform 0.2s ease;
    z-index:31;
  }
  #sd-badge-dropdown::-webkit-scrollbar{width:3px;}
  #sd-badge-dropdown::-webkit-scrollbar-track{background:transparent;}
  #sd-badge-dropdown::-webkit-scrollbar-thumb{background:rgba(80,160,255,0.4);border-radius:2px;}
  #sd-status-badge:hover #sd-badge-dropdown{
    opacity:1;pointer-events:auto;transform:translateY(0);
  }
  .sd-badge-row{
    display:flex;align-items:center;gap:5px;
    padding:3px 8px;border-radius:12px;
    border:1px solid rgba(80,160,255,0.22);
    font-size:10px;color:#90c8ff;font-weight:600;
    white-space:nowrap;flex-shrink:0;
    background:rgba(255,255,255,0.03);
  }
  .sd-badge-row.warn{border-color:rgba(255,200,60,0.45);color:#ffe090;background:rgba(255,200,60,0.06);}
  .sd-badge-row.crit{border-color:rgba(255,80,80,0.5);color:#ffb0b0;background:rgba(255,80,80,0.08);animation:sd-pulse 1.2s infinite;}
  .sd-badge-row.ok  {border-color:rgba(60,220,120,0.35);color:#a0ffcc;background:rgba(60,220,120,0.06);}
  .sd-badge-row.down{border-color:rgba(255,80,80,0.5);color:#ffb0b0;background:rgba(255,80,80,0.08);}
  @keyframes sd-pulse{0%,100%{opacity:1}50%{opacity:0.55}}

  /* Bubble — bên trái nhân vật */
  #sd-bubble-wrap{
    position:absolute;bottom:68%;left:2px;width:37%;max-width:200px;
    z-index:20;pointer-events:none;opacity:0;
    transform:scale(0.85) translateX(-8px);transform-origin:left center;
    transition:opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  #sd-bubble-wrap.show{opacity:1;transform:scale(1) translateX(0);}

  #sd-bubble{
    position:relative;padding:8px 10px;
    background:rgba(8,18,45,0.93);
    border:1.5px solid rgba(80,160,255,0.65);
    border-radius:10px;
    font-size:11px;color:#c0e0ff;font-weight:600;line-height:1.5;
    box-shadow:0 4px 20px rgba(10,40,160,0.35),inset 0 1px 0 rgba(255,255,255,0.06);
    word-break:break-word;
  }
  /* mũi tên sang phải (hướng về nhân vật bên phải) */
  #sd-bubble::after{content:'';position:absolute;top:50%;right:-20px;transform:translateY(-50%);
    border:10px solid transparent;border-left-color:rgba(80,160,255,0.65);border-right:none;}
  #sd-bubble::before{content:'';position:absolute;top:50%;right:-17px;transform:translateY(-50%);
    border:8px solid transparent;border-left-color:rgba(8,18,45,0.93);border-right:none;z-index:1;}

  .model-label{
    position:absolute;bottom:46px;right:10px;
    font-size:9px;color:rgba(100,180,255,0.5);
    z-index:3;pointer-events:none;
    text-shadow:0 1px 3px rgba(0,0,0,0.6);
  }

  #sd-l2d-canvas{display:block;background:transparent;z-index:2;flex-shrink:0;}

  .sd-card-inner{
    border-radius:22px;
    overflow:hidden;
  }
  .sd-win-controls{
    position:absolute;top:8px;right:10px;z-index:50;
    display:flex;gap:5px;align-items:center;
  }
  .sd-wbtn{
    position:relative;
    width:22px;height:22px;
    border-radius:50%;
    border:1px solid rgba(255,255,255,0.18);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    transition:all 0.15s ease;
    /* Glassmorphism */
    background:rgba(255,255,255,0.08);
    box-shadow:0 2px 8px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.15);
  }
  .sd-wbtn svg{width:10px;height:10px;flex-shrink:0;transition:opacity 0.15s;}
  .sd-wbtn-label{
    position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);
    background:rgba(8,18,45,0.92);backdrop-filter:blur(10px);
    border:1px solid rgba(80,160,255,0.35);border-radius:6px;
    padding:2px 7px;font-size:9.5px;font-weight:600;white-space:nowrap;
    pointer-events:none;opacity:0;transition:opacity 0.15s;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  }
  .sd-wbtn:hover .sd-wbtn-label{opacity:1;}
  /* Màu từng nút */
  .sd-wbtn--mini{color:#ffd060;background:rgba(255,208,96,0.12);border-color:rgba(255,208,96,0.35);}
  .sd-wbtn--mini .sd-wbtn-label{color:#ffd060;}
  .sd-wbtn--mini:hover{background:rgba(255,208,96,0.28);border-color:rgba(255,208,96,0.7);box-shadow:0 2px 12px rgba(255,200,60,0.35),inset 0 1px 0 rgba(255,255,255,0.2);}
  .sd-wbtn--pin{color:#60d4ff;background:rgba(96,212,255,0.1);border-color:rgba(96,212,255,0.35);}
  .sd-wbtn--pin .sd-wbtn-label{color:#60d4ff;}
  .sd-wbtn--pin:hover{background:rgba(96,212,255,0.25);border-color:rgba(96,212,255,0.7);box-shadow:0 2px 12px rgba(60,180,255,0.35),inset 0 1px 0 rgba(255,255,255,0.2);}
  .sd-wbtn--hide{color:#ff6b6b;background:rgba(255,107,107,0.1);border-color:rgba(255,107,107,0.35);}
  .sd-wbtn--hide .sd-wbtn-label{color:#ff6b6b;}
  .sd-wbtn--hide:hover{background:rgba(255,107,107,0.28);border-color:rgba(255,107,107,0.7);box-shadow:0 2px 12px rgba(255,80,80,0.35),inset 0 1px 0 rgba(255,255,255,0.2);}
  /* 3D press effect */
  .sd-wbtn:active{
    transform:scale(0.88) translateY(1px);
    box-shadow:0 1px 3px rgba(0,0,0,0.5),inset 0 2px 4px rgba(0,0,0,0.3),inset 0 1px 0 rgba(0,0,0,0.1);
    filter:brightness(0.88);
  }
  /* Pinned state */
  .sd-wbtn--pin.active{background:rgba(96,212,255,0.32);border-color:rgba(96,212,255,0.8);color:#a0eeff;}

  /* Toolbar */
  .sd-toolbar{
    display:flex;gap:4px;padding:6px 8px 8px;
    justify-content:center;flex-wrap:nowrap;
    background:rgba(10,25,60,0.45);
    border-top:1px solid rgba(80,160,255,0.15);
  }
  .sd-btn{
    /* Glassmorphism trong suốt kính mờ */
    background:rgba(255,255,255,0.06);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,0.14);
    border-radius:20px;padding:4px 9px;
    font-size:10.5px;color:#90c8ff;cursor:pointer;
    font-weight:600;white-space:nowrap;
    display:flex;align-items:center;gap:3px;
    transition:all 0.18s ease;flex-shrink:0;
    box-shadow:0 2px 10px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.15),inset 0 -1px 0 rgba(0,0,0,0.12);
    text-shadow:0 1px 3px rgba(0,0,0,0.5);
    /* Subtle top highlight for 3D feel */
    position:relative;overflow:hidden;
  }
  .sd-btn::before{
    content:'';position:absolute;top:0;left:0;right:0;height:50%;
    background:linear-gradient(to bottom,rgba(255,255,255,0.1),transparent);
    border-radius:20px 20px 0 0;pointer-events:none;
  }
  .sd-btn:hover{
    background:rgba(80,160,255,0.18);
    border-color:rgba(80,160,255,0.45);
    transform:translateY(-2px);
    box-shadow:0 5px 16px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.2);
    color:#c0e4ff;
  }
  /* 3D press effect */
  .sd-btn:active{
    transform:translateY(1px) scale(0.97);
    box-shadow:0 1px 4px rgba(0,0,0,0.5),inset 0 3px 6px rgba(0,0,0,0.25),inset 0 1px 0 rgba(0,0,0,0.1);
    background:rgba(80,160,255,0.1);
    filter:brightness(0.9);
    transition:all 0.06s ease;
  }
  .sd-btn.green{border-color:rgba(60,220,120,0.3);color:#a0ffcc;background:rgba(60,220,120,0.06);}
  .sd-btn.green:hover{background:rgba(60,220,120,0.18);border-color:rgba(60,220,120,0.55);}
  .sd-btn.red{border-color:rgba(255,80,80,0.3);color:#ffb0b0;background:rgba(255,80,80,0.06);}
  .sd-btn.red:hover{background:rgba(255,80,80,0.18);border-color:rgba(255,80,80,0.55);}
  .sd-btn.amber{border-color:rgba(255,200,60,0.3);color:#ffe090;background:rgba(255,200,60,0.06);}
  .sd-btn.amber:hover{background:rgba(255,200,60,0.18);border-color:rgba(255,200,60,0.55);}
</style>

<div class="sd-card" id="sdCard">
  <div class="sd-win-controls">
    <button class="sd-wbtn sd-wbtn--mini" id="sdBtnMini" title="${_t('btn_mini')}">
      <svg viewBox="0 0 14 14" fill="none"><rect x="2" y="6.5" width="10" height="1.5" rx="0.75" fill="currentColor"/></svg>
      <span class="sd-wbtn-label">${_t('btn_mini')}</span>
    </button>
    <button class="sd-wbtn sd-wbtn--pin" id="sdBtnPin" title="${_t('btn_pin')}">
      <svg viewBox="0 0 14 14" fill="none"><path d="M9 2L12 5L8.5 6.5L7 9.5L5.5 8L3 10.5L2.5 11.5L3.5 11L6 8.5L7 10L10 8.5L11.5 5L9 2Z" fill="currentColor"/><line x1="5.5" y1="8" x2="2" y2="11.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      <span class="sd-wbtn-label">${_t('btn_pin')}</span>
    </button>
    <button class="sd-wbtn sd-wbtn--hide" id="sdBtnHide" title="${_t('btn_hide')}">
      <svg viewBox="0 0 14 14" fill="none"><line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="sd-wbtn-label">${_t('btn_hide')}</span>
    </button>
  </div>
  <div class="sd-card-inner">
  <div class="waifu-area" id="sdWaifuArea">
    <div id="sd-status-badge">
      <div id="sd-badge-pill"><span id="sd-badge-dot"></span><span id="sd-badge-label">${_t('badge_checking')}</span></div>
      <div id="sd-badge-dropdown"></div>
    </div>
    <div id="sd-bubble-wrap"><div id="sd-bubble"></div></div>
    <canvas id="sd-l2d-canvas"></canvas>
    <span class="model-label" id="sdModelLabel"></span>
  </div>
  <div class="sd-toolbar">
    <button class="sd-btn" id="sdBtnPrev">${_t('btn_prev')}</button>
    <button class="sd-btn" id="sdBtnNext">${_t('btn_next')}</button>
    <button class="sd-btn" id="sdBtnQuote">${_t('btn_report')}</button>
    <button class="sd-btn" id="sdBtnSound">${_t('btn_tts')}</button>
    <button class="sd-btn" id="sdBtnReload">${_t('btn_reload')}</button>
  </div>
  </div>
</div>
`;}


// ─── Custom Element: SysDesk ──────────────────────────────────
class SysDesk extends HTMLElement {
  constructor() {
    super();
    this._shadow      = this.attachShadow({ mode: 'open' });
    this._hass        = null;
    this._config      = {};
    this._modelIdx    = (() => { try { const s = localStorage.getItem('sd_modelIdx'); return s !== null ? parseInt(s, 10) : 0; } catch(e) { return 0; } })();
    this._lastStates  = {};
    this._statusMsgs  = [];
    this._statusIdx   = 0;
    this._statusInterval  = null;
    this._idleInterval    = null;
    this._tipTimer        = null;
    this._floating    = false;
    this._floatEl     = null;
    this._floatMouseMove  = null;
    this._floatChatInterval = null;
    this._floatChatShow   = null;
    this._floatTipTmr = null;
    this._pinned      = false;
    this._pinEl       = null;
    this._pinMouseMove    = null;
    this._pinChatInterval = null;
    this._pinChatShow     = null;
    this._audio       = null;
    this._ttsUtter    = null;
    this._audioEnabled = true;
    this._msgListener = null;
    this._skipGreetingPush = false;
    // Badge state tracking
    this._badgeState  = {};  // entityId → 'ok'|'warn'|'crit'|'down'
    // Alert TTS loop: bắt đầu khi mới có cảnh báo, lặp đến khi về an toàn
    this._alertTtsKey     = null;   // composite key of the currently looping TTS alert
    this._alertTtsMsg     = null;   // TTS message currently looping
    this._alertTtsTimer   = null;   // setTimeout handle for the loop
    this._alertTtsRunning = false;  // flag: loop is running
  }

  setConfig(config) { this._config = config; this._render(); }

  set hass(hass) {
    this._hass = hass;
    this._updateSensors();
  }

  getCardSize() { return 5; }

  // ── Render ─────────────────────────────────────────────────
  _render() {
    // Set config-driven host attributes BEFORE innerHTML so CSS rules apply on first paint
    // (no flash from runtime style mutation).
    if (this._config.always_pinned) this.setAttribute('data-always-pinned', '');
    else                            this.removeAttribute('data-always-pinned');
    if (this._config.hide_toolbar)  this.setAttribute('data-hide-toolbar', '');
    else                            this.removeAttribute('data-hide-toolbar');
    this._shadow.innerHTML = sdCardTemplate();
    const h = this._config.height || 440;
    const w = this._config.width  || 400;
    this._shadow.querySelector('.waifu-area').style.height = h + 'px';

    // Apply blur
    const _blur = (this._config.card_blur !== undefined) ? Number(this._config.card_blur) : 0;
    const _card = this._shadow.querySelector('.sd-card');
    if (_card) {
      _card.style.setProperty('backdrop-filter',         'blur(' + _blur + 'px)');
      _card.style.setProperty('-webkit-backdrop-filter', 'blur(' + _blur + 'px)');
      if (_blur > 0) {
        const a = +(_blur / 30 * 0.25).toFixed(4);
        _card.style.background = 'rgba(8,18,50,' + a + ')';
      }
    }

    const canvas = this._shadow.getElementById('sd-l2d-canvas');
    canvas.width  = w;
    canvas.height = h;
    const _hOff = SD_MODELS[this._modelIdx].hOffset || 0;
    canvas.style.cssText = 'width:' + w + 'px;height:' + h + 'px;background:transparent;display:block;z-index:2;transition:margin-top 0.3s ease;flex-shrink:0;margin-left:auto;position:relative;left:' + _hOff + 'px;';
    // Skip in-card canvas load when always_pinned: card is hidden via CSS.
    if (!this._config.always_pinned) this._loadCanvas(canvas, this._modelIdx, w, h, false);

    // Toolbar events
    this._shadow.getElementById('sdBtnPrev').onclick   = () => this._switchModelPrev();
    this._shadow.getElementById('sdBtnNext').onclick   = () => this._switchModelNext();
    this._shadow.getElementById('sdBtnQuote').onclick  = () => this._sysQuote();
    this._shadow.getElementById('sdBtnReload').onclick = () => {
      const c = this._shadow.getElementById('sd-l2d-canvas');
      if (c) this._loadCanvas(c, this._modelIdx, w, h, false);
      if (this._floating) {
        const fc = document.getElementById('_sd_float_canvas');
        const fh = this._config.float_height || 600; const fw = this._config.float_width || 380;
        if (fc) this._loadCanvas(fc, this._modelIdx, fw, fh, true);
      }
      if (this._pinned) {
        const pc = document.getElementById('_sd_pin_canvas');
        const fh = this._config.float_height || 600; const fw = this._config.float_width || 380;
        if (pc) this._loadCanvas(pc, this._modelIdx, fw, fh, true);
      }
      this._pushStatus(_t('reload_done', this._cn()), true);
    };
    this._shadow.getElementById('sdBtnMini').onclick   = () => this._enterFloating();
    this._shadow.getElementById('sdBtnPin').onclick    = () => {
      this._togglePin();
      const pinBtn = this._shadow.getElementById('sdBtnPin');
      if (pinBtn) pinBtn.classList.toggle('active', this._pinned);
    };

    const btnSound = this._shadow.getElementById('sdBtnSound');
    btnSound.onclick = () => {
      this._audioEnabled = !this._audioEnabled;
      if (!this._audioEnabled) {
        this._stopAudio();
        btnSound.textContent = _t('btn_tts_off'); btnSound.classList.add('red'); btnSound.classList.remove('green');
      } else {
        btnSound.textContent = _t('btn_tts'); btnSound.classList.remove('red'); btnSound.classList.add('green');
      }
    };

    this._shadow.getElementById('sdBtnHide').onclick   = () => {
      this._pushStatus(_t('hide_msg', this._cn()), true);
      setTimeout(() => { this._shadow.querySelector('.sd-card').style.display = 'none'; }, 1500);
    };

    // Restore states
    try { if (localStorage.getItem('sd_pinned') === '1') {
      const bp = this._shadow.getElementById('sdBtnPin');
      bp.textContent = _t('pin_btn_unpin'); bp.classList.add('green');
    }} catch(e) {}

    // (Iframe clip postMessage listener removed — pixi-live2d-display renders to canvas
    //  directly, no cross-frame messaging needed.)

    if (this._idleInterval) clearInterval(this._idleInterval);
    this._idleInterval = setInterval(() => this._idleQuote(), 50000);
    this._startStatusRotation();
    setTimeout(() => this._greet(), 3000);

    // hide_toolbar + always_pinned now driven by `:host([data-*])` CSS rules set in the
    // attribute block above — no runtime style mutation needed.

    // Pin/float entry handled in connectedCallback (handles first mount + reattach uniformly).
    // Just seed the "wanted" state from config / localStorage so connectedCallback knows what to enter.
    if (this._config.always_pinned) {
      this._wantPinned = true;
    } else {
      try { if (localStorage.getItem('sd_floating') === '1') this._wantFloating = true; } catch(e) {}
      try { if (localStorage.getItem('sd_pinned')   === '1') this._wantPinned   = true; } catch(e) {}
    }
  }

  // ── Load model into canvas via pixi-live2d-display ─────────────────────────
  // Replaces iframe + L2Dwidget approach. Canvas in light DOM (or shadow DOM —
  // pixi accepts a DOM ref directly) survives HA view-cache reattach since the
  // canvas element + its WebGL context are preserved across detach/reattach.
  async _loadCanvas(canvas, idx, w, h, isFloat) {
    const m = SD_MODELS[idx];
    const lbl = this._shadow.getElementById('sdModelLabel');
    if (lbl) lbl.textContent = m.name;

    canvas.width  = w;
    canvas.height = h;

    try {
      await sdEnsureLive2DScripts();
    } catch (e) {
      console.error('[sysdesk]', e);
      return;
    }
    if (!window.PIXI || !window.PIXI.live2d) return;

    // Track + dispose previous app for this canvas slot (model switch / reload).
    const slot = isFloat ? '_pinApp' : '_cardApp';
    if (this[slot]) { try { this[slot].destroy(true, { children: true }); } catch (e) {} this[slot] = null; }

    const app = new window.PIXI.Application({
      view: canvas,
      width: w, height: h,
      backgroundAlpha: 0,
      antialias: true,
      autoStart: true,
    });
    this[slot] = app;

    let model;
    try {
      model = await window.PIXI.live2d.Live2DModel.from(m.path);
    } catch (e) {
      console.error('[sysdesk] model load failed', m.path, e);
      return;
    }
    app.stage.addChild(model);

    // Fit + center: shrink model so it fits inside canvas, then center horizontally.
    const fit = Math.min(w / model.width, h / model.height) * (m.scale || 1);
    model.scale.set(fit);
    model.x = (w - model.width)  / 2;
    model.y = (h - model.height) / 2 + (m.vOffset || 0);

    // Click + dblclick directly on canvas (no postMessage needed across iframe boundary).
    canvas.style.pointerEvents = 'auto';
    canvas.onclick = () => {
      const tips = _t('char_click_tips', this._cn());
      const msg = this._rand(tips);
      if (isFloat) this._floatTip(msg, 3500);
      else         this._pushStatus(msg, true);
      this._playAudio(msg.replace(/[^\p{L}\p{N}\s]/gu, ''));
    };
    canvas.ondblclick = () => {
      if (this._config.enable_modal) { this._openControlModal(); return; }
      if (this._floating) this._exitFloating();
    };

    setTimeout(() => {
      if (this._skipGreetingPush) { this._skipGreetingPush = false; return; }
      this._pushStatus(m.greeting, true);
    }, 2400);
  }

  // ── Helpers: label người dùng đặt / danh sách sensor+service ──

  // Trả về label hiển thị cho 1 sensor/service key (user override > default)
  _getLabel(key, defaultLabel) {
    const labels = this._config.labels || {};
    return labels[key] || defaultLabel;
  }

  // Trả về toàn bộ server sensors (default + custom người dùng thêm)
  // Mỗi phần tử: { key, entity, type, label, group }
  _getEffectiveSensors() {
    // Sensors mặc định với label override
    const defaults = SD_ALL_SENSORS.map(s => ({
      ...s,
      entity: this._config[s.key] || s.entity,
      label:  this._getLabel(s.key, s.label),
    }));

    // Custom sensors người dùng thêm (lưu ở config.custom_sensors)
    const customs = (this._config.custom_sensors || []).map(s => ({
      key:    s.key,
      entity: s.entity || s.key,
      type:   s.type   || 'cpu',
      label:  this._getLabel(s.key, s.label || s.key),
      custom: true,
    }));

    return [...defaults, ...customs];
  }

  // Trả về toàn bộ services (default + custom người dùng thêm)
  _getEffectiveServices() {
    const defaults = SD_SERVICES.map(s => ({
      ...s,
      entity: this._config[s.key] || s.entity,
      label:  this._getLabel(s.key, s.label),
    }));

    const customs = (this._config.custom_services || []).map(s => ({
      key:    s.key,
      entity: s.entity || s.key,
      label:  this._getLabel(s.key, s.label || s.key),
      custom: true,
    }));

    return [...defaults, ...customs];
  }

  // ── Status badge: pill indicator + hover dropdown ──────────
  _updateBadge() {
    const pill     = this._shadow.getElementById('sd-badge-pill');
    const label    = this._shadow.getElementById('sd-badge-label');
    const dropdown = this._shadow.getElementById('sd-badge-dropdown');
    if (!pill || !label || !dropdown || !this._hass) return;

    const rows = [];

    // Server sensors
    for (const s of this._getEffectiveSensors()) {
      const state = this._hass.states[s.entity];
      if (!state) continue;
      const val = parseFloat(state.state);
      if (isNaN(val)) continue;
      const thresh = SD_THRESHOLDS[s.type];
      if (!thresh) continue;
      const unit = s.type.includes('temp') ? '°C' : '%';
      if (val >= thresh.crit)      rows.push({ cls:'crit', text:`🚨 ${s.label}: ${Math.round(val)}${unit}` });
      else if (val >= thresh.warn) rows.push({ cls:'warn', text:`⚠️ ${s.label}: ${Math.round(val)}${unit}` });
    }

    // Services
    for (const svc of this._getEffectiveServices()) {
      const state = this._hass.states[svc.entity];
      const stVal = state?.state;
      const isDown = !stVal || stVal === 'off' || stVal === 'unavailable' || stVal === 'unknown';
      if (isDown) rows.push({ cls:'down', text:`🔴 ${svc.label} DOWN` });
    }

    const critCount = rows.filter(r => r.cls === 'crit').length;
    const warnCount = rows.filter(r => r.cls === 'warn' || r.cls === 'down').length;

    // Cập nhật pill
    pill.classList.remove('has-crit','has-warn','all-ok');
    if (critCount > 0) {
      pill.classList.add('has-crit');
      label.textContent = _t('badge_crit_count', critCount + warnCount);
    } else if (warnCount > 0) {
      pill.classList.add('has-warn');
      label.textContent = _t('badge_warn_count', warnCount);
    } else {
      pill.classList.add('all-ok');
      label.textContent = _t('badge_ok');
    }

    // Cập nhật dropdown
    if (rows.length === 0) {
      dropdown.innerHTML = `<div class="sd-badge-row ok">${_t('badge_all_ok')}</div>`;
    } else {
      dropdown.innerHTML = rows.map(r =>
        `<div class="sd-badge-row ${r.cls}">${r.text}</div>`
      ).join('');
    }
  }

  // ── Update sensors & fire alerts ───────────────────────────
  _updateSensors() {
    if (!this._hass) return;

    // Lần đầu tiên chạy: pre-populate _lastStates từ giá trị thực hiện tại
    // để tránh false alert ngay khi load (prev=0 → trigger warn sai)
    if (!this._lastStatesInited) {
      this._lastStatesInited = true;
      this._saveStates();
      return; // Skip first run, check diff on next update
    }

    const name = this._config.name || 'admin';
    let alertMsg  = null;
    let alertMs   = 6000;
    let alertKey  = null;   // composite key to identify which alert is currently active

    const fmtMsg = (pool, label, val) => {
      const tpl = pool[Math.floor(Math.random() * pool.length)];
      return tpl
        .replace('{label}', label).replace('{v}', val)
        .replace('{n}', name).replace('{c}', this._cn());
    };

    // ── Server sensor thresholds ──────────────────────────────
    for (const s of this._getEffectiveSensors()) {
      const state = this._hass.states[s.entity];
      if (!state) continue;
      const raw  = parseFloat(state.state);
      if (isNaN(raw)) continue;
      const thresh = SD_THRESHOLDS[s.type];
      if (!thresh) continue;

      const prev     = parseFloat(this._lastStates[s.entity] || 0);
      const nowCrit  = raw  >= thresh.crit;
      const prevCrit = prev >= thresh.crit;
      const nowWarn  = raw  >= thresh.warn;
      const prevWarn = prev >= thresh.warn;

      if (nowCrit && !prevCrit) {
        const pool = SD_MSGS().server_crit[s.type] || SD_MSGS().server_warn[s.type];
        if (pool) {
          alertMsg = fmtMsg(pool, s.label, Math.round(raw));
          alertKey = s.key + '_crit';
          alertMs  = 8000;
          break;
        }
      } else if (nowWarn && !prevWarn && !alertMsg) {
        const pool = SD_MSGS().server_warn[s.type];
        if (pool) {
          alertMsg = fmtMsg(pool, s.label, Math.round(raw));
          alertKey = s.key + '_warn';
          alertMs  = 6000;
        }
      }
    }

    // ── Service down alerts ───────────────────────────────────
    for (const svc of this._getEffectiveServices()) {
      const state = this._hass.states[svc.entity];
      const stVal  = state?.state;
      const prevVal = this._lastStates[svc.entity];
      const isDown  = !stVal || stVal === 'off' || stVal === 'unavailable' || stVal === 'unknown';
      const wasDown = !prevVal || prevVal === 'off' || prevVal === 'unavailable' || prevVal === 'unknown';
      if (isDown && !wasDown && !alertMsg) {
        const pool = SD_MSGS().service_down;
        const tpl  = pool[Math.floor(Math.random() * pool.length)];
        alertMsg = tpl.replace('{label}', svc.label).replace('{n}', name).replace('{c}', this._cn());
        alertKey = svc.key + '_down';
        alertMs  = 7000;
      }
    }

    // ── Kiểm tra cảnh báo hiện tại đã về an toàn chưa ────────
    this._checkAlertResolved();

    if (alertMsg && alertKey) {
      if (this._floating) this._floatTip(alertMsg, alertMs);
      else this._pushStatus(alertMsg, true);
      // Bắt đầu vòng lặp TTS chỉ khi đây là cảnh báo MỚI (key khác với đang chạy)
      if (alertKey !== this._alertTtsKey) {
        this._startAlertTtsLoop(alertKey, alertMsg);
      }
    }

    // Cập nhật badge
    this._updateBadge();

    // Lưu trạng thái
    this._saveStates();
  }

  // ── Kiểm tra cảnh báo hiện tại đã về ngưỡng an toàn chưa ──
  _checkAlertResolved() {
    if (!this._alertTtsKey || !this._hass) return;
    const key = this._alertTtsKey;

    // Phân tích key: format là "sensorKey_level" hoặc "svcKey_down"
    const isDown = key.endsWith('_down');
    const isCrit = key.endsWith('_crit');
    const isWarn = key.endsWith('_warn');
    const baseKey = key.replace(/_(crit|warn|down)$/, '');

    if (isDown) {
      // Kiểm tra service đã up lại chưa
      const svc = this._getEffectiveServices().find(s => s.key === baseKey);
      if (svc) {
        const state = this._hass.states[svc.entity];
        const stVal = state?.state;
        const stillDown = !stVal || stVal === 'off' || stVal === 'unavailable' || stVal === 'unknown';
        if (!stillDown) this._stopAlertTtsLoop();
      }
    } else {
      // Kiểm tra sensor đã về dưới ngưỡng chưa
      const s = this._getEffectiveSensors().find(s => s.key === baseKey);
      if (s) {
        const state = this._hass.states[s.entity];
        if (state) {
          const raw = parseFloat(state.state);
          const thresh = SD_THRESHOLDS[s.type];
          if (!isNaN(raw) && thresh) {
            const safe = isCrit ? (raw < thresh.crit) : (raw < thresh.warn);
            if (safe) this._stopAlertTtsLoop();
          }
        }
      }
    }
  }

  // ── Bắt đầu vòng lặp TTS alert (single loop, không chồng chéo) ──
  // Dùng generation counter để stale closure không fire sau khi đã stop/replace
  _startAlertTtsLoop(key, msg) {
    this._stopAlertTtsLoop();
    if (!this._audioEnabled) return;
    // Tăng generation — closure cũ sẽ thấy gen khác và tự thoát
    this._alertTtsGen = (this._alertTtsGen || 0) + 1;
    const gen = this._alertTtsGen;
    this._alertTtsKey     = key;
    this._alertTtsMsg     = msg;
    this._alertTtsRunning = true;
    const cleanMsg = this._cleanTtsText(msg);
    const loop = () => {
      // Thoát ngay nếu đã stop hoặc có loop mới hơn thay thế
      if (!this._alertTtsRunning || this._alertTtsKey !== key || this._alertTtsGen !== gen) return;
      if (!this._audioEnabled) return;
      this._playAudio(cleanMsg);
      // Ước tính thời gian đọc dựa vào độ dài text (90ms/ký tự), min 10s, max 35s, +4s nghỉ
      const speakMs = Math.min(Math.max(cleanMsg.length * 90, 10000), 35000) + 4000;
      this._alertTtsTimer = setTimeout(loop, speakMs);
    };
    loop();
  }

  // ── Dừng vòng lặp TTS alert ────────────────────────────────
  _stopAlertTtsLoop() {
    this._alertTtsRunning = false;
    this._alertTtsKey     = null;
    this._alertTtsMsg     = null;
    if (this._alertTtsTimer) {
      clearTimeout(this._alertTtsTimer);
      this._alertTtsTimer = null;
    }
    // Không reset _alertTtsGen ở đây — giữ nguyên để closure cũ detect đúng
  }

  _saveStates() {
    if (!this._hass) return;
    this._getEffectiveSensors().forEach(s => {
      if (s.entity && this._hass.states[s.entity]) this._lastStates[s.entity] = this._hass.states[s.entity].state;
    });
    this._getEffectiveServices().forEach(s => {
      if (s.entity && this._hass.states[s.entity]) this._lastStates[s.entity] = this._hass.states[s.entity].state;
    });
  }

  // ── Status messages (idle bubble pool) ─────────────────────
  _buildStatusMessages() {
    const name  = this._config.name || 'admin';
    const model = SD_MODELS[this._modelIdx];
    const msgs  = [];
    const h     = new Date().getHours();
    const cn    = this._cn();

    // Lời chào theo buổi
    const greetPool =
      h >= 5  && h < 7  ? _t('greet_dawn',      name, cn) :
      h >= 7  && h < 11 ? _t('greet_morning',   name, cn) :
      h >= 11 && h < 13 ? _t('greet_noon',      name, cn) :
      h >= 13 && h < 17 ? _t('greet_afternoon', name, cn) :
      h >= 17 && h < 20 ? _t('greet_evening',   name, cn) :
                          _t('greet_night',      name, cn);

    msgs.push(this._rand(greetPool));

    // Kiểm tra hệ thống và báo status
    if (this._hass) {
      const problems = [];
      for (const s of this._getEffectiveSensors()) {
        const state = this._hass.states[s.entity];
        if (!state) continue;
        const val = parseFloat(state.state);
        if (isNaN(val)) continue;
        const thresh = SD_THRESHOLDS[s.type];
        if (!thresh) continue;
        const unit = s.type.includes('temp') ? '°C' : '%';
        if (val >= thresh.crit) problems.push({ level:'crit', text: `${s.label} ${Math.round(val)}${unit}` });
        else if (val >= thresh.warn) problems.push({ level:'warn', text: `${s.label} ${Math.round(val)}${unit}` });
      }
      for (const svc of this._getEffectiveServices()) {
        const state = this._hass.states[svc.entity];
        const stVal = state?.state;
        const isDown = !stVal || stVal === 'off' || stVal === 'unavailable' || stVal === 'unknown';
        if (isDown) problems.push({ level:'down', text: `${svc.label} offline` });
      }

      if (problems.length === 0) {
        msgs.push(_t('sys_all_ok', cn, name));
      } else {
        const critCount = problems.filter(p => p.level === 'crit').length;
        const warnCount = problems.filter(p => p.level === 'warn').length;
        const downCount = problems.filter(p => p.level === 'down').length;
        if (critCount > 0)
          msgs.push(_t('alert_crit', name, critCount));
        if (warnCount > 0)
          msgs.push(_t('alert_warn', cn, name, warnCount));
        if (downCount > 0)
          msgs.push(_t('alert_down', name, downCount));
      }
    }

    // Idle quotes của nhân vật
    const idlePool = SD_MSGS().idle[model.name] || SD_MSGS().idle['UMP45 🔫'];
    const picked = [...idlePool].sort(() => Math.random() - 0.5).slice(0, 3).map(q =>
      q.replace(/{n}/g, name).replace(/{c}/g, cn)
    );
    picked.forEach((q, i) => {
      const pos = Math.min(msgs.length, 1 + i * 2);
      msgs.splice(pos, 0, q);
    });

    return msgs.length ? msgs : [this._rand(greetPool)];
  }

  _greet() {
    const msgs = this._buildStatusMessages();
    this._statusMsgs = msgs;
    this._statusIdx  = 0;
    this._showBubble(msgs[0]);
  }

  _idleQuote() {
    const msgs = this._buildStatusMessages();
    this._statusMsgs = msgs;
    this._statusIdx  = 0;
    if (!this._floating) this._showBubble(msgs[0]);
  }

  // ── Nút báo cáo ─────────────────────────────────────────────
  _sysQuote() {
    const name  = this._config.name || 'admin';
    const model = SD_MODELS[this._modelIdx];
    const cn    = this._cn();

    // ── Xây dựng danh sách cảnh báo hiện tại ──
    const problems = [];
    if (this._hass) {
      for (const s of this._getEffectiveSensors()) {
        const state = this._hass.states[s.entity];
        if (!state) continue;
        const val = parseFloat(state.state);
        if (isNaN(val)) continue;
        const thresh = SD_THRESHOLDS[s.type];
        if (!thresh) continue;
        const unit = s.type.includes('temp') ? '°C' : '%';
        if (val >= thresh.crit)      problems.push(`🚨 ${s.label} ${Math.round(val)}${unit} (${_t('severity_crit')})`);
        else if (val >= thresh.warn) problems.push(`⚠️ ${s.label} ${Math.round(val)}${unit} (${_t('severity_warn')})`);
      }
      for (const svc of this._getEffectiveServices()) {
        const state = this._hass.states[svc.entity];
        const stVal = state?.state;
        const isDown = !stVal || stVal === 'off' || stVal === 'unavailable' || stVal === 'unknown';
        if (isDown) problems.push(_t('svc_offline', svc.label));
      }
    }

    // ── Lấy tên nhân vật sạch (bỏ emoji) để đọc TTS ──
    const cnClean = cn.replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27FF]/gu, '').trim();

    // ── Xây dựng câu mở đầu báo cáo ──
    let reportIntro;
    let reportIntroTts;
    if (problems.length === 0) {
      reportIntro    = _t('report_intro_ok', cn);
      reportIntroTts = _t('report_intro_ok_tts', cnClean);
    } else {
      reportIntro    = _t('report_intro_err', cn, problems);
      reportIntroTts = `${cnClean} ${_t('report_intro_err', '', problems.map(p => p.replace(/[\u{1F000}-\u{1FFFF}🚨⚠️🔴✅]/gu, '').trim())).slice(cnClean.length + 1)}`;
    }

    // ── Lấy thoại bình thường (idle quote) ──
    const pool = SD_MSGS().idle[model.name] || SD_MSGS().idle['UMP45 🔫'];
    const idleMsg = this._rand(pool).replace(/{n}/g, name).replace(/{c}/g, cn);

    // ── Hiển thị bubble: intro trước, rồi idle sau ──
    const combinedDisplay = `${reportIntro}<br><br>${idleMsg}`;
    if (this._floating) this._floatTip(combinedDisplay, 8000);
    else this._pushStatus(combinedDisplay, true);

    // ── TTS: đọc intro trước, rồi đọc idle sau ──
    // Trong suốt thời gian đọc TTS, pause status rotation để bubble không bị thay thế
    const idleMsgTts    = idleMsg.replace(/[\u{1F000}-\u{1FFFF}~✿★☆♪♫·•⚠️🚨🔴✅]/gu, '').trim();
    const introTtsClean = reportIntroTts.replace(/[\u{1F000}-\u{1FFFF}~✿★☆♪♫·•⚠️🚨🔴✅]/gu, '').trim();
    const introMs = Math.max(introTtsClean.length * 90, 3000) + 500;
    const idleMs  = Math.max(idleMsgTts.length  * 90, 3000) + 500;
    const totalMs = introMs + idleMs + 400;

    // Pause rotation cho đến khi TTS đọc xong hết
    this._reportLocked = true;
    if (this._reportLockTimer) clearTimeout(this._reportLockTimer);
    this._reportLockTimer = setTimeout(() => {
      this._reportLocked = false;
      this._reportLockTimer = null;
    }, totalMs + 200);

    setTimeout(() => {
      this._playAudio(introTtsClean);
      setTimeout(() => this._playAudio(idleMsgTts), introMs);
    }, 200);
  }

  // ── Status rotation ─────────────────────────────────────────
  _startStatusRotation() {
    clearInterval(this._statusInterval);
    this._statusInterval = setInterval(() => {
      if (this._floating) return;
      if (!this._statusMsgs.length) return;
      if (this._reportLocked) return; // hold report bubble until TTS finishes
      this._statusIdx++;
      if (this._statusIdx >= this._statusMsgs.length) {
        this._statusMsgs = this._buildStatusMessages();
        this._statusIdx  = 0;
      }
      this._showBubble(this._statusMsgs[this._statusIdx]);
    }, 10000);
  }

  _pushStatus(msg, immediate = false) {
    if (!this._statusMsgs.includes(msg)) {
      this._statusMsgs.push(msg);
      if (this._statusMsgs.length > 20) this._statusMsgs.shift();
    }
    if (immediate) {
      this._statusIdx = this._statusMsgs.indexOf(msg);
      this._showBubble(msg);
    }
  }

  _showBubble(html) {
    const wrap = this._shadow.getElementById('sd-bubble-wrap');
    const b    = this._shadow.getElementById('sd-bubble');
    if (!wrap || !b) return;
    wrap.classList.remove('show');
    setTimeout(() => { b.innerHTML = html; wrap.classList.add('show'); }, 160);
  }

  // ── Switch model ────────────────────────────────────────────
  _switchModelNext() {
    this._modelIdx = (this._modelIdx + 1) % SD_MODELS.length;
    try { localStorage.setItem('sd_modelIdx', this._modelIdx); } catch(e) {}
    this._skipGreetingPush = true;
    this._reloadCharFrame();
    const greeting = SD_MODELS[this._modelIdx].greeting;
    this._showBubble(greeting);
    setTimeout(() => {
      this._statusMsgs = this._buildStatusMessages();
      this._statusIdx  = 0;
    }, 100);
  }

  _switchModelPrev() {
    this._modelIdx = (this._modelIdx - 1 + SD_MODELS.length) % SD_MODELS.length;
    try { localStorage.setItem('sd_modelIdx', this._modelIdx); } catch(e) {}
    this._skipGreetingPush = true;
    this._reloadCharFrame();
    const greeting = SD_MODELS[this._modelIdx].greeting;
    this._showBubble(greeting);
    setTimeout(() => {
      this._statusMsgs = this._buildStatusMessages();
      this._statusIdx  = 0;
    }, 100);
  }

  _reloadCharFrame() {
    if (this._floating) {
      const fc = document.getElementById('_sd_float_canvas');
      if (fc) { const fh = this._config.float_height || 600, fw = this._config.float_width || 380; this._loadCanvas(fc, this._modelIdx, fw, fh, true); }
    } else if (this._pinned) {
      const pc = document.getElementById('_sd_pin_canvas');
      if (pc) { const fh = this._config.float_height || 600, fw = this._config.float_width || 380; this._loadCanvas(pc, this._modelIdx, fw, fh, true); }
    } else {
      const c = this._shadow.getElementById('sd-l2d-canvas');
      const h = this._config.height || 440, w = this._config.width || 400;
      if (c) {
        const _hOff2 = SD_MODELS[this._modelIdx].hOffset || 0;
        c.style.left = _hOff2 + 'px';
        this._loadCanvas(c, this._modelIdx, w, h, false);
      }
    }
    const lbl = this._shadow.getElementById('sdModelLabel');
    if (lbl) lbl.textContent = SD_MODELS[this._modelIdx].name;
  }

  // ── Floating mode ───────────────────────────────────────────
  _enterFloating() {
    if (this._floating) return;
    this._floating = true;
    try { localStorage.setItem('sd_floating', '1'); } catch(e) {}
    this._shadow.querySelector('.sd-card').style.display = 'none';

    const fh = this._config.float_height || 600;
    const fw = this._config.float_width  || 380;

    if (!document.getElementById('_sd_float_css')) {
      const st = document.createElement('style');
      st.id = '_sd_float_css'; st.textContent = SD_FLOAT_CSS;
      document.head.appendChild(st);
    }

    const el = document.createElement('div');
    el.id = 'sd-float-overlay';
    el.innerHTML = `
      <div id="_sd_float_bubble"></div>
      <div id="sd-float-controls">
        <button class="sd-fbtn" id="_sd_fbtn_prev">◀</button>
        <button class="sd-fbtn" id="_sd_fbtn_next">▶</button>
        <button class="sd-fbtn" id="_sd_fbtn_quote">📊</button>
        <button class="sd-fbtn restore" id="_sd_fbtn_restore">⬆ ${_t('float_restore')}</button>
      </div>
      <div id="sd-float-char">
        <div id="_sd_float_chat"><div id="_sd_float_chat_inner"></div></div>
        <canvas id="_sd_float_canvas" width="${fw}" height="${fh}"
          style="background:transparent;display:block;"></canvas>
      </div>`;
    document.body.appendChild(el);
    this._floatEl = el;

    const fc = document.getElementById('_sd_float_canvas');
    this._loadCanvas(fc, this._modelIdx, fw, fh, true);

    document.getElementById('_sd_fbtn_restore').onclick = () => this._exitFloating();
    document.getElementById('_sd_fbtn_prev').onclick    = () => this._switchModelPrev();
    document.getElementById('_sd_fbtn_next').onclick    = () => this._switchModelNext();
    document.getElementById('_sd_fbtn_quote').onclick   = () => {
      const msgs = this._buildStatusMessages();
      this._floatTip(msgs[0], 5000);
    };

    document.getElementById('sd-float-char').addEventListener('click', () => {
      const tips = _t('float_tips', this._cn());
      this._floatTip(this._rand(tips), 3000);
    });
    document.getElementById('sd-float-char').addEventListener('dblclick', () => {
      if (this._config.enable_modal) { this._openControlModal(); return; }
      this._exitFloating();
    });

    // (No mouse-eye postMessage — pixi-live2d-display has FocusController built-in.)
    this._floatMouseMove = null;

    this._floatChatShow = (msg) => {
      const wrap  = document.getElementById('_sd_float_chat');
      const inner = document.getElementById('_sd_float_chat_inner');
      if (!wrap || !inner) return;
      wrap.classList.remove('show');
      setTimeout(() => { inner.innerHTML = msg; wrap.classList.add('show'); }, 160);
    };
    setTimeout(() => {
      const msgs = this._buildStatusMessages();
      this._floatChatMsgs = msgs; this._floatChatIdx = 0;
      this._floatChatShow(msgs[0]);
    }, 1000);
    this._floatChatInterval = setInterval(() => {
      if (!this._floating) return;
      const msgs = this._floatChatMsgs || this._buildStatusMessages();
      this._floatChatIdx = ((this._floatChatIdx || 0) + 1) % msgs.length;
      this._floatChatShow(msgs[this._floatChatIdx]);
    }, 5000);

    this._floatTip(_t('float_click_tip', this._cn()), 4000);
  }

  _exitFloating() {
    if (!this._floating) return;
    this._floating = false;
    try { localStorage.removeItem('sd_floating'); } catch(e) {}
    if (this._floatEl) { this._floatEl.remove(); this._floatEl = null; }
    if (this._floatMouseMove) { document.removeEventListener('mousemove', this._floatMouseMove); this._floatMouseMove = null; }
    if (this._floatChatInterval) { clearInterval(this._floatChatInterval); this._floatChatInterval = null; }
    this._floatChatMsgs = null; this._floatChatIdx = 0;
    this._shadow.querySelector('.sd-card').style.display = '';
    const c = this._shadow.getElementById('sd-l2d-canvas');
    const h = this._config.height || 440;
    if (c) this._loadCanvas(c, this._modelIdx, 400, h, false);
    this._pushStatus(_t('back_to_card', this._cn()), true);
  }

  _floatTip(html, ms = 4000) {
    clearTimeout(this._floatTipTmr);
    const b = document.getElementById('_sd_float_bubble');
    if (!b) return;
    b.innerHTML = html; b.classList.add('show');
    this._floatTipTmr = setTimeout(() => b.classList.remove('show'), ms);
    if (this._floatChatShow) this._floatChatShow(html);
  }

  // ── Pin mode ────────────────────────────────────────────────
  _togglePin() {
    if (this._pinned) this._exitPin();
    else              this._enterPin();
  }

  _enterPin() {
    if (this._pinned) return;
    this._pinned = true;
    try { localStorage.setItem('sd_pinned', '1'); } catch(e) {}
    const btn = this._shadow.getElementById('sdBtnPin');
    if (btn) { btn.textContent = _t('pin_btn_unpin'); btn.classList.add('green'); }
    // always_pinned: hide in-card character to avoid duplicate render (card + pin overlay both showed K2).
    if (this._config.always_pinned) {
      const _card = this._shadow.querySelector('.sd-card');
      if (_card) _card.style.display = 'none';
    }

    const fh = this._config.float_height || 600;
    const fw = this._config.float_width  || 380;

    if (!document.getElementById('_sd_pin_css')) {
      const st = document.createElement('style');
      st.id = '_sd_pin_css'; st.textContent = SD_PIN_CSS;
      document.head.appendChild(st);
    }

    const el = document.createElement('div');
    el.id = 'sd-pin-overlay';
    // Hide pin overlay controls if enable_modal — user uses dblclick → modal instead.
    const pinControlsHtml = this._config.enable_modal ? '' : `
      <div id="sd-pin-controls">
        <button class="sd-pin-btn" id="_sd_pbtn_prev">◀</button>
        <button class="sd-pin-btn" id="_sd_pbtn_next">▶</button>
        <button class="sd-pin-btn unpin" id="_sd_pbtn_unpin">${_t('pin_btn_unpin')}</button>
      </div>`;
    el.innerHTML = `
      ${pinControlsHtml}
      <div id="sd-pin-char">
        <div id="_sd_pin_chat"><div id="_sd_pin_chat_inner"></div></div>
        <canvas id="_sd_pin_canvas" width="${fw}" height="${fh}"
          style="background:transparent;display:block;"></canvas>
      </div>`;
    document.body.appendChild(el);
    this._pinEl = el;

    const pc = document.getElementById('_sd_pin_canvas');
    this._loadCanvas(pc, this._modelIdx, fw, fh, true);

    const _unpinBtn = document.getElementById('_sd_pbtn_unpin');
    if (_unpinBtn) _unpinBtn.onclick = () => this._exitPin();
    const _prevBtn  = document.getElementById('_sd_pbtn_prev');
    if (_prevBtn)  _prevBtn.onclick  = () => this._switchModelPrev();
    const _nextBtn  = document.getElementById('_sd_pbtn_next');
    if (_nextBtn)  _nextBtn.onclick  = () => this._switchModelNext();

    document.getElementById('sd-pin-char').addEventListener('click', () => {
      const inner = document.getElementById('_sd_pin_chat_inner');
      const wrap  = document.getElementById('_sd_pin_chat');
      if (!inner || !wrap) return;
      const msgs = this._buildStatusMessages();
      const msg  = this._rand(msgs);
      wrap.classList.remove('show');
      setTimeout(() => { inner.innerHTML = msg; wrap.classList.add('show'); }, 160);
    });
    document.getElementById('sd-pin-char').addEventListener('dblclick', () => {
      if (this._config.enable_modal) this._openControlModal();
    });

    // (No mouse-eye postMessage — pixi-live2d-display has FocusController built-in.)
    this._pinMouseMove = null;

    this._pinChatShow = (msg) => {
      const wrap  = document.getElementById('_sd_pin_chat');
      const inner = document.getElementById('_sd_pin_chat_inner');
      if (!wrap || !inner) return;
      wrap.classList.remove('show');
      setTimeout(() => { inner.innerHTML = msg; wrap.classList.add('show'); }, 160);
    };
    setTimeout(() => {
      const msgs = this._buildStatusMessages();
      this._pinChatMsgs = msgs; this._pinChatIdx = 0;
      this._pinChatShow(msgs[0]);
    }, 1000);
    this._pinChatInterval = setInterval(() => {
      if (!this._pinned) return;
      const msgs = this._pinChatMsgs || this._buildStatusMessages();
      this._pinChatIdx = ((this._pinChatIdx || 0) + 1) % msgs.length;
      this._pinChatShow(msgs[this._pinChatIdx]);
    }, 5000);
  }

  _exitPin() {
    if (!this._pinned) return;
    this._pinned = false;
    try { localStorage.removeItem('sd_pinned'); } catch(e) {}
    const btn = this._shadow.getElementById('sdBtnPin');
    if (btn) { btn.textContent = _t('pin_btn_pin'); btn.classList.remove('green'); }
    // Restore card visibility if hidden by always_pinned entry.
    const _card = this._shadow.querySelector('.sd-card');
    if (_card && _card.style.display === 'none') _card.style.display = '';
    if (this._pinEl) { this._pinEl.remove(); this._pinEl = null; }
    if (this._pinMouseMove) { document.removeEventListener('mousemove', this._pinMouseMove); this._pinMouseMove = null; }
    if (this._pinChatInterval) { clearInterval(this._pinChatInterval); this._pinChatInterval = null; }
    this._pinChatMsgs = null; this._pinChatIdx = 0;
  }

  // ── Control modal (dblclick character → open) ──────────────────────────────
  _openControlModal() {
    if (document.getElementById('sd-modal-overlay')) return;  // debounce: only one modal

    if (!document.getElementById('_sd_modal_css')) {
      const st = document.createElement('style');
      st.id = '_sd_modal_css';
      st.textContent = `
        #sd-modal-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;
          align-items:center;justify-content:center;
          background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
          opacity:0;transition:opacity 150ms ease;}
        #sd-modal-overlay.show{opacity:1;}
        #sd-modal-card{min-width:280px;max-width:340px;padding:18px 20px;
          background:rgba(10,18,45,0.95);border:1px solid rgba(80,160,255,0.4);
          border-radius:14px;box-shadow:0 12px 48px rgba(0,0,0,0.6);
          color:#c0e0ff;font-family:'Segoe UI',sans-serif;font-size:13px;
          transform:scale(0.92);transition:transform 150ms cubic-bezier(0.34,1.56,0.64,1);}
        #sd-modal-overlay.show #sd-modal-card{transform:scale(1);}
        .sd-modal-row{display:flex;align-items:center;justify-content:space-between;
          gap:8px;margin-bottom:10px;}
        .sd-modal-row.title{font-weight:700;color:#90c8ff;letter-spacing:0.5px;
          padding-bottom:8px;border-bottom:1px solid rgba(80,160,255,0.2);}
        .sd-modal-name{flex:1;text-align:center;font-weight:600;color:#a0e0ff;}
        .sd-modal-btn{padding:6px 12px;background:rgba(80,160,255,0.15);
          border:1px solid rgba(80,160,255,0.4);border-radius:8px;
          color:#c0e0ff;font-size:12px;font-weight:600;cursor:pointer;
          transition:background 120ms,border-color 120ms;font-family:inherit;}
        .sd-modal-btn:hover{background:rgba(80,160,255,0.3);border-color:rgba(80,160,255,0.7);}
        .sd-modal-btn.danger{background:rgba(220,80,80,0.15);border-color:rgba(220,80,80,0.4);color:#ffb0b0;}
        .sd-modal-btn.danger:hover{background:rgba(220,80,80,0.3);}
        .sd-modal-btn.full{width:100%;text-align:center;}
        .sd-modal-close{position:absolute;top:8px;right:10px;width:24px;height:24px;
          padding:0;font-size:14px;line-height:1;border-radius:50%;}
      `;
      document.head.appendChild(st);
    }

    const ov = document.createElement('div');
    ov.id = 'sd-modal-overlay';
    ov.innerHTML = `
      <div id="sd-modal-card" style="position:relative;">
        <button class="sd-modal-btn sd-modal-close" id="_sd_mb_close">✕</button>
        <div class="sd-modal-row title">SysDesk · Control</div>
        <div class="sd-modal-row">
          <button class="sd-modal-btn" id="_sd_mb_prev">◀</button>
          <span class="sd-modal-name" id="_sd_mb_name">${SD_MODELS[this._modelIdx].name}</span>
          <button class="sd-modal-btn" id="_sd_mb_next">▶</button>
        </div>
        <div class="sd-modal-row">
          <button class="sd-modal-btn full" id="_sd_mb_sound">🔊 ${this._audioEnabled ? 'TTS ON' : 'TTS OFF'}</button>
        </div>
        <div class="sd-modal-row">
          <button class="sd-modal-btn full" id="_sd_mb_reload">⟳ Reload Live2D</button>
        </div>
        <div class="sd-modal-row">
          <button class="sd-modal-btn full danger" id="_sd_mb_exit">🚪 Exit Pin</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));

    const close = () => this._closeControlModal();
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.getElementById('_sd_mb_close').onclick  = close;
    document.getElementById('_sd_mb_prev').onclick   = () => {
      this._switchModelPrev();
      const n = document.getElementById('_sd_mb_name');
      if (n) n.textContent = SD_MODELS[this._modelIdx].name;
    };
    document.getElementById('_sd_mb_next').onclick   = () => {
      this._switchModelNext();
      const n = document.getElementById('_sd_mb_name');
      if (n) n.textContent = SD_MODELS[this._modelIdx].name;
    };
    document.getElementById('_sd_mb_sound').onclick  = () => {
      this._audioEnabled = !this._audioEnabled;
      if (!this._audioEnabled) this._stopAudio();
      const b = document.getElementById('_sd_mb_sound');
      if (b) b.textContent = '🔊 ' + (this._audioEnabled ? 'TTS ON' : 'TTS OFF');
    };
    document.getElementById('_sd_mb_reload').onclick = () => {
      this._reloadCharFrame();
      this._pushStatus(_t('reload_done', this._cn()), true);
      close();
    };
    document.getElementById('_sd_mb_exit').onclick   = () => {
      if (this._pinned)   this._exitPin();
      if (this._floating) this._exitFloating();
      close();
    };

    this._modalEscHandler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', this._modalEscHandler);
  }

  _closeControlModal() {
    const ov = document.getElementById('sd-modal-overlay');
    if (!ov) return;
    ov.classList.remove('show');
    if (this._modalEscHandler) { document.removeEventListener('keydown', this._modalEscHandler); this._modalEscHandler = null; }
    setTimeout(() => ov.remove(), 160);
  }

  // Handles first mount + view-cache reattach uniformly. _wantPinned/_wantFloating seeded by
  // _render (config/localStorage) and disconnectedCallback (preserve current state on detach).
  connectedCallback() {
    // Pin re-entry: always_pinned config OR was-pinned-before-detach.
    if ((this._wantPinned || (this._config && this._config.always_pinned))
        && !document.getElementById('sd-pin-overlay')) {
      this._wantPinned = false;
      setTimeout(() => { if (!this._pinned) this._enterPin(); }, 100);
    }
    // Float re-entry: was-floating-before-detach (no config option exposed yet).
    if (this._wantFloating && !document.getElementById('sd-float-overlay')) {
      this._wantFloating = false;
      setTimeout(() => { if (!this._floating) this._enterFloating(); }, 300);
    }
  }

  // Clear setIntervals + remove overlays when HA detaches via view-cache (hui-root.ts:1180).
  // Save pin/float intent into _wantPinned/_wantFloating so connectedCallback restores on reattach.
  disconnectedCallback() {
    if (this._pinned)   this._wantPinned   = true;
    if (this._floating) this._wantFloating = true;
    this._pinned   = false;
    this._floating = false;
    try { clearInterval(this._idleInterval); this._idleInterval = null; } catch(e) {}
    try { clearInterval(this._statusInterval); this._statusInterval = null; } catch(e) {}
    try { clearInterval(this._floatChatInterval); this._floatChatInterval = null; } catch(e) {}
    try { clearTimeout(this._alertTtsTimer); } catch(e) {}
    try { clearTimeout(this._reportLockTimer); } catch(e) {}
    try { this._stopAudio && this._stopAudio(); } catch(e) {}
    try { document.getElementById('sd-float-overlay')?.remove(); } catch(e) {}
    try { document.getElementById('sd-pin-overlay')?.remove(); } catch(e) {}
  }

  // ── Helpers ─────────────────────────────────────────────────
  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  _cn() {
    if (this._config.char_nickname?.trim()) return this._config.char_nickname.trim();
    return SD_MODELS[this._modelIdx]?.name?.replace(/\s*[^\w\s].*/u, '').trim() || 'UMP45';
  }

  // ══════════════════════════════════════════════════════════════
  // ── TTS — hỗ trợ 4 engine:
  //   webspeech        – Web Speech API (giọng trình duyệt)
  //   google_translate – Google Translate TTS qua <audio>
  //   ha_service       – Gọi HA TTS service
  //   none             – Tắt hoàn toàn
  // ══════════════════════════════════════════════════════════════

  _getTtsCfg() {
    const raw = this._config.tts;
    if (!raw) return { engine: 'webspeech', lang: 'vi-VN', rate: 1.05, pitch: 1.1 };
    if (typeof raw === 'string') return { engine: raw };
    return {
      engine:                 raw.engine  || 'webspeech',
      lang:                   raw.lang    || 'vi-VN',
      rate:                   raw.rate    || 1.05,
      pitch:                  raw.pitch   || 1.1,
      service:                raw.service || null,
      entity_id:              raw.entity_id || null,
      media_player_entity_id: raw.media_player_entity_id || raw.media_player || null,
      cache:                  raw.cache !== undefined ? raw.cache : true,
      options:                raw.options || {},
    };
  }

  _cleanTtsText(text) {
    return (text || '')
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/[~✿★☆♪♫·•]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  _stopAudio() {
    try { if (this._audio) { this._audio.pause(); this._audio = null; } } catch(e) {}
    try { if (this._ttsUtter) { window.speechSynthesis?.cancel(); this._ttsUtter = null; } } catch(e) {}
  }

  // ── WebSpeech ────────────────────────────────────────────────
  _speakWebSpeech(text, cfg) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang   = (cfg && cfg.lang)  || 'vi-VN';
    utter.rate   = (cfg && cfg.rate)  || 1.05;
    utter.pitch  = (cfg && cfg.pitch) || 1.1;
    utter.volume = 0.9;
    const trySpeak = () => {
      const voices  = window.speechSynthesis.getVoices();
      const lang    = utter.lang;
      const viVoice = voices.find(v => v.lang === lang || v.lang.startsWith('vi'));
      if (viVoice) utter.voice = viVoice;
      this._ttsUtter = utter;
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length) trySpeak();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak(); }; }
  }

  // ── Google Translate TTS ─────────────────────────────────────
  _speakGoogleTranslate(text, cfg) {
    try {
      if (this._audio) { this._audio.pause(); this._audio = null; }
      const lang = (cfg && cfg.lang) || 'vi';
      const url  = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0,200))}&tl=${lang}&client=tw-ob`;
      const a = new Audio(url); a.volume = 0.9; this._audio = a;
      const p = a.play(); if (p) p.catch(() => {});
    } catch(e) {}
  }

  // ── HA TTS: fetch URL rồi phát bằng <audio> ─────────────────
  // Dùng khi tts.speak không có media_player_entity_id
  // Giọng giống hệt khi phát qua loa vật lý (cùng engine)
  async _speakHaTtsUrl(text, cfg) {
    if (!this._hass) return;
    try {
      const body = {
        engine_id: cfg.entity_id,
        message:   text,
        cache:     cfg.cache !== false,
        ...(cfg.options || {}),
      };
      const res = await this._hass.fetchWithAuth('/api/tts_get_url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`tts_get_url HTTP ${res.status}`);
      const data = await res.json();
      if (!data.url) throw new Error('tts_get_url returned no url');
      if (this._audio) { this._audio.pause(); this._audio = null; }
      const a = new Audio(data.url); a.volume = 0.9; this._audio = a;
      const p = a.play(); if (p) p.catch(() => {});
    } catch(e) {
      console.warn('[SysDeskTTS] _speakHaTtsUrl error, fallback WebSpeech:', e);
      this._speakWebSpeech(text, cfg);
    }
  }

  // ── HA Service ───────────────────────────────────────────────
  // Kiểu mới (tts.speak):  entity_id = tts entity, media_player_entity_id tuỳ chọn
  //   - Có media_player → phát thẳng ra loa HA
  //   - Không có        → fetch audio URL từ HA rồi phát trên trình duyệt (giọng y hệt)
  // Kiểu cũ (tts.xxx_say): entity_id = media_player, không cần media_player_entity_id
  _speakHaService(text, cfg) {
    if (!this._hass) return;
    const service   = cfg.service;
    const entity_id = cfg.entity_id;
    if (!service || !entity_id) {
      console.warn('[SysDeskTTS] ha_service requires service and entity_id in YAML tts config');
      return;
    }
    const [domain, svc] = service.split('.');
    if (!domain || !svc) return;
    try {
      if (domain === 'tts' && svc === 'speak') {
        const mp = cfg.media_player_entity_id || null;
        if (!mp) {
          // Không có media_player → fetch URL từ HA TTS rồi phát trên trình duyệt
          this._speakHaTtsUrl(text, cfg);
          return;
        }
        // Có media_player → phát qua loa HA
        this._hass.callService('tts', 'speak', {
          entity_id,
          media_player_entity_id: mp,
          message: text,
          cache:   cfg.cache !== false,
          ...(cfg.options || {}),
        });
      } else {
        // Kiểu cũ: entity_id là media_player
        this._hass.callService(domain, svc, {
          entity_id,
          message: text,
          ...(cfg.lang    ? { language: cfg.lang } : {}),
          ...(cfg.options || {}),
        });
      }
    } catch(e) {
      console.warn('[SysDeskTTS] callService error:', e);
    }
  }

  // ── Dispatcher ───────────────────────────────────────────────
  _playAudio(text) {
    if (!this._audioEnabled) return;
    const cfg   = this._getTtsCfg();
    if (cfg.engine === 'none') return;
    const clean = this._cleanTtsText(text);
    if (!clean) return;
    this._stopAudio();
    switch (cfg.engine) {
      case 'google_translate': this._speakGoogleTranslate(clean, cfg); break;
      case 'ha_service':       this._speakHaService(clean, cfg);       break;
      default:                 this._speakWebSpeech(clean, cfg);
    }
  }
}

if (!customElements.get('sys-desk')) {
  customElements.define('sys-desk', SysDesk);
}

// ─── Visual Editor ────────────────────────────────────────────
class SysDeskEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass   = null;
    this._open   = { general: true, appearance: false, sensors: false, services: false, tts: false };
  }

  setConfig(config) { this._config = config; this._render(); }
  set hass(h) { this._hass = h; this._syncPickers(); }
  _fire() { this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true })); }
  _toggle(id) {
    this._open[id] = !this._open[id];
    const body  = this.shadowRoot.getElementById('body-' + id);
    const arrow = this.shadowRoot.getElementById('arrow-' + id);
    if (body)  body.style.display  = this._open[id] ? 'block' : 'none';
    if (arrow) arrow.textContent   = this._open[id] ? '▾' : '▸';
    if (this._open[id]) requestAnimationFrame(() => this._syncPickers());
  }

  _render() {
    const cfg    = this._config;
    const ttsEng = (cfg.tts && cfg.tts.engine) || 'webspeech';
    const ttsLang  = (cfg.tts && cfg.tts.lang)  || 'vi-VN';
    const ttsRate  = (cfg.tts && cfg.tts.rate)  || 1.05;
    const ttsPitch = (cfg.tts && cfg.tts.pitch) || 1.1;
    const ttsSvc   = (cfg.tts && cfg.tts.service)   || '';

    const thresh = SD_THRESHOLDS;

    this.shadowRoot.innerHTML = `<style>
      :host{display:block;padding:4px 0}
      *{box-sizing:border-box}
      .acc-wrap{border:1px solid var(--divider-color);border-radius:10px;margin-bottom:8px;overflow:hidden}
      .acc-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;background:var(--secondary-background-color);font-size:13px;font-weight:700;color:var(--primary-text-color);user-select:none;transition:background .15s}
      .acc-head:hover{background:var(--table-row-background-color,rgba(0,0,0,.04))}
      .acc-arrow{font-size:14px;color:var(--secondary-text-color);transition:transform .2s}
      .acc-body{padding:12px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color,#fff)}
      .row{display:flex;flex-direction:column;margin-bottom:12px}
      .row:last-child{margin-bottom:0}
      .row label{font-size:12px;color:var(--secondary-text-color);margin-bottom:4px;font-weight:600}
      ha-entity-picker{display:block;width:100%}
      input[type=text]{background:var(--input-fill-color,rgba(0,0,0,.04));border:1px solid var(--divider-color,#e0e0e0);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--primary-text-color);font-family:inherit;width:100%}
      .sl-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
      .sl-row label{font-size:12px;font-weight:600;color:var(--secondary-text-color);min-width:130px}
      .sl-row input[type=range]{flex:1;accent-color:var(--primary-color)}
      .slv{font-size:12px;font-weight:700;color:var(--primary-color);min-width:38px;text-align:right}
      .bg{display:flex;gap:6px;flex-wrap:wrap}
      .ob{flex:1;min-width:60px;padding:8px 6px;border-radius:8px;border:1.5px solid var(--divider-color);background:var(--secondary-background-color);cursor:pointer;text-align:center;font-size:12px;color:var(--primary-text-color);transition:all .2s;user-select:none}
      .ob.on{border-color:var(--primary-color);background:rgba(3,169,244,.12);color:var(--primary-color);font-weight:700}
      .ob:hover{background:rgba(3,169,244,.06)}
      .sec-opts{background:var(--secondary-background-color);border-radius:8px;padding:10px 12px;margin-bottom:12px;border:1px solid var(--divider-color)}
      .hint{font-size:11px;color:var(--secondary-text-color);margin-top:4px;line-height:1.55}
      .tag{display:inline-block;background:rgba(3,169,244,.12);color:var(--primary-color);border-radius:6px;padding:2px 8px;font-size:10.5px;font-weight:700;margin-bottom:6px}
      .divider{height:1px;background:var(--divider-color);margin:10px 0}
      .tts-section{display:none}.tts-section.show{display:block}
      .thresh-table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}
      .thresh-table th{text-align:left;color:var(--secondary-text-color);font-weight:600;padding:4px 6px;border-bottom:1px solid var(--divider-color)}
      .thresh-table td{padding:4px 6px;color:var(--primary-text-color)}
      .thresh-table .warn{color:#d4a000;font-weight:600}
      .thresh-table .crit{color:#c00;font-weight:700}
      /* Entity row với tên + picker + nút xóa */
      .entity-row{display:flex;flex-direction:column;margin-bottom:10px;border:1px solid var(--divider-color);border-radius:8px;padding:8px 10px;background:var(--secondary-background-color);}
      .entity-row-top{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
      .entity-row-top input[type=text]{flex:1;background:var(--card-background-color,#fff);border:1px solid var(--divider-color);border-radius:6px;padding:5px 9px;font-size:12px;color:var(--primary-text-color);font-family:inherit;}
      .entity-row-top .icon-tag{font-size:14px;flex-shrink:0;}
      .btn-del{flex-shrink:0;background:rgba(220,50,50,.12);border:1px solid rgba(220,50,50,.3);color:#c44;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:700;transition:all .15s;}
      .btn-del:hover{background:rgba(220,50,50,.25);}
      .btn-add{display:flex;align-items:center;gap:5px;margin-top:6px;background:rgba(3,169,244,.08);border:1.5px dashed rgba(3,169,244,.4);color:var(--primary-color);border-radius:8px;padding:7px 12px;cursor:pointer;font-size:12px;font-weight:600;width:100%;justify-content:center;transition:all .15s;}
      .btn-add:hover{background:rgba(3,169,244,.18);}
      .type-sel{font-size:11px;background:var(--card-background-color,#fff);border:1px solid var(--divider-color);border-radius:6px;padding:4px 6px;color:var(--primary-text-color);}
    </style>

    <!-- HEADER -->
    <div style="text-align:center;padding:12px 14px 4px;font-size:11px;color:var(--secondary-text-color);line-height:1.7;">
      🖥️ <strong style="color:var(--primary-color)">SysDesk v1.0.0</strong> — System Monitor Assistant<br/>
      Designed by <strong style="color:var(--primary-color)">@doanlong1412</strong> 🇻🇳
      &nbsp;&nbsp;
      <a href="https://www.paypal.com/paypalme/doanlong1412" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;
               padding:5px 12px;border-radius:20px;text-decoration:none;font-size:11px;font-weight:700;
               background:linear-gradient(135deg,rgba(255,180,0,0.18),rgba(255,120,0,0.12));
               border:1px solid rgba(255,160,0,0.45);color:#ffb830;
               box-shadow:0 2px 8px rgba(255,150,0,0.15);
               transition:all 0.2s;cursor:pointer;"
        onmouseover="this.style.background='linear-gradient(135deg,rgba(255,180,0,0.32),rgba(255,120,0,0.22))';this.style.borderColor='rgba(255,160,0,0.75)';this.style.transform='translateY(-1px)'"
        onmouseout="this.style.background='linear-gradient(135deg,rgba(255,180,0,0.18),rgba(255,120,0,0.12))';this.style.borderColor='rgba(255,160,0,0.45)';this.style.transform=''"
      >☕ Buy me a coffee</a>
    </div>

    <!-- ══ GENERAL ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-general"><span>${_t('editor_title_general')}</span><span class="acc-arrow" id="arrow-general">${this._open.general?'▾':'▸'}</span></div>
      <div class="acc-body" id="body-general" style="display:${this._open.general?'block':'none'}">
        <div class="row">
          <label>${_t('editor_lang_label')}</label>
          <div class="bg" id="langGrid">
            <div class="ob ${_sdGetLang()==='vi'?'on':''}" data-lang="vi">${_t('editor_lang_vi')}</div>
            <div class="ob ${_sdGetLang()==='en'?'on':''}" data-lang="en">${_t('editor_lang_en')}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="row">
          <label>${_t('editor_owner_label')} <span style="color:var(--secondary-text-color);font-weight:400">${_t('editor_owner_hint')}</span></label>
          <input type="text" id="ownerName" placeholder="${_t('editor_owner_ph')}" value="${cfg.name || ''}"/>
        </div>
        <div class="row">
          <label>${_t('editor_char_label')} <span style="font-weight:400;opacity:.7">${_t('editor_char_hint')}</span></label>
          <input type="text" id="charNickname" placeholder="${_t('editor_char_ph')}" value="${cfg.char_nickname || ''}"/>
        </div>
        <div class="sl-row">
          <label>${_t('editor_height_label')}</label>
          <input type="range" id="heightSl" min="300" max="700" step="20" value="${cfg.height || 440}"/>
          <span class="slv" id="heightV">${cfg.height || 440}px</span>
        </div>
      </div>
    </div>

    <!-- ══ APPEARANCE ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-appearance"><span>${_t('editor_title_appearance')}</span><span class="acc-arrow" id="arrow-appearance">${this._open.appearance?'▾':'▸'}</span></div>
      <div class="acc-body" id="body-appearance" style="display:${this._open.appearance?'block':'none'}">
        <div class="sl-row">
          <label>${_t('editor_blur_label')}</label>
          <input type="range" id="blurSl" min="0" max="30" step="1" value="${cfg.card_blur || 0}"/>
          <span class="slv" id="blurV">${cfg.card_blur || 0}px</span>
        </div>
        <div class="hint" style="margin-top:-8px;margin-bottom:12px">${_t('editor_blur_hint')}</div>
        <div class="divider"></div>
        <div class="tag">${_t('editor_float_tag')}</div>
        <div class="sl-row">
          <label>${_t('editor_float_h_label')}</label>
          <input type="range" id="floatHSl" min="300" max="900" step="20" value="${cfg.float_height || 600}"/>
          <span class="slv" id="floatHV">${cfg.float_height || 600}px</span>
        </div>
        <div class="sl-row">
          <label>${_t('editor_float_w_label')}</label>
          <input type="range" id="floatWSl" min="200" max="600" step="20" value="${cfg.float_width || 380}"/>
          <span class="slv" id="floatWV">${cfg.float_width || 380}px</span>
        </div>
      </div>
    </div>

    <!-- ══ SERVER SENSORS ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-sensors"><span>${_t('editor_title_sensors')}</span><span class="acc-arrow" id="arrow-sensors">${this._open.sensors?'▾':'▸'}</span></div>
      <div class="acc-body" id="body-sensors" style="display:${this._open.sensors?'block':'none'}">
        <div class="hint" style="margin-bottom:10px">${_t('editor_sensors_hint')}</div>

        <table class="thresh-table">
          <tr><th>${_t('editor_thresh_type')}</th><th class="warn">⚠️ Warn</th><th class="crit">🚨 Critical</th></tr>
          <tr><td>CPU</td><td class="warn">≥${thresh.cpu.warn}%</td><td class="crit">≥${thresh.cpu.crit}%</td></tr>
          <tr><td>RAM</td><td class="warn">≥${thresh.ram.warn}%</td><td class="crit">≥${thresh.ram.crit}%</td></tr>
          <tr><td>Disk</td><td class="warn">≥${thresh.disk.warn}%</td><td class="crit">≥${thresh.disk.crit}%</td></tr>
          <tr><td>CPU Temp</td><td class="warn">≥${thresh.temp.warn}°C</td><td class="crit">≥${thresh.temp.crit}°C</td></tr>
          <tr><td>Drive Temp</td><td class="warn">≥${thresh.disk_temp.warn}°C</td><td class="crit">≥${thresh.disk_temp.crit}°C</td></tr>
        </table>

        <div id="sensor-list-default">
${Object.entries(SD_SERVER_SENSORS).map(([group, sensors]) => `
          <div class="tag">${_t('sensor_groups')[group]||group}</div>
${sensors.map(s => `
          <div class="entity-row" data-sensor-key="${s.key}">
            <div class="entity-row-top">
              <span class="icon-tag">${{cpu:'⚡',ram:'🧠',disk:'💾',temp:'🌡️',disk_temp:'🌡️'}[s.type]||'📊'}</span>
              <input type="text" class="label-input" data-key="${s.key}" placeholder="${s.label}" value="${(cfg.labels&&cfg.labels[s.key])||''}" title="${_t('editor_sensor_rename_ph')}"/>
            </div>
            <ha-entity-picker data-key="${s.key}" allow-custom-entity></ha-entity-picker>
          </div>`).join('')}
          <div class="divider"></div>
`).join('')}
        </div>

        <div id="sensor-list-custom">
${(cfg.custom_sensors||[]).map((s,i) => `
          <div class="entity-row" data-custom-sensor-idx="${i}">
            <div class="entity-row-top">
              <input type="text" class="custom-sensor-label" data-idx="${i}" placeholder="${_t('editor_custom_sensor_ph')}" value="${s.label||''}"/>
              <select class="type-sel custom-sensor-type" data-idx="${i}">
                ${['cpu','ram','disk','temp','disk_temp'].map(t=>`<option value="${t}"${s.type===t?' selected':''}>${t}</option>`).join('')}
              </select>
              <button class="btn-del" data-del-sensor="${i}" title="🗑️">🗑️</button>
            </div>
            <ha-entity-picker data-custom-sensor="${i}" allow-custom-entity></ha-entity-picker>
          </div>`).join('')}
        </div>
        <button class="btn-add" id="btn-add-sensor">${_t('editor_add_sensor')}</button>
      </div>
    </div>

    <!-- ══ SERVICES ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-services"><span>${_t('editor_title_services')}</span><span class="acc-arrow" id="arrow-services">${this._open.services?'▾':'▸'}</span></div>
      <div class="acc-body" id="body-services" style="display:${this._open.services?'block':'none'}">
        <div class="hint" style="margin-bottom:12px">${_t('editor_services_hint')}</div>

        <div id="service-list-default">
${SD_SERVICES.map(s => `
          <div class="entity-row" data-service-key="${s.key}">
            <div class="entity-row-top">
              <input type="text" class="label-input" data-key="${s.key}" placeholder="${s.label}" value="${(cfg.labels&&cfg.labels[s.key])||''}"/>
            </div>
            <ha-entity-picker data-key="${s.key}" allow-custom-entity></ha-entity-picker>
          </div>`).join('')}
        </div>

        <div id="service-list-custom">
${(cfg.custom_services||[]).map((s,i) => `
          <div class="entity-row" data-custom-service-idx="${i}">
            <div class="entity-row-top">
              <input type="text" class="custom-service-label" data-idx="${i}" placeholder="${_t('editor_service_ph')}" value="${s.label||''}"/>
              <button class="btn-del" data-del-service="${i}" title="🗑️">🗑️</button>
            </div>
            <ha-entity-picker data-custom-service="${i}" allow-custom-entity></ha-entity-picker>
          </div>`).join('')}
        </div>
        <button class="btn-add" id="btn-add-service">${_t('editor_add_service')}</button>
      </div>
    </div>

    <!-- ══ TTS ══ -->
    <div class="acc-wrap">
      <div class="acc-head" id="head-tts"><span>${_t('editor_title_tts')}</span><span class="acc-arrow" id="arrow-tts">${this._open.tts?'▾':'▸'}</span></div>
      <div class="acc-body" id="body-tts" style="display:${this._open.tts?'block':'none'}">
        <div class="row" style="margin-bottom:14px">
          <label>${_t('editor_tts_engine')}</label>
          <div class="bg" id="ttsEngGrid">
            <div class="ob ${ttsEng==='webspeech'?'on':''}"       data-eng="webspeech">🗣️ WebSpeech</div>
            <div class="ob ${ttsEng==='google_translate'?'on':''}" data-eng="google_translate">🌐 Google TTS</div>
            <div class="ob ${ttsEng==='ha_service'?'on':''}"       data-eng="ha_service">🏠 HA Service</div>
            <div class="ob ${ttsEng==='none'?'on':''}"             data-eng="none">${_t('editor_tts_off')}</div>
          </div>
        </div>
        <div class="tts-section ${ttsEng==='webspeech'?'show':''}" id="tts-webspeech">
          <div class="sec-opts">
            <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin-bottom:10px">${_t('editor_ws_title')}</div>
            <div class="sl-row">
              <label>${_t('editor_ws_lang')}</label>
              <div class="bg" style="flex:1">
                ${[['vi-VN','🇻🇳 VI'],['en-US','🇺🇸 EN'],['ja-JP','🇯🇵 JP']].map(
                  ([v,l]) => `<div class="ob ${ttsLang===v?'on':''}" data-tts-lang="${v}">${l}</div>`
                ).join('')}
              </div>
            </div>
            <div class="sl-row">
              <label>${_t('editor_ws_rate')}</label>
              <input type="range" id="ttsRateSl" min="0.5" max="2.0" step="0.05" value="${ttsRate}"/>
              <span class="slv" id="ttsRateV">${parseFloat(ttsRate).toFixed(2)}</span>
            </div>
            <div class="sl-row" style="margin-bottom:0">
              <label>${_t('editor_ws_pitch')}</label>
              <input type="range" id="ttsPitchSl" min="0" max="2" step="0.1" value="${ttsPitch}"/>
              <span class="slv" id="ttsPitchV">${parseFloat(ttsPitch).toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div class="tts-section ${ttsEng==='google_translate'?'show':''}" id="tts-google_translate">
          <div class="sec-opts">
            <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin-bottom:10px">${_t('editor_gt_title')}</div>
            <div class="hint" style="margin-bottom:8px">${_t('editor_gt_hint')}</div>
            <div class="row" style="margin-bottom:0">
              <label>${_t('editor_gt_lang')}</label>
              <div class="bg">
                ${[['vi','🇻🇳 vi'],['en','🇺🇸 en'],['ja','🇯🇵 ja']].map(
                  ([v,l]) => `<div class="ob ${(cfg.tts&&cfg.tts.lang)===v?'on':''}" data-tts-lang="${v}">${l}</div>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="tts-section ${ttsEng==='ha_service'?'show':''}" id="tts-ha_service">
          <div class="sec-opts">
            <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin-bottom:10px">${_t('editor_ha_title')}</div>
            <div class="row">
              <label>${_t('editor_ha_svc')} <span style="font-weight:400;opacity:.7">${_t('editor_svc_hint_val')}</span></label>
              <input type="text" id="ttsSvcInput" placeholder="${_t('editor_ha_svc_ph')}" value="${ttsSvc}"/>
            </div>
            <div class="row">
              <label>${_t('editor_ha_entity')}</label>
              <ha-entity-picker id="ttsEntityPicker" allow-custom-entity></ha-entity-picker>
            </div>
            <div class="row" style="margin-bottom:0">
              <label>${_t('editor_ha_media')} <span style="font-weight:400;opacity:.7">${_t('editor_ha_media_hint')}</span></label>
              <ha-entity-picker id="ttsMpPicker" data-domain="media_player" allow-custom-entity></ha-entity-picker>
            </div>
          </div>
        </div>
        <div class="tts-section ${ttsEng==='none'?'show':''}" id="tts-none">
          <div class="hint" style="padding:8px 0">${_t('editor_tts_none_hint')}</div>
        </div>
      </div>
    </div>

    <div style="margin:8px 14px 4px;padding:10px 12px;background:var(--secondary-background-color);border-radius:8px;border:1px solid var(--divider-color);font-size:11px;color:var(--secondary-text-color);line-height:1.6">
      ${_t('editor_tip')}
    </div>`;

    // ── Accordions ──────────────────────────────────────────────
    ['general','appearance','sensors','services','tts'].forEach(id => {
      const h = this.shadowRoot.getElementById('head-' + id);
      if (h) h.addEventListener('click', () => this._toggle(id));
    });

    // ── Language selector ────────────────────────────────────────
    this.shadowRoot.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        _sdSetLang(lang);
        this._render(); // re-render editor with new lang
        // Also force re-render the card by dispatching config-changed
        this._fire();
      });
    });

    // ── Inputs ──────────────────────────────────────────────────
    this.shadowRoot.getElementById('ownerName').addEventListener('change', e => {
      const v = e.target.value.trim();
      const c = { ...this._config }; if (v) c.name = v; else delete c.name;
      this._config = c; this._fire();
    });
    this.shadowRoot.getElementById('charNickname').addEventListener('change', e => {
      const v = e.target.value.trim();
      const c = { ...this._config }; if (v) c.char_nickname = v; else delete c.char_nickname;
      this._config = c; this._fire();
    });

    const heightSl = this.shadowRoot.getElementById('heightSl');
    const heightV  = this.shadowRoot.getElementById('heightV');
    heightSl.addEventListener('input',  e => heightV.textContent = e.target.value + 'px');
    heightSl.addEventListener('change', e => { this._config = { ...this._config, height: parseInt(e.target.value) }; this._fire(); });

    const blurSl = this.shadowRoot.getElementById('blurSl');
    const blurV  = this.shadowRoot.getElementById('blurV');
    blurSl.addEventListener('input',  e => blurV.textContent = e.target.value + 'px');
    blurSl.addEventListener('change', e => { this._config = { ...this._config, card_blur: parseInt(e.target.value) }; this._fire(); });

    const floatHSl = this.shadowRoot.getElementById('floatHSl');
    const floatHV  = this.shadowRoot.getElementById('floatHV');
    floatHSl.addEventListener('input',  e => floatHV.textContent = e.target.value + 'px');
    floatHSl.addEventListener('change', e => { this._config = { ...this._config, float_height: parseInt(e.target.value) }; this._fire(); });
    const floatWSl = this.shadowRoot.getElementById('floatWSl');
    const floatWV  = this.shadowRoot.getElementById('floatWV');
    floatWSl.addEventListener('input',  e => floatWV.textContent = e.target.value + 'px');
    floatWSl.addEventListener('change', e => { this._config = { ...this._config, float_width: parseInt(e.target.value) }; this._fire(); });

    // TTS engine buttons
    this.shadowRoot.querySelectorAll('[data-eng]').forEach(btn => {
      btn.addEventListener('click', () => {
        const eng = btn.dataset.eng;
        const tts = { ...(this._config.tts || {}), engine: eng };
        this._config = { ...this._config, tts }; this._fire();
        ['webspeech','google_translate','ha_service','none'].forEach(e => {
          const sec = this.shadowRoot.getElementById('tts-' + e);
          if (sec) sec.classList.toggle('show', e === eng);
        });
        this.shadowRoot.querySelectorAll('[data-eng]').forEach(b => b.classList.toggle('on', b.dataset.eng === eng));
      });
    });

    // TTS lang buttons
    this.shadowRoot.querySelectorAll('[data-tts-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.ttsLang;
        const tts  = { ...(this._config.tts || {}), lang };
        this._config = { ...this._config, tts }; this._fire();
        this.shadowRoot.querySelectorAll('[data-tts-lang]').forEach(b => b.classList.toggle('on', b.dataset.ttsLang === lang));
      });
    });

    const ttsRateSl = this.shadowRoot.getElementById('ttsRateSl');
    const ttsRateV  = this.shadowRoot.getElementById('ttsRateV');
    if (ttsRateSl) {
      ttsRateSl.addEventListener('input',  e => ttsRateV.textContent = parseFloat(e.target.value).toFixed(2));
      ttsRateSl.addEventListener('change', e => { const tts = { ...(this._config.tts || {}), rate: parseFloat(e.target.value) }; this._config = { ...this._config, tts }; this._fire(); });
    }
    const ttsPitchSl = this.shadowRoot.getElementById('ttsPitchSl');
    const ttsPitchV  = this.shadowRoot.getElementById('ttsPitchV');
    if (ttsPitchSl) {
      ttsPitchSl.addEventListener('input',  e => ttsPitchV.textContent = parseFloat(e.target.value).toFixed(1));
      ttsPitchSl.addEventListener('change', e => { const tts = { ...(this._config.tts || {}), pitch: parseFloat(e.target.value) }; this._config = { ...this._config, tts }; this._fire(); });
    }
    const ttsSvcInput = this.shadowRoot.getElementById('ttsSvcInput');
    if (ttsSvcInput) {
      ttsSvcInput.addEventListener('change', e => { const tts = { ...(this._config.tts || {}), service: e.target.value.trim() }; this._config = { ...this._config, tts }; this._fire(); });
    }

    // ── Label inputs (đổi tên entity) ───────────────────────────
    this.shadowRoot.querySelectorAll('input.label-input[data-key]').forEach(inp => {
      inp.addEventListener('change', e => {
        const k = inp.dataset.key;
        const v = e.target.value.trim();
        const labels = { ...(this._config.labels || {}) };
        if (v) labels[k] = v; else delete labels[k];
        this._config = { ...this._config, labels }; this._fire();
      });
    });

    // ── Custom sensor: label, type, entity picker, xóa ──────────
    this.shadowRoot.querySelectorAll('.custom-sensor-label').forEach(inp => {
      inp.addEventListener('change', e => {
        const i   = parseInt(inp.dataset.idx);
        const arr = [...(this._config.custom_sensors || [])];
        if (!arr[i]) return;
        arr[i] = { ...arr[i], label: e.target.value.trim() };
        // Đồng bộ labels map luôn
        const labels = { ...(this._config.labels || {}) };
        if (arr[i].label) labels[arr[i].key] = arr[i].label; else delete labels[arr[i].key];
        this._config = { ...this._config, custom_sensors: arr, labels }; this._fire();
      });
    });
    this.shadowRoot.querySelectorAll('.custom-sensor-type').forEach(sel => {
      sel.addEventListener('change', e => {
        const i   = parseInt(sel.dataset.idx);
        const arr = [...(this._config.custom_sensors || [])];
        if (!arr[i]) return;
        arr[i] = { ...arr[i], type: e.target.value };
        this._config = { ...this._config, custom_sensors: arr }; this._fire();
      });
    });
    this.shadowRoot.querySelectorAll('[data-del-sensor]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i   = parseInt(btn.dataset.delSensor);
        const arr = [...(this._config.custom_sensors || [])];
        arr.splice(i, 1);
        this._config = { ...this._config, custom_sensors: arr }; this._fire();
        this._render();
      });
    });
    // Custom sensor entity pickers
    this.shadowRoot.querySelectorAll('ha-entity-picker[data-custom-sensor]').forEach(picker => {
      picker.addEventListener('value-changed', e => {
        const i   = parseInt(picker.dataset.customSensor);
        const arr = [...(this._config.custom_sensors || [])];
        if (!arr[i]) return;
        arr[i] = { ...arr[i], entity: e.detail.value || '' };
        this._config = { ...this._config, custom_sensors: arr }; this._fire();
      });
    });
    // Nút thêm sensor mới
    const btnAddSensor = this.shadowRoot.getElementById('btn-add-sensor');
    if (btnAddSensor) {
      btnAddSensor.addEventListener('click', () => {
        const arr  = [...(this._config.custom_sensors || [])];
        const idx  = arr.length;
        arr.push({ key: 'custom_sensor_' + Date.now(), entity: '', type: 'cpu', label: 'Custom Sensor ' + (idx + 1) });
        this._config = { ...this._config, custom_sensors: arr }; this._fire();
        this._render();
      });
    }

    // ── Custom service: label, entity picker, xóa ───────────────
    this.shadowRoot.querySelectorAll('.custom-service-label').forEach(inp => {
      inp.addEventListener('change', e => {
        const i   = parseInt(inp.dataset.idx);
        const arr = [...(this._config.custom_services || [])];
        if (!arr[i]) return;
        arr[i] = { ...arr[i], label: e.target.value.trim() };
        const labels = { ...(this._config.labels || {}) };
        if (arr[i].label) labels[arr[i].key] = arr[i].label; else delete labels[arr[i].key];
        this._config = { ...this._config, custom_services: arr, labels }; this._fire();
      });
    });
    this.shadowRoot.querySelectorAll('[data-del-service]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i   = parseInt(btn.dataset.delService);
        const arr = [...(this._config.custom_services || [])];
        arr.splice(i, 1);
        this._config = { ...this._config, custom_services: arr }; this._fire();
        this._render();
      });
    });
    // Custom service entity pickers
    this.shadowRoot.querySelectorAll('ha-entity-picker[data-custom-service]').forEach(picker => {
      picker.addEventListener('value-changed', e => {
        const i   = parseInt(picker.dataset.customService);
        const arr = [...(this._config.custom_services || [])];
        if (!arr[i]) return;
        arr[i] = { ...arr[i], entity: e.detail.value || '' };
        this._config = { ...this._config, custom_services: arr }; this._fire();
      });
    });
    // Nút thêm service mới
    const btnAddService = this.shadowRoot.getElementById('btn-add-service');
    if (btnAddService) {
      btnAddService.addEventListener('click', () => {
        const arr  = [...(this._config.custom_services || [])];
        const idx  = arr.length;
        arr.push({ key: 'custom_service_' + Date.now(), entity: '', label: 'Custom AP ' + (idx + 1) });
        this._config = { ...this._config, custom_services: arr }; this._fire();
        this._render();
      });
    }

    // Entity pickers (data-key)
    this.shadowRoot.querySelectorAll('ha-entity-picker[data-key]').forEach(picker => {
      picker.addEventListener('value-changed', e => {
        const k = picker.dataset.key;
        const v = e.detail.value;
        const c = { ...this._config };
        if (v) c[k] = v; else delete c[k];
        this._config = c; this._fire();
      });
    });

    // TTS entity pickers (no data-key)
    const ttsEP = this.shadowRoot.getElementById('ttsEntityPicker');
    if (ttsEP) {
      if (this._hass) ttsEP.hass = this._hass;
      const ttsEntVal = (cfg.tts && cfg.tts.entity_id) || '';
      if (ttsEntVal) { ttsEP.value = ttsEntVal; ttsEP.setAttribute('value', ttsEntVal); }
      ttsEP.addEventListener('value-changed', e => {
        const tts = { ...(this._config.tts || {}), entity_id: e.detail.value || undefined };
        if (!e.detail.value) delete tts.entity_id;
        this._config = { ...this._config, tts }; this._fire();
      });
    }
    const ttsMpP = this.shadowRoot.getElementById('ttsMpPicker');
    if (ttsMpP) {
      if (this._hass) { ttsMpP.hass = this._hass; ttsMpP.includeDomains = ['media_player']; }
      const ttsMpVal = (cfg.tts && (cfg.tts.media_player_entity_id || cfg.tts.media_player)) || '';
      if (ttsMpVal) { ttsMpP.value = ttsMpVal; ttsMpP.setAttribute('value', ttsMpVal); }
      ttsMpP.addEventListener('value-changed', e => {
        const v = e.detail.value || '';
        const tts = { ...(this._config.tts || {}), media_player_entity_id: v || undefined };
        if (!v) delete tts.media_player_entity_id;
        this._config = { ...this._config, tts }; this._fire();
      });
    }

    this._syncPickers();
  }

  _syncPickers() {
    if (!this._hass || !this.shadowRoot) return;
    const apply = () => {
      // Default sensor/service pickers (data-key)
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-key]').forEach(p => {
        p.hass = this._hass;
        const domain = p.dataset.domain;
        if (domain) p.includeDomains = [domain];
        const key    = p.dataset.key;
        const defSensor  = SD_ALL_SENSORS.find(s => s.key === key);
        const defService = SD_SERVICES.find(s => s.key === key);
        const defVal     = (defSensor || defService)?.entity || '';
        const saved      = this._config[key] || defVal;
        if (saved && p.value !== saved) { p.value = saved; p.setAttribute('value', saved); }
      });

      // Custom sensor pickers
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-custom-sensor]').forEach(p => {
        p.hass = this._hass;
        const i   = parseInt(p.dataset.customSensor);
        const arr = this._config.custom_sensors || [];
        const val = arr[i]?.entity || '';
        if (val && p.value !== val) { p.value = val; p.setAttribute('value', val); }
      });

      // Custom service pickers
      this.shadowRoot.querySelectorAll('ha-entity-picker[data-custom-service]').forEach(p => {
        p.hass = this._hass;
        const i   = parseInt(p.dataset.customService);
        const arr = this._config.custom_services || [];
        const val = arr[i]?.entity || '';
        if (val && p.value !== val) { p.value = val; p.setAttribute('value', val); }
      });
    };
    apply();
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }
}

if (!customElements.get('sys-desk-editor')) {
  customElements.define('sys-desk-editor', SysDeskEditor);
}

// ─── Hook editor vào card ─────────────────────────────────────
SysDesk.getConfigElement = function() {
  return document.createElement('sys-desk-editor');
};
SysDesk.getStubConfig = function() {
  return {
    type: 'custom:sys-desk',
    name: 'Anh Long',
    // Server sensors (mặc định — chỉ khai báo khi entity khác)
    ha_cpu:       'sensor.system_monitor_processor_use',
    ha_disk:      'sensor.system_monitor_disk_usage',
    ha_ram:       'sensor.system_monitor_memory_usage',
    ha_temp:      'sensor.system_monitor_processor_temperature',
    pf_cpu:       'sensor.pfsense_cpu_usage',
    pf_ram:       'sensor.pfsense_memory_used',
    fri_cpu:      'sensor.frigate_200_cpu_used',
    fri_ram:      'sensor.qemu_frigate_200_memory_used_percentage',
    nas_cpu:      'sensor.nas_cpu',
    nas_ram:      'sensor.nas_memory',
    nas_disk_temp:'sensor.data_drive_1_temperature',
    // Services
    adguard: 'switch.adguard_home_protection',
    wifi_5:  'sensor.5_office_state',
    wifi_6:  'sensor.6_living_state',
    wifi_7:  'sensor.7_kitchen_state',
    wifi_8:  'sensor.8_garage_state',
    wifi_9:  'sensor.9_outside_state',
    nano_hd: 'sensor.nano_hd_state',
  };
};

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sys-desk',
  name: 'SysDesk',
  description: _t('card_description'),
  preview: true,
});
