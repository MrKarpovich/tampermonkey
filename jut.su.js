// ==UserScript==
// @name jut.su AutoNext
// @namespace jutsuAutoNext
// @version 0.91
// @description jut.su next, skip, fullscreen automatic script
// @author kirw
// @homepageURL https://sites.google.com/view/kirw/home
// @updateURL https://drive.google.com/uc?export=download&id=1Z6Y0tb7FU_TwBzkyqBsAH3EDvf4jJ1tc
// @downloadURL https://drive.google.com/uc?export=download&id=1Z6Y0tb7FU_TwBzkyqBsAH3EDvf4jJ1tc
// @match https://jut.su/*
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_getValue
// @run-at document-idle
// ==/UserScript==

//Для возможности перехода в полноэкранный режим в FF с помощью скриптов
//в адресной строке вбить about:config, найти full-screen-api.allow-trusted-requests-only = false

"use strict";

//Фунция исправлений ошибок на сайте после загрузки страницы
//UPD: баг пофиксили, оставил на всякий случай
//const bugs = Object.freeze({
//function fixup() {
//	fixup				: () => {
//		//баг в css сайта в режиме 16:9 изображение height:0 + padding-top: 56.25%
//		let e = document.getElementsByClassName("vjs-16-9")[0];
//		if (!e) return;
//		e.style.padding = "0px";
//		e.style.height = "100%";
//	}
//});

const switchers = Object.freeze({
	groups				: {
		top				: {
			parent		: { sel		: ".watch_additional_players"},
			items		: {
				autoplay: { sel		: "#AutoNextAutoPlay",		id		: "AutoNextAutoPlay",		caption		: "Авто",			handler : (e) => { if (switchers.update(switchers.groups.top.items.autoplay, e&&e.target.checked)) setTimeout(() => player.play(), 5000); } },
				full	: { sel		: "#AutoNextFullScreen",	id		: "AutoNextFullScreen",		caption		: "Полный экран",	handler : (e) => { if (switchers.update(switchers.groups.top.items.full, e&&e.target.checked)) setTimeout(() => player.fullscreen(true), 5000); } },
				autoskip: { sel		: "#AutoNextSkip",			id		: "AutoNextSkip",			caption		: "Пропуск",		handler : (e) => { switchers.update(switchers.groups.top.items.autoskip, e&&e.target.checked); } }
			}
		}
	},
	template			: (id, caption, handler) => { return `<div class="achiv_switcher" style="float:right">
							<div class="achiv_switcher_in">${caption}
								<div class="mchat_wrap_out"	style="display:inline-block;top:-1.7em;right:15px">
									<div class="mchat_wrap">
										<input id="${id}" type="checkbox"}>
										<label class="mchat_slider-v2" style="background:transparent;box-shadow:none;box-sizing:content-box;border-color:transparent;" for="${id}"></label>
									</div>
								</div>
							</div>
						</div>`;
	},
	register			: () =>		{
										functions.log("register");

										for (const [keyGroup, group] of Object.entries(switchers.groups)) {
											let e = functions.getElement(group.parent);

											for (const [keySwitch, item] of Object.entries(group.items)) {
												let node = document.createRange().createContextualFragment(switchers.template(item.id, item.caption));
												node.querySelector(item.sel).addEventListener("change", item.handler);
												e.insertBefore(node, e.lastChild.nextSibling);
												item.handler();
                                                settings.set(item.id, settings.get(item.id)==true);
											}

											e.classList.remove("hide_imp");
										}
	},
	update				: (c,st) =>	{
										functions.assert((c || c.id), `control ${c} is empty`);

										let e = functions.getElement(c);

										switch(typeof st) {
											case "boolean":
                                                settings.set(c.id, st);
												e.checked = st;
												return st;
											case "undefined":
												st = settings.get(c.id);
												e.checked = st;
												return st;
											default:
												functions.log("bad settings", true);
										}

	}
 });

