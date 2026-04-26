# 🖥️ SysDesk

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![version](https://img.shields.io/badge/version-1.0-blue)
![HA](https://img.shields.io/badge/Home%20Assistant-2023.1+-green)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

> 🇬🇧 **English version (main):** [README.md](README.md)

**Server của bạn vừa có người gác đêm riêng.** Một nhân vật anime Live2D sống ngay trong card Home Assistant, theo dõi CPU, RAM, disk và nhiệt độ theo thời gian thực, cảnh báo ngay khi bất kỳ chỉ số nào vượt ngưỡng — và nói to mọi cảnh báo bằng giọng thật. Ghim cô ấy vào góc màn hình và cô ấy nổi trên toàn bộ dashboard, luôn theo dõi, luôn ở đó.

Một card. Không cần cài thêm gì. Chạy thẳng vào Home Assistant.

> 🌐 **Hiện tại chỉ hỗ trợ tiếng Việt 🇻🇳 và tiếng Anh 🇬🇧.**
> Nếu bạn thấy SysDesk hay, hãy ⭐ **star repo** hoặc [☕ ủng hộ 1 ly cafe](https://www.paypal.com/paypalme/doanlong1412) để tôi có động lực tiếp tục!

---

## 📸 Preview

![SysDesk Preview](assets/preview1.png)

![SysDesk Preview](assets/preview2.png)

---

## ✨ Điểm khác biệt

Hầu hết server dashboard chỉ ném con số vào mặt bạn. SysDesk **trao cho những con số đó một giọng nói và một khuôn mặt**. UMP45 cảnh báo ngay khi CPU vượt 70%. HK416 báo cáo disk sắp đầy trước khi service crash. SOPMOD hét lên khi WiFi AP đi offline. Bong bóng thoại tự chuyển liên tục, và tất cả — lời chào, phản ứng, giọng nói — đều được điều khiển bởi sensor Home Assistant thực tế của bạn, theo thời gian thực.

---

## 🚀 Tính năng

---

### 💜 9 Nhân vật Girls' Frontline — đổi trong một cú chạm

Chín nhân vật Live2D từ Girls' Frontline được tuyển chọn kỹ càng, mỗi nhân vật có cá tính và lời chào riêng. Chuyển đổi giữa các nhân vật ngay trên card — tải tức thì từ CDN, không cần file cục bộ.

| Nhân vật | Cá tính |
|----------|---------|
| **UMP45 🔫** | Sắc bén và cảnh giác, luôn trực chiến |
| **M4A1 🛡️** | Bình tĩnh, đáng tin cậy, sinh ra để bảo vệ |
| **SOPMOD-II 🔥** | Năng động và bùng nổ, không gì qua mắt được |
| **HK416 🎯** | Kỷ luật và chính xác, zero tolerance với anomaly |
| **K2 🌸** | Dịu dàng và an ủi, luôn ở đây bên bạn |
| **PKP 🍵** | Thư thái nhưng tỉ mỉ — server ổn rồi, đi uống trà đi |
| **RFB 🎄** | Cảnh giác và vững chắc, không gì lọt khỏi tầm ngắm |
| **Lewis 🌼** | Ấm áp và đáng tin, lặng lẽ canh gác mọi thứ |
| **DSR-50 🔭** | Mắt thần, không có anomaly nào thoát được |
| **Gelina ⚙️** | Phương pháp và chính xác, tất cả sensor đã kết nối |

Nút ◀ ▶ trên card chuyển qua lại giữa các nhân vật. Nhân vật được chọn cuối cùng được lưu qua `localStorage` — cô ấy vẫn ở đó khi bạn quay lại.

---

### 📌 Chế độ Mini + Ghim — nổi trên toàn bộ dashboard

Nhấn **Mini** và nhân vật thu gọn thành widget nổi ở góc dưới bên phải màn hình. Nhấn **Ghim** và cô ấy hiển thị liên tục trên mọi Lovelace view, mọi subpage, mọi dashboard — cô ấy đi theo bạn khắp nơi.

**Chế độ Mini / Ghim làm gì:**
- Nhân vật thu nhỏ và nổi ở góc dưới bên phải cửa sổ trình duyệt
- Hiển thị liên tục qua tất cả Lovelace view — cô ấy đi theo bạn khắp nơi
- Bong bóng thoại vẫn hiện với phản ứng và cảnh báo
- TTS vẫn nói — bạn nghe thấy cô ấy ngay cả khi thu nhỏ
- Đúp click vào nhân vật đang nổi để quay về card đầy đủ

Đây là tính năng khiến SysDesk cảm giác như một người trực NOC thật sự chứ không chỉ là một card.

---

### 🚨 Hệ thống cảnh báo thông minh — theo ngưỡng, TTS lặp tự động

Kết nối sensor server và nhân vật phản ứng ngay khi chỉ số nào vượt ngưỡng — với cảnh báo được đọc to bằng TTS và **lặp liên tục** cho đến khi vấn đề được giải quyết.

| Chỉ số | Cảnh báo | Nguy hiểm |
|--------|----------|-----------|
| CPU | ≥ 70% | ≥ 90% |
| RAM | ≥ 75% | ≥ 90% |
| Disk | ≥ 70% | ≥ 85% |
| Nhiệt độ CPU | ≥ 70°C | ≥ 85°C |
| Nhiệt độ ổ cứng | ≥ 40°C | ≥ 55°C |

- **Cảnh báo** — nhân vật giải thích vấn đề kèm hướng xử lý thực tế (xem log, restart service, dọn disk…)
- **Nguy hiểm** — cảnh báo khẩn cấp, quyết đoán, yêu cầu xử lý ngay
- **Dịch vụ offline** — thông báo tức thì khi bất kỳ service hoặc AP nào đi xuống
- **TTS lặp tự động** — cảnh báo được đọc lại theo chu kỳ cho đến khi chỉ số trở về ngưỡng an toàn — bạn không thể bỏ qua

---

### 🖥️ Giám sát đa server — HA, pfSense, Frigate, NAS

SysDesk giám sát sensor trên toàn bộ homelab của bạn ngay từ đầu:

| Server | Chỉ số |
|--------|--------|
| 🏠 **Home Assistant** | CPU · Disk · RAM · Nhiệt độ CPU |
| 🔒 **pfSense** | CPU · RAM |
| 📷 **Frigate (VM)** | CPU · RAM |
| 💽 **NAS** | CPU · RAM · Nhiệt độ ổ cứng |

Thêm bất kỳ sensor tùy chỉnh nào — danh sách sensor có thể mở rộng hoàn toàn từ visual editor.

---

### 📡 Giám sát dịch vụ & Access Point

Kết nối bất kỳ switch, sensor, hay binary sensor nào — AdGuard, WiFi access point, thiết bị mạng — và nhân vật cảnh báo ngay khi trạng thái về `off` hoặc `unavailable`.

```yaml
adguard: switch.adguard_home_protection
wifi_5:  sensor.5_office_state
wifi_6:  sensor.6_living_state
nano_hd: sensor.nano_hd_state
```

---

### 💬 Bong bóng thoại thông minh — nhận biết ngữ cảnh, luôn mới

Bong bóng thoại không chỉ hiển thị con số. Nó biết mấy giờ rồi, hệ thống đang có vấn đề gì, và chào bạn theo đúng ngữ cảnh đó.

**Logic bong bóng:**
- **Lời chào theo buổi** — rạng sáng 🌅, sáng ☀️, trưa 🍱, chiều ⛅, tối 🌙, khuya 😴
- **Tóm tắt trạng thái hệ thống** — tất cả ổn ✅, hoặc liệt kê vấn đề đang có
- **Câu idle của nhân vật** — mỗi nhân vật có 6 câu idle riêng, xoay vòng tự động
- **Tên chủ nhân** — nhân vật gọi bạn bằng tên bạn đặt trong config
- **Tên tự xưng** — tuỳ chỉnh được (`{c}` thành tên cô ấy trong mọi câu thoại)

---

### 🔊 TTS — 4 engine, cấu hình linh hoạt

Nhân vật nói to mọi cảnh báo và lời chào. Bốn TTS engine được hỗ trợ.

| Engine | Mô tả |
|--------|-------|
| **Web Speech** | Giọng nói có sẵn trong trình duyệt — chạy mọi nơi, không cần cấu hình |
| **Google Translate** | Giọng Google rõ ràng qua audio tag — không cần addon HA |
| **HA Service (tts.speak)** | HA 2023.8+ native — phát trên trình duyệt hoặc loa vật lý |
| **HA Service (legacy)** | `tts.google_translate_say` / `tts.cloud_say` — thiết lập cũ |
| **None** | Tắt hoàn toàn TTS |

```yaml
tts:
  engine: ha_service
  service: tts.speak
  entity_id: tts.google_translate_vi_com
  media_player_entity_id: media_player.loa_phong_khach
  cache: true
```

---

### 🎛️ Visual Config Editor

Cấu hình mọi thứ mà không cần chạm vào YAML. Editor dùng accordion section gọn gàng:

| Section | Nội dung |
|---------|----------|
| ⚙️ **Cài đặt chung** | Tên chủ nhân, tên tự xưng, chiều cao card |
| 🎨 **Giao diện** | Blur nền, kích thước chế độ mini / ghim |
| 🖥️ **Server Sensors** | Sensor mặc định + sensor tùy chỉnh, đổi tên, chọn entity |
| 📡 **Dịch vụ & AP** | Dịch vụ mặc định + tùy chỉnh, entity picker |
| 🔊 **TTS** | Engine, ngôn ngữ, tốc độ, pitch, cấu hình HA service |

---

## 📦 Cài đặt

### Cách 1 — HACS (khuyên dùng, 30 giây)

**Bước 1** — Thêm repo vào HACS:

[![Open HACS Repository](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=doanlong1412&repository=sys-desk&category=plugin)

> Nếu nút không hoạt động, thêm thủ công:
> **HACS → Frontend → ⋮ → Custom repositories**
> URL: `https://github.com/doanlong1412/sys-desk` → Type: **Dashboard** → Add

**Bước 2** — Tìm **SysDesk** → **Install**

**Bước 3** — Hard reload trình duyệt (`Ctrl+Shift+R`)

---

### Cách 2 — Thủ công

1. Tải file [`sysdesk.js`](https://github.com/doanlong1412/sys-desk/releases/latest)
2. Copy vào `/config/www/js/sysdesk.js`
3. **Settings → Dashboards → Resources → Add resource:**
   ```
   URL:  /local/js/sysdesk.js
   Type: JavaScript module
   ```
4. Hard reload (`Ctrl+Shift+R`)

---

## ⚙️ Cấu hình

Thêm card vào dashboard:

```yaml
type: custom:sys-desk
```

Rồi nhấn **✏️ Edit** — visual editor lo hết phần còn lại.

---

### Ví dụ YAML đầy đủ

```yaml
type: custom:sys-desk
name: Long                        # tên của bạn — nhân vật sẽ gọi tên này
char_nickname: UMP45              # tuỳ chọn: ghi đè tên tự xưng của nhân vật
height: 440                       # chiều cao card (px)
float_height: 600                 # chiều cao nhân vật chế độ mini / ghim
float_width:  380                 # chiều rộng chế độ mini / ghim
card_blur: 0                      # độ mờ nền (0 = trong suốt hoàn toàn)

# ── Server Sensors (mặc định — chỉ khai báo nếu entity của bạn khác) ──
ha_cpu:        sensor.system_monitor_processor_use
ha_disk:       sensor.system_monitor_disk_usage
ha_ram:        sensor.system_monitor_memory_usage
ha_temp:       sensor.system_monitor_processor_temperature
pf_cpu:        sensor.pfsense_cpu_usage
pf_ram:        sensor.pfsense_memory_used
fri_cpu:       sensor.frigate_200_cpu_used
fri_ram:       sensor.qemu_frigate_200_memory_used_percentage
nas_cpu:       sensor.nas_cpu
nas_ram:       sensor.nas_memory
nas_disk_temp: sensor.data_drive_1_temperature

# ── Dịch vụ / AP ──
adguard: switch.adguard_home_protection
wifi_5:  sensor.5_office_state
wifi_6:  sensor.6_living_state
wifi_7:  sensor.7_kitchen_state
wifi_8:  sensor.8_garage_state
wifi_9:  sensor.9_outside_state
nano_hd: sensor.nano_hd_state

tts:
  engine: webspeech
  lang: vi-VN
  rate: 1.05
  pitch: 1.1
```

---

### Tham chiếu cấu hình

| Key | Mặc định | Mô tả |
|-----|----------|-------|
| `name` | `admin` | Tên chủ nhân — dùng trong mọi cảnh báo và lời chào |
| `char_nickname` | *(tên mặc định nhân vật)* | Ghi đè tên tự xưng của nhân vật |
| `height` | `440` | Chiều cao card (px) |
| `float_height` | `600` | Chiều cao nhân vật chế độ mini / ghim (px) |
| `float_width` | `380` | Chiều rộng chế độ mini / ghim (px) |
| `card_blur` | `0` | Độ mờ nền (0–30) |
| `ha_cpu` | `sensor.system_monitor_processor_use` | Sensor CPU của HA |
| `ha_disk` | `sensor.system_monitor_disk_usage` | Sensor Disk của HA |
| `ha_ram` | `sensor.system_monitor_memory_usage` | Sensor RAM của HA |
| `ha_temp` | `sensor.system_monitor_processor_temperature` | Sensor nhiệt độ CPU của HA |
| `pf_cpu` | `sensor.pfsense_cpu_usage` | Sensor CPU pfSense |
| `pf_ram` | `sensor.pfsense_memory_used` | Sensor RAM pfSense |
| `fri_cpu` | `sensor.frigate_200_cpu_used` | Sensor CPU Frigate |
| `fri_ram` | `sensor.qemu_frigate_200_memory_used_percentage` | Sensor RAM Frigate |
| `nas_cpu` | `sensor.nas_cpu` | Sensor CPU NAS |
| `nas_ram` | `sensor.nas_memory` | Sensor RAM NAS |
| `nas_disk_temp` | `sensor.data_drive_1_temperature` | Sensor nhiệt độ ổ NAS |
| `adguard` | `switch.adguard_home_protection` | Switch AdGuard |
| `wifi_5–9` | *(office/living/kitchen/garage/outside)* | Sensor WiFi AP |
| `nano_hd` | `sensor.nano_hd_state` | Sensor Nano HD AP |

---

### Tham chiếu TTS engine

#### Web Speech (mặc định)
```yaml
tts:
  engine: webspeech
  lang: vi-VN      # tuỳ chọn
  rate: 1.05       # 0.5–2.0
  pitch: 1.1       # 0–2
```

#### Google Translate
```yaml
tts:
  engine: google_translate
  lang: vi
```

#### HA Service — tts.speak (HA 2023.8+, khuyên dùng)
```yaml
tts:
  engine: ha_service
  service: tts.speak
  entity_id: tts.google_translate_vi_com
  media_player_entity_id: media_player.loa_phong_khach   # tuỳ chọn
  cache: true
```

#### HA Service — legacy
```yaml
tts:
  engine: ha_service
  service: tts.google_translate_say
  entity_id: media_player.loa_phong_khach
  lang: vi
```

#### Tắt TTS
```yaml
tts:
  engine: none
```

---

## 🖥️ Tương thích

| | |
|---|---|
| Home Assistant | 2023.1+ |
| Lovelace | Default & custom dashboard |
| Thiết bị | Mobile & Desktop |
| Dependencies | **Không cần cài thêm** |
| Trình duyệt | Chrome, Firefox, Safari, Edge |

---

## 📋 Changelog

### v1.0.0
- 🖥️ **9 nhân vật Girls' Frontline** — UMP45, M4A1, SOPMOD-II, HK416, K2, PKP, RFB, Lewis, DSR-50, Gelina — đổi qua nút ◀ ▶, nhớ qua localStorage
- 📌 **Chế độ Mini + Ghim** — nhân vật thu gọn thành widget nổi góc màn hình, hiển thị liên tục trên mọi Lovelace view
- 🚨 **Hệ thống cảnh báo theo ngưỡng** — CPU, RAM, Disk, Nhiệt độ CPU, Nhiệt độ ổ cứng với mức warn + critical
- 🔁 **TTS lặp tự động** — cảnh báo được đọc lại cho đến khi chỉ số về ngưỡng an toàn
- 🖥️ **Giám sát đa server** — Home Assistant, pfSense, Frigate, NAS ngay từ đầu
- 📡 **Giám sát dịch vụ & AP** — AdGuard, WiFi AP, bất kỳ switch hoặc sensor nào
- 💬 **Bong bóng thoại thông minh** — nhận biết thời gian, tóm tắt hệ thống, câu idle riêng theo nhân vật
- 🔊 **4 TTS engine** — Web Speech, Google Translate, HA Service (tts.speak + legacy), hoặc None
- 🎛️ **Visual Config Editor** — accordion section, thêm/đổi tên/xóa sensor và dịch vụ, không cần YAML
- 🌐 **i18n** — Tiếng Việt 🇻🇳 và tiếng Anh 🇬🇧, đổi ngay trong editor

---

## 📄 License

MIT — tự do sử dụng, chỉnh sửa, phân phối.
Nếu SysDesk khiến homelab của bạn thêm sống động, hãy ⭐ **star repo** để ủng hộ nhé!

---

## 🙏 Credits

Thiết kế và phát triển bởi **[@doanlong1412](https://github.com/doanlong1412)** từ 🇻🇳 Việt Nam.

> ☕ Nếu bạn thấy SysDesk hữu ích, hãy [ủng hộ 1 ly cafe](https://www.paypal.com/paypalme/doanlong1412) để tôi có động lực tiếp tục nhé!

Live2D models được host qua [jsdelivr CDN](https://www.jsdelivr.com/) — credit thuộc về các tác giả model gốc.
Live2D rendering sử dụng [live2d-widget](https://github.com/zenghongtu/live2d-model-assets).
