// ==UserScript==
// @name         GubkaBob Fix: Чекбоксы + Автозапуск
// @namespace    gubka-bob-autoplayer
// @version      1.1
// @description  Автозапуск, fullscreen, панель настроек снизу под плеером
// @match        https://gubka-bob.top/sezon-*/**.html
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const SETTINGS_KEY = "gubkaBobSettings";
    const defaultSettings = {
        autoNext: true,
        fullscreen: true,
        autoplay: true
    };
    const settings = loadSettings();

    function loadSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { ...defaultSettings };
        } catch {
            return { ...defaultSettings };
        }
    }

    function saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function createCheckbox(id, label, state, onChange) {
        const wrapper = document.createElement("label");
        wrapper.style.cssText = "margin: 4px 0; display:flex; align-items:center; gap:6px; font-size:13px; color:#000;";
        wrapper.title = state ? "Активировано ✅" : "Отключено ❌";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = state;
        checkbox.style.cssText = "width: 16px; height: 16px; accent-color: #00f; cursor: pointer;";

        const status = document.createElement("span");
        status.textContent = state ? "✅" : "❌";
        status.style.color = state ? "green" : "red";
        status.style.fontWeight = "bold";

        const span = document.createElement("span");
        span.textContent = label;

        checkbox.addEventListener("change", () => {
            const checked = checkbox.checked;
            onChange(checked);
            saveSettings();
            status.textContent = checked ? "✅" : "❌";
            status.style.color = checked ? "green" : "red";
            wrapper.title = checked ? "Активировано ✅" : "Отключено ❌";
        });

        wrapper.appendChild(checkbox);
        wrapper.appendChild(status);
        wrapper.appendChild(span);
        return wrapper;
    }

    function insertSettingsPanel() {
        const refBtn = document.querySelector(".knopka2"); // кнопка "Следующая"
        if (!refBtn) return;

        const panel = document.createElement("div");
        panel.id = "gubka-settings-panel";
        panel.style.cssText = `
            position: relative;
            z-index: 9999;
            margin-bottom: 10px;
            background: #ffffffee;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 8px;
            max-width: 300px;
            font-family: sans-serif;
            font-size: 14px;
        `;

        panel.innerHTML = "<strong>⚙️ Настройки GubkaBob:</strong><br>";

panel.appendChild(createCheckbox("autoNext", "Автопереход", settings.autoNext, function (val) {
    settings.autoNext = val;
}));

panel.appendChild(createCheckbox("fullscreen", "Полный экран", settings.fullscreen, function (val) {
    settings.fullscreen = val;
}));

        panel.appendChild(createCheckbox("autoplay", "Автозапуск", settings.autoplay, val => {
            settings.autoplay = val;
            document.cookie = `autoplay=${val ? 1 : 0}; path=/; max-age=31536000`;
        }));

        // Вставляем ПЕРЕД блоком с кнопками "Следующая / Предыдущая"
        refBtn.parentElement.insertBefore(panel, refBtn);
        console.log("✅ Панель настроек вставлена");
    }

    function clickPlayButton() {
        const btn = document.querySelector(".button_1_nBS");
        if (btn) {
            btn.click();
            console.log("▶️ Кнопка 'Смотреть' нажата");
        }
    }

    function tryPostPlayMessage(retries = 10) {
        const iframe = document.querySelector("iframe[src*='hdgo'], iframe[src*='vio.to'], iframe[src*='streamguard']");
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ event: "play" }, "*");
            console.log("📤 Сообщение play отправлено в iframe");
        } else if (retries > 0) {
            setTimeout(() => tryPostPlayMessage(retries - 1), 1000);
        } else {
            console.warn("⚠️ iframe недоступен для postMessage");
        }
    }

    function clickFullscreenButton() {
        const svgButtons = document.querySelectorAll("svg[viewBox='0 0 40 40']");
        svgButtons.forEach(svg => {
            const tooltip = svg.nextElementSibling?.textContent?.toLowerCase();
            if (tooltip?.includes("полноэкранный")) {
                const btn = svg.closest("button");
                if (btn) {
                    btn.click();
                    console.log("🖥 Полноэкранный режим включен");
                }
            }
        });
    }

    function waitUntilReady() {
        return document.querySelector(".watching-video iframe, .button_1_nBS, .knopka2");
    }

    function waitAndRun(retries = 15) {
        if (!waitUntilReady()) {
            if (retries > 0) {
                return setTimeout(() => waitAndRun(retries - 1), 1000);
            }
            console.warn("⚠️ Плеер или кнопки не найдены");
            return;
        }

        insertSettingsPanel();

        setTimeout(() => {
            if (settings.autoplay) {
                clickPlayButton();
                setTimeout(() => tryPostPlayMessage(), 1500);
            }
            if (settings.fullscreen) {
                setTimeout(clickFullscreenButton, 3000);
            }
        }, 1000);
    }

    function initAutoNext() {
        window.addEventListener("message", e => {
            const data = e.data;
            if (data?.event === "ended" && settings.autoNext) {
                const nextBtn = document.querySelector(".knopka2");
                if (nextBtn?.href) {
                    console.log("⏭ Переход к следующей серии");
                    window.location.href = nextBtn.href;
                }
            }
        });
    }

    // Задержка на 5 секунд
    setTimeout(() => {
        waitAndRun();
        initAutoNext();
    }, 5000);
})();
