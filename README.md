# 🖥️ SysDesk

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![version](https://img.shields.io/badge/version-1.0-blue)
![HA](https://img.shields.io/badge/Home%20Assistant-2023.1+-green)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

> 🇻🇳 **Phiên bản tiếng Việt:** [README.vi.md](README.vi.md)

**Your server room now has a guardian.** An anime Live2D character lives inside your Home Assistant card, watches your CPU, RAM, disk, and temperatures in real time, alerts you the moment anything spikes — and speaks every warning out loud. Pin her to a corner and she floats above your entire dashboard, always watching, always present.

One card. Zero dependencies. Drops straight into Home Assistant.

> 🌐 **Currently available in Vietnamese 🇻🇳 and English 🇬🇧 only.**
> If you find SysDesk useful, please ⭐ **star the repo** or [☕ buy me a coffee](https://www.paypal.com/paypalme/doanlong1412) to keep the project going!

---

## 📸 Preview

![SysDesk Preview](assets/preview1.png)

![SysDesk Preview](assets/preview2.png)

---

## ✨ What makes this different

Most server dashboards throw raw numbers at you. SysDesk gives those numbers **a voice and a face**. UMP45 warns you the moment CPU crosses 70%. HK416 reports disk is nearly full before your services crash. SOPMOD shouts when a WiFi AP goes offline. The character cycles her speech bubble automatically, and everything — the greeting, the reaction, the voice — is driven by your actual Home Assistant sensors, in real time.

---

## 🚀 Features

---

### 💜 9 Girls' Frontline Characters — switchable in one tap

Nine hand-picked Live2D characters from Girls' Frontline, each with her own personality and greeting. Switch between them directly on the card — the character loads instantly from a CDN with no local files needed.

| Character | Personality |
|-----------|-------------|
| **UMP45 🔫** | Sharp and vigilant, always on duty |
| **M4A1 🛡️** | Calm, reliable, built to protect |
| **SOPMOD-II 🔥** | Energetic and explosive, catches everything |
| **HK416 🎯** | Disciplined and precise, zero tolerance for anomalies |
| **K2 🌸** | Gentle and reassuring, always here for you |
| **PKP 🍵** | Laid-back but thorough — servers stable, go have tea |
| **RFB 🎄** | Watchful and steady, nothing slips past her sights |
| **Lewis 🌼** | Warm and dependable, quietly guards everything |
| **DSR-50 🔭** | Hawk-eyed, no anomaly escapes her observation |
| **Gelina ⚙️** | Methodical and precise, all sensors online |

The ◀ ▶ buttons on the card cycle through all characters. The last chosen character is remembered via `localStorage` — she'll be there when you come back.

---

### 📌 Mini Mode + Pin — floats above your entire dashboard

Tap **Mini** and the character shrinks into a floating widget anchored to the bottom-right corner of your screen. Tap **Pin** and she stays visible across every Lovelace view, every subpage, every dashboard — she follows you everywhere.

**What Mini / Pin Mode does:**
- Character floats to the bottom-right corner of the browser window
- Persists across all Lovelace views — she follows you everywhere
- Speech bubble still pops up with reactions and alerts
- TTS still speaks — you'll hear her even when she's minimized
- Double-click the floating character to snap back to full card mode

This is the feature that makes SysDesk feel like a real NOC companion rather than just a card.

---

### 🚨 Intelligent Alert System — threshold-based, auto-TTS loop

Wire up your server sensors and the character reacts the moment any metric crosses a threshold — with a full spoken alert that **repeats on a loop** until the issue resolves.

| Metric | Warn | Critical |
|--------|------|----------|
| CPU | ≥ 70% | ≥ 90% |
| RAM | ≥ 75% | ≥ 90% |
| Disk | ≥ 70% | ≥ 85% |
| CPU Temp | ≥ 70°C | ≥ 85°C |
| Drive Temp | ≥ 40°C | ≥ 55°C |

- **Warning** — character explains the issue with actionable advice (check logs, restart services, clean up disk…)
- **Critical** — urgent, emphatic alert, demands immediate action
- **Service down** — instant notification when any monitored service or AP goes offline
- **Auto-TTS loop** — the spoken warning keeps repeating at intervals until the metric returns to safe range — you won't miss it

---

### 🖥️ Multi-Server Monitoring — HA, pfSense, Frigate, NAS

SysDesk monitors sensors across your entire homelab out of the box:

| Server | Metrics |
|--------|---------|
| 🏠 **Home Assistant** | CPU · Disk · RAM · CPU Temp |
| 🔒 **pfSense** | CPU · RAM |
| 📷 **Frigate (VM)** | CPU · RAM |
| 💽 **NAS** | CPU · RAM · Drive Temp |

Add any custom sensors on top — the sensor list is fully expandable from the visual editor.

---

### 📡 Service & AP Health Monitoring

Connect any switch, sensor, or binary sensor — AdGuard, WiFi access points, network devices — and the character alerts you the moment state drops to `off` or `unavailable`.

```yaml
adguard: switch.adguard_home_protection
wifi_5:  sensor.5_office_state
wifi_6:  sensor.6_living_state
nano_hd: sensor.nano_hd_state
```

---

### 💬 Smart Status Bubbles — context-aware, always fresh

The speech bubble doesn't just display raw numbers. It knows what time it is, what's currently wrong, and greets you accordingly.

**Bubble logic:**
- **Time-of-day greeting** — dawn 🌅, morning ☀️, noon 🍱, afternoon ⛅, evening 🌙, night 😴
- **System status summary** — all OK ✅, or lists active problems
- **Character idle quotes** — each character has 6 unique idle lines, rotated automatically
- **Owner name** — the character calls you by the name you set in config
- **Character nickname** — fully customisable (`{c}` resolves to her name in every message)

---

### 🔊 TTS — 4 engines, fully configurable

The character speaks every alert and greeting out loud. Four TTS engines are supported.

| Engine | Description |
|--------|-------------|
| **Web Speech** | Browser built-in voices — works everywhere, zero setup |
| **Google Translate** | Crisp Google voices via audio tag — no HA addon required |
| **HA Service (tts.speak)** | HA 2023.8+ native — plays on browser or physical speaker |
| **HA Service (legacy)** | `tts.google_translate_say` / `tts.cloud_say` — older setups |
| **None** | Disable TTS completely |

```yaml
tts:
  engine: ha_service
  service: tts.speak
  entity_id: tts.google_translate_vi_com
  media_player_entity_id: media_player.living_room_speaker
  cache: true
```

---

### 🎛️ Visual Config Editor

Everything configurable without touching YAML. The editor uses accordion sections for a clean layout:

| Section | Contents |
|---------|----------|
| ⚙️ **General** | Owner name, character nickname, card height |
| 🎨 **Appearance** | Background blur, mini / pin mode dimensions |
| 🖥️ **Server Sensors** | Default + custom sensors with rename and entity picker |
| 📡 **Services & APs** | Default + custom services with entity picker |
| 🔊 **TTS** | Engine, language, rate, pitch, HA service config |

---

## 📦 Installation

### Option 1 — HACS (recommended, 30 seconds)

**Step 1** — Add this repository to HACS:

[![Open HACS Repository](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=doanlong1412&repository=sys-desk&category=plugin)

> If the button doesn't work, add manually:
> **HACS → Frontend → ⋮ → Custom repositories**
> URL: `https://github.com/doanlong1412/sys-desk` → Type: **Dashboard** → Add

**Step 2** — Search **SysDesk** → **Install**

**Step 3** — Hard-reload your browser (`Ctrl+Shift+R`)

---

### Option 2 — Manual

1. Download [`sysdesk.js`](https://github.com/doanlong1412/sys-desk/releases/latest)
2. Copy to `/config/www/js/sysdesk.js`
3. **Settings → Dashboards → Resources → Add resource:**
   ```
   URL:  /local/js/sysdesk.js
   Type: JavaScript module
   ```
4. Hard reload (`Ctrl+Shift+R`)

---

## ⚙️ Configuration

Add the card to your dashboard:

```yaml
type: custom:sys-desk
```

Then click **✏️ Edit** — the visual editor handles the rest.

---

### Full YAML example

```yaml
type: custom:sys-desk
name: Long                        # your name — the character calls you this
char_nickname: UMP45              # optional: override character's self-name
height: 440                       # card height in px
float_height: 600                 # mini / pin mode character height
float_width:  380                 # mini / pin mode width
card_blur: 0                      # background blur (0 = fully transparent)

# ── Server Sensors (defaults shown — only override if your entities differ) ──
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

# ── Services / APs ──
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

### Config reference

| Key | Default | Description |
|-----|---------|-------------|
| `name` | `admin` | Owner name — used in every alert and greeting |
| `char_nickname` | *(character default)* | Override character's self-name |
| `height` | `440` | Card height (px) |
| `float_height` | `600` | Mini / Pin mode character height (px) |
| `float_width` | `380` | Mini / Pin mode width (px) |
| `card_blur` | `0` | Background blur (0–30) |
| `ha_cpu` | `sensor.system_monitor_processor_use` | HA CPU sensor |
| `ha_disk` | `sensor.system_monitor_disk_usage` | HA Disk sensor |
| `ha_ram` | `sensor.system_monitor_memory_usage` | HA RAM sensor |
| `ha_temp` | `sensor.system_monitor_processor_temperature` | HA CPU Temp sensor |
| `pf_cpu` | `sensor.pfsense_cpu_usage` | pfSense CPU sensor |
| `pf_ram` | `sensor.pfsense_memory_used` | pfSense RAM sensor |
| `fri_cpu` | `sensor.frigate_200_cpu_used` | Frigate CPU sensor |
| `fri_ram` | `sensor.qemu_frigate_200_memory_used_percentage` | Frigate RAM sensor |
| `nas_cpu` | `sensor.nas_cpu` | NAS CPU sensor |
| `nas_ram` | `sensor.nas_memory` | NAS RAM sensor |
| `nas_disk_temp` | `sensor.data_drive_1_temperature` | NAS Drive Temp sensor |
| `adguard` | `switch.adguard_home_protection` | AdGuard switch |
| `wifi_5–9` | *(office/living/kitchen/garage/outside)* | WiFi AP sensors |
| `nano_hd` | `sensor.nano_hd_state` | Nano HD AP sensor |

---

### TTS engine reference

#### Web Speech (default)
```yaml
tts:
  engine: webspeech
  lang: vi-VN      # optional
  rate: 1.05       # 0.5–2.0
  pitch: 1.1       # 0–2
```

#### Google Translate
```yaml
tts:
  engine: google_translate
  lang: vi
```

#### HA Service — tts.speak (HA 2023.8+, recommended)
```yaml
tts:
  engine: ha_service
  service: tts.speak
  entity_id: tts.google_translate_vi_com
  media_player_entity_id: media_player.living_room_speaker  # optional
  cache: true
```

#### HA Service — legacy
```yaml
tts:
  engine: ha_service
  service: tts.google_translate_say
  entity_id: media_player.living_room_speaker
  lang: vi
```

#### Disable TTS
```yaml
tts:
  engine: none
```

---

## 🖥️ Compatibility

| | |
|---|---|
| Home Assistant | 2023.1+ |
| Lovelace | Default & custom dashboards |
| Devices | Mobile & Desktop |
| Dependencies | **None** |
| Browsers | Chrome, Firefox, Safari, Edge |

---

## 📋 Changelog

### v1.0.0
- 🖥️ **9 Girls' Frontline characters** — UMP45, M4A1, SOPMOD-II, HK416, K2, PKP, RFB, Lewis, DSR-50, Gelina — switchable via ◀ ▶ buttons, saved in localStorage
- 📌 **Mini Mode + Pin** — character collapses to floating corner widget, persists across all Lovelace views
- 🚨 **Threshold-based alert system** — CPU, RAM, Disk, CPU Temp, Drive Temp with warn + critical levels
- 🔁 **Auto-TTS loop** — spoken alert repeats until metric returns to safe range
- 🖥️ **Multi-server monitoring** — Home Assistant, pfSense, Frigate, NAS out of the box
- 📡 **Service & AP health monitoring** — AdGuard, WiFi APs, any switch or sensor
- 💬 **Smart status bubbles** — time-aware greetings, system summary, character idle quotes
- 🔊 **4 TTS engines** — Web Speech, Google Translate, HA Service (tts.speak + legacy), or None
- 🎛️ **Visual Config Editor** — accordion sections, add/rename/remove sensors and services, no YAML required
- 🌐 **i18n** — Vietnamese 🇻🇳 and English 🇬🇧, switchable in the editor

---

## 📄 License

MIT — free to use, modify, and distribute.
If SysDesk makes your homelab feel alive, please ⭐ **star the repo** — it genuinely helps.

---

## 🙏 Credits

Built by **[@doanlong1412](https://github.com/doanlong1412)** from 🇻🇳 Vietnam.

> ☕ If you enjoy SysDesk, consider [buying me a coffee](https://www.paypal.com/paypalme/doanlong1412) to keep the project going!

Live2D models hosted via [jsdelivr CDN](https://www.jsdelivr.com/) — credits to original model authors.
Live2D rendering powered by [live2d-widget](https://github.com/zenghongtu/live2d-model-assets).