const player = Object.freeze({
	parent				: { sel		: "#my-player" },
	parentFrame			: {	sel		: ".videoBlock" },
	control				: { sel		: "#my-player_html5_api" },
	buttons				: {
		play			: { sel		: ".vjs-play-control" },
		fullscreen		: { sel		: ".vjs-fullscreen-control" },
		skipIntro		: { sel		: ".vjs-overlay-bottom-left",	handler : (e) => { player.onCanSkipIntro(e); } },
		prev			: { sel		: "a.previous" },
		next			: { sel		: ".vjs-overlay-bottom-right",	handler : (e) => { player.onCanSkipEnding(e); } }
	},
	position			: { prev :-11, mext:-10, end:-1, begin:0 },
		play			: () =>		{ functions.log("play"); if (!functions.getElement(player.control).paused) return; functions.getElement(player.buttons.play).click(); },
		pause			: () =>		{ functions.log("pause"); functions.getElement(player.control).pause(); },
		rewind			: (pos) =>	{
										let p = functions.getElement(player.control);

										switch(pos) {
											case player.position.prev:
												functions.log("position to prev");
												functions.getElement(player.buttons.prev).click();
												break;
											case player.position.next:
												functions.log("position to next");
												functions.getElement(player.buttons.next).click();
												break;
											case player.position.end:
												functions.log("position to end");
												p.currentTime = p.duration;
												break;
											case player.position.begin:
												functions.log("position to begin");
												p.currentTime = 0;
												break;
											default:
												functions.log(`position to ${pos}`);
												p.currentTime = pos;
										}
	},
	fullscreen			: (st) =>	{
										functions.log(`fullscreen ${st}`);

										if (document.fullscreenElement && st) return;

										functions.getElement(player.buttons.fullscreen).click();
	},
	onEnd				: () =>		{
										functions.log("on end");

										if (settings.get(switchers.groups.top.items.autoplay.id)) {
											player.rewind(player.position.next);
										}
	},
	onCanSkipIntro		: (ev) =>	{
										let e = ev[0].target;

										functions.assert(e, "no target");

										if (!settings.get(switchers.groups.top.items.autoskip.id)) return;

										if (window.getComputedStyle(e).display == "none") return;

										functions.log("can skip intro");

										e.click();
	},
	onCanSkipEnding		: (ev) =>	{
										let e = ev[0].target;

										functions.assert(e, "no target");

										if (!settings.get(switchers.groups.top.items.autoskip.id)) return;

										if (window.getComputedStyle(e).display == "none") return;

										functions.log("can skip ending");

										if (!settings.get(switchers.groups.top.items.autoplay.id)) {
											player.rewind(player.position.end);
										} else e.click();
	},
	register			: () =>		{
										functions.log("register");

										for (const [key, item] of Object.entries(player.buttons)) {
											let e = functions.getElement(item, false, true);

											if (e && item.handler) {
												this.mutationObserver = new window.MutationObserver(item.handler);
												this.mutationObserver.observe(e, { attributes: true, attributeFilter: ['style', 'class'] }); //, childList: true, subtree: true });
												//functions.log(`${item.id} registered`);
											}
										}

										functions.getElement(player.control).addEventListener("ended", player.onEnd, true);
	}
});

const settings = Object.freeze({
	set					: (name, value) => {
		GM_setValue(name, value);
		functions.log(`settings ${name} = ${value}`);
	},
	get					: (name) => {
        return GM_getValue(name);
	}
});

const functions = Object.freeze({
	log					: (message, isError) => {
		if (isError) {
			console.error(`${GM_info.script.name} : ${message}!`);
		} else console.log(`${GM_info.script.name} : ${message}.`);
	},
	assert				: (condition, message) => {
		if (!condition) {
			throw Error(message);
		}
	},
	cache				: (key, value) => {
		if (value === undefined) {
			return functions.cache[key];
		}
		functions.cache[key] = value;
		//functions.log(`cache ${key} = ${value}`);
	},
	getElement			: (obj, force, isSafe) => {
		if (!isSafe) {
			functions.assert(obj, "obj is empty");
		}
		let r;
		if (!force) {
			r = functions.cache(obj.sel);
			if (r !== undefined) return r;
		}
		r = document.querySelector(obj.sel);
		if (r) functions.cache(obj.sel, r);

		if (!isSafe) {
			functions.assert(r, `${obj.sel} element not found!`);
		}
		return r;
	}
});

(function main() {
	//player awaiting. this f**king site can load a player even later than the "load" event!
	//also they binding a "logic" to a buttons, not the player events, so click emulation needed =\
	//f**ck the MutationsObservers =) - too heavy code for awaiting.
	const timerInterval		= 500;
	const timerWaiting		= 100000;
    try {
		let timer = setInterval(() => {
			if (functions.getElement(player.control, false, true)) {
				clearInterval(timer);
				timer = null;
				//bugs.fixup();
				player.register();
				switchers.register();
			}
		}, timerInterval);

		setTimeout(() => { if (timer) { clearInterval(timer); functions.log("giveup! still no player =/"); }}, timerWaiting);
	}
	catch(e) {
		functions.log(e, true);
	}
})();
