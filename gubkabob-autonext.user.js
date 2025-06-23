// ==UserScript==
// @name         GubkaBob AutoNext UI (FIXED)
// @namespace    gubka-bob-autonext-ui
// @version      1.0
// @description  Автопереход, fullscreen, автозапуск и UI под "Желаем приятного просмотра"
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
        const labelElem = document.createElement("label");
        labelElem.style.cssText = "margin: 5px 10px; display:inline-flex; align-items:center; gap:5px; font-size:14px; font-family:sans-serif;";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = id;
        checkbox.checked = state;
        checkbox.addEventListener("change", () => {
            onChange(checkbox.checked);
            saveSettings();
        });

        const span = document.createElement("span");
        span.textContent = label;

        labelElem.appendChild(checkbox);
        labelElem.appendChild(span);

        return labelElem;
    }

    function insertSettingsPanel() {
        const targetText = Array.from(document.querySelectorAll("*")).find(el => el.textContent?.includes("Желаем приятного просмотра"));
        if (!targetText) {
            console.warn("❌ Не удалось найти блок 'Желаем приятного просмотра'");
            return;
        }

        const panel = document.createElement("div");
        panel.style.cssText = "padding:10px;background:#f0f0f0;border-radius:5px;margin-top:10px;max-width:600px;font-family:sans-serif;font-size:14px;";
        panel.innerHTML = "<strong>GubkaBob AutoNext:</strong><br>";

        panel.appendChild(createCheckbox("autoNext", "Автопереход", settings.autoNext, (val) => {
            settings.autoNext = val;
        }));

        panel.appendChild(createCheckbox("fullscreen", "Полный экран", settings.fullscreen, (val) => {
            settings.fullscreen = val;
        }));

        panel.appendChild(createCheckbox("autoplay", "Автозапуск", settings.autoplay, (val) => {
            settings.autoplay = val;
        }));

        targetText.insertAdjacentElement("afterend", panel);
    }

    function tryFullscreen(iframe) {
        if (!iframe) return;
        const req = iframe.requestFullscreen || iframe.webkitRequestFullscreen || iframe.mozRequestFullScreen || iframe.msRequestFullscreen;
        if (req) {
            req.call(iframe).catch(() => console.warn("❌ Не удалось включить fullscreen"));
        }
    }

    function tryAutoplayInsideIframe(iframe) {
        try {
            const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
            const video = innerDoc?.querySelector("video");
            if (video && video.paused) {
                video.play().then(() => {
                    console.log("▶️ Видео запущено");
                }).catch(e => console.warn("❌ Автозапуск не сработал:", e));
            }
        } catch (e) {
            console.warn("⚠️ Не удалось получить доступ к видео в iframe — возможно, CORS", e);
        }
    }

    function waitForIframeAndControl() {
        const iframe = document.querySelector("iframe[src*='vio.to'], iframe[src*='streamguard']");
        if (!iframe) {
            console.warn("⏳ iframe не найден, повтор через 500мс...");
            setTimeout(waitForIframeAndControl, 500);
            return;
        }

        insertSettingsPanel();

        // немного подождём перед действиями
        setTimeout(() => {
            if (settings.fullscreen) tryFullscreen(iframe);
            if (settings.autoplay) tryAutoplayInsideIframe(iframe);
        }, 2000);
    }

    function initListeners() {
        window.addEventListener("message", (e) => {
            const data = e.data;
            if (!data || typeof data !== "object") return;

            if (data.event === "ended" && settings.autoNext) {
                console.log("🎞️ Переход к следующей серии...");
                const nextBtn = document.querySelector(".knopka2");
                if (nextBtn?.href) window.location.href = nextBtn.href;
            }

            if (data.event === "inited") {
                console.log("📺 Видео загружено (event: inited)");
                const iframe = document.querySelector("iframe");
                if (settings.autoplay) tryAutoplayInsideIframe(iframe);
                if (settings.fullscreen) tryFullscreen(iframe);
            }
        });
    }

    // старт
    setTimeout(() => {
        waitForIframeAndControl();
        initListeners();
    }, 1000);
})();
