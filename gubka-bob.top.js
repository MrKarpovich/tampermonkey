// ==UserScript==
// @name         GubkaBob Player Tools
// @namespace    gubka-bob-autoplayer
// @version      3.2
// @description  Автозапуск, fullscreen, панель управления для GubkaBob
// @match        https://gubka-bob.top/sezon-*/**.html
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const SETTINGS_KEY = 'gubkaBobSettings';
    const defaultSettings = {
        autoNext: true,
        fullscreen: true,
        autoplay: true
    };
    const settings = loadSettings();
    let playMessageSent = false;

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
        const wrapper = document.createElement('label');
        wrapper.style.cssText =
            'margin: 4px 0; display:flex; align-items:center; gap:6px; font-size:13px; color:#000;';
        wrapper.title = state ? 'Активировано ✅' : 'Отключено ❌';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = state;
        checkbox.style.cssText = 'width: 16px; height: 16px; accent-color: #00f; cursor: pointer;';

        const status = document.createElement('span');
        status.textContent = state ? '✅' : '❌';
        status.style.color = state ? 'green' : 'red';
        status.style.fontWeight = 'bold';

        const span = document.createElement('span');
        span.textContent = label;

        checkbox.addEventListener('change', () => {
            const checked = checkbox.checked;
            onChange(checked);
            saveSettings();
            status.textContent = checked ? '✅' : '❌';
            status.style.color = checked ? 'green' : 'red';
            wrapper.title = checked ? 'Активировано ✅' : 'Отключено ❌';
        });

        wrapper.appendChild(checkbox);
        wrapper.appendChild(status);
        wrapper.appendChild(span);
        return wrapper;
    }

    function insertSettingsPanel() {
        const refButton = document.querySelector('.knopka2');
        if (!refButton) return;

        const panel = document.createElement('div');
        panel.id = 'gubka-settings-panel';
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

        panel.innerHTML = '<strong>⚙️ Настройки GubkaBob:</strong><br>';

        panel.appendChild(
            createCheckbox('autoNext', 'Автопереход', settings.autoNext, function (val) {
                settings.autoNext = val;
            })
        );
        panel.appendChild(
            createCheckbox('fullscreen', 'Полный экран', settings.fullscreen, function (val) {
                settings.fullscreen = val;
            })
        );
        panel.appendChild(
            createCheckbox('autoplay', 'Автозапуск', settings.autoplay, function (val) {
                settings.autoplay = val;
                document.cookie = `autoplay=${val ? 1 : 0}; path=/; max-age=31536000`;
            })
        );

        refButton.parentElement.insertBefore(panel, refButton);
        console.log('✅ Панель настроек вставлена');
    }

    function clickPlayButton() {
        const btn = document.querySelector('.button_1_nBS');
        if (btn) {
            btn.click();
            console.log('▶️ Кнопка "Смотреть" нажата');
        }
    }

    function postPlayMessage() {
        if (playMessageSent) return;

        const iframe = document.querySelector(
            'iframe[src*="hdgo"], iframe[src*="vio.to"], iframe[src*="streamguard"]'
        );
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ event: 'play' }, '*');
            playMessageSent = true;
            console.log('📤 Сообщение "play" отправлено в iframe');
        }
    }

    function clickFullscreenButton() {
        const svgButtons = document.querySelectorAll('svg[viewBox="0 0 40 40"]');
        svgButtons.forEach((svg) => {
            const tooltip = svg.nextElementSibling?.textContent?.toLowerCase();
            if (tooltip?.includes('полноэкранный')) {
                const btn = svg.closest('button');
                if (btn) {
                    btn.click();
                    console.log('🖥 Полноэкранный режим включен');
                }
            }
        });
    }

    function initAutoNext() {
        window.addEventListener('message', function (e) {
            const data = e.data;
            if (data?.event === 'ended' && settings.autoNext) {
                const nextBtn = document.querySelector('.knopka2');
                if (nextBtn?.href) {
                    console.log('⏭ Переход к следующей серии');
                    window.location.href = nextBtn.href;
                }
            }
        });
    }

    function run() {
        const iframe = document.querySelector(
            'iframe[src*="hdgo"], iframe[src*="vio.to"], iframe[src*="streamguard"]'
        );
        if (iframe) {
            iframe.addEventListener('load', () => {
                setTimeout(postPlayMessage, 1000);
            });
        }

        insertSettingsPanel();

        setTimeout(() => {
            if (settings.autoplay) {
                clickPlayButton();
            }
            if (settings.fullscreen) {
                setTimeout(clickFullscreenButton, 1000);
            }
        }, 1000);
    }

    setTimeout(() => {
        run();
        initAutoNext();
    }, 5000);
})();
