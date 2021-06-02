s$(document).ready(function (){
	// 防抖 限流
	function debounce(callback,delay=500){
		var t = null
		return function(dom){
			clearTimeout(t)
			t = setTimeout(callback.bind(this,dom),delay)
		}
	}
	function throttle(callback,duration=500){
		var lastTime = new Date().getTime()
		return function(){
			var now = new Date().getTime()
			if(now - lastTime > duration) {
				callback();
				lastTime = now;
			}
		}
	}

	//下载文件
	const content = [];
	function getTimeStr (){
		return new Date().toLocaleString();
	}
	function createJson (){
		chrome.storage.local.get(['localData'], function(result) {
			// console.log('Value currently is ' + result.localData);
			if(result.localData){
				chrome.storage.local.remove(['localData'], function (){
					console.log('同时删除本地数据')
				})
				const jsr = JSON.stringify(result.localData);
				const blob = new Blob([jsr], {type : 'text/plain;charset=utf-8'});
				const url = URL.createObjectURL(blob);

				const a = document.createElement('a');
				a.href = url;

				a.download =  getTimeStr() + '.txt';
				document.documentElement.appendChild(a)
				a.click()
				document.documentElement.removeChild(a)
			}
		});
	}

	//保存到本地数据
	function saveLocalData (data){
		console.log('保存到本地')
		let length = data.length;
		chrome.storage.local.get(['localData'], function(result) {
			//console.log('Value currently is ' + result.localData);
			let value = result.localData ? result.localData.concat(data) : data;
			chrome.storage.local.set({localData: value}, function() {
				//console.log('Value is set to ' + value);
				//console.log(length)
				content.splice(0, length);
			});
		});
	}
	let saveData = debounce(saveLocalData)

	chrome.storage.sync.get('_form', (res) => {
		if(!res._form){
			return ;
		}
		let {level, ajaxUrl, domain, url, ajaxUrlSwitch} = res._form;  //监听等级 接口监听地址  域名监听地址  日志记录地址
		let allDomain = domain.split(/\n/g);
		let ymyz = false;
		let href = window.location.href;
		console.log(domain);
		allDomain.forEach((item) => {
			if(href.includes(item)){
				ymyz = true
			}
		})
		if(level === '1' || !ymyz){
			return ;
		}

		// 判断是否是ip地址 决定发送websocket还是ajax 目前直接websocket
		let ws = false
		if(false){ // url != '999' && url
			ws = new WebSocket(url);
		}

		// ws.onclose = function (res) {
		// 	console.log(res);
		// 	ws = new WebSocket(url);
		// };
		// ws.onerror = function () {
		// 	console.log(res);
		// 	ws = new WebSocket(url);
		// };
		function sendLog(message) {
			const stationId = window.location.href; // 完整的url
			const userName = JSON.parse(localStorage.getItem('stationData')).userName;// 用户名
			const logInfo = `${stationId};操作信息:${message};`;
			const data = {
				stationId,
				logInfo,
				logLevel: level,
				msgType: 'com.geekplus.beetle.station.message.SendLogMsg',
				_token: localStorage.getItem('GeekPlusLocalSessionID'),
			};
			ws && ws.send(JSON.stringify(data));
		}

		// 向页面注入JS
		function injectCustomJs(jsPath, dom) {
			jsPath = jsPath || 'js/inject.js';
			var temp = document.createElement('script');
			if(dom){
				temp = dom.createElement('script');
			}
			temp.setAttribute('type', 'text/javascript');
			// 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
			temp.src = chrome.extension.getURL(jsPath);
			temp.onload = function()
			{
				// 放在页面不好看，执行完后移除掉
				//this.parentNode.removeChild(this);
				//发送content-script消息
				window.postMessage({ajaxUrl, ajaxUrlSwitch}, '*');
			};
			document.body.appendChild(temp);
		}
		// xpath
		function getXPath( element, str = '')
		{
			var val=element.value;
			// console.log("val="+val);
			var xpath = '';
			for ( ; element && element.nodeType == 1; element = element.parentNode )
			{
				// console.log(element);
				var id = s$(element.parentNode).children(element.tagName).index(element) + 1;
				id > 1 ? (id = '[' + id + ']') : (id = '');
				xpath = element.tagName.toLowerCase() + id + xpath;
			}
			return str + '/' + xpath;
		}
		if(level === '2' || level === '3'){
			s$(document).on('click',function(e){
				console.log('点击')
				let dom = e.target;

				console.log(getXPath(dom));
				if(dom.nodeName === 'HTML' || dom.nodeName === 'BODY') return;
				let context = '';
				let _class = s$(dom).attr("class") ? s$(dom).attr("class") : s$(dom).parent().attr("class");
				switch(dom.nodeName){
					case 'INPUT':
					case 'SELECT':
					case 'CHECKBOX':
					case 'RADIO':
						context = s$(dom).attr('name');
						break;
					default:
						context = s$.trim(dom.innerText);
				}
				if(!context || context.length > 20) context = '';
				console.log(`事件类型:${e.type};事件对象标签名:${dom.nodeName};事件对象文字内容:${context};事件对象样式名:${_class};`)
			})

			s$(document).on('change',function(e){
				let dom = e.target;
				let name = s$(dom).attr('name');
				console.log(`事件类型:${e.type};事件对象标签名:${dom.nodeName};事件对象name名:${name};输入内容:${s$(dom).val()}`);
			});
		}

		if(level === '2' || level === '4'){
			console.log('注入代码')
			// injectCustomJs('js/jquery-2.1.4.js');
			// injectCustomJs()  //不可插入jq会扰乱原有环境
		}
		// 检测下载
		let Max = 3145728;  // 最大3mb
		let interval = setInterval(function(){
			chrome.storage.local.getBytesInUse('localData', function(res) {
				// Notify that we saved.
				if( res > Max ){
					createJson();
				}
				console.log(res)
			});

		},10000);
		// vue部分
		console.log('iframe准备中...')
		// 针对主版本url地址不变的情况，手动重现插入数据
		// 存在风险 会导致侵入的内容越来越多？ 工作站却不需要如此
		// 工作站没有嵌套,拣货待定
		setTimeout(() => {
			let ifr = s$("iframe")[0]
			injectCustomJs()
			if(ifr){
				createJson ()

				// console.log('999', s$(s$("iframe")[0].contentDocument).find(".el-select-dropdown__list"));
				// console.log(document.getElementsByTagName('iframe')[0].contentWindow);

				// 生成
				// 选择需要观察变动的节点  下拉节点变动
				let bt = debounce(bindClick);
				// const targetNode = s$(s$("iframe")[0].contentDocument).find(".el-popper");
				// 更优解
				s$("iframe").contents().find("body")[0].addEventListener("DOMSubtreeModified", function(obj){
					// obj
					let target = obj.target;
					// console.log('列表中子元素被修改',target);
					if(target && s$(target).hasClass('el-popper')){
						bt(target);
					}

				}, false);
				// s$("iframe").contents().find("body")[0].addEventListener("DOMNodeInserted", function(obj){
				// 	// obj
				// 	let target = obj.target;
				// 	console.log('列表中子元素被insert',target);
				// }, false);
				// 不在使用此方法
// // 观察器的配置（需要观察什么变动）
// 				const config = {
// 					attributes: true,
// 					characterData: false,
// 					childList: false,
// 					subtree: false,
// 					attributeOldValue: false,
// 					characterDataOldValue: false
// 				};
//
// // 当观察到变动时执行的回调函数
//
// 				let signInput = null;
//
// 				const callback = function(mutationsList, observer) {
// 					// Use traditional 'for loops' for IE 11
// 					// console.log(mutationsList, observer);
//
// 					// mutationsList.forEach(function(mutation) {
// 					// 	if(s$(mutation.target).css("display") === "none"){
// 					// 		debounce(() => {
// 					// 				if(signInput){
// 					// 					console.log(signInput.val())
// 					// 					signInput = null
// 					// 				}
// 					// 		})
// 					// 	}
// 					// });
// 					bt();
// 				};
//
// // 创建一个观察器实例并传入回调函数
// 				// const observer = new MutationObserver(debounce(callback,100));
//
// // 以上述配置开始观察目标节点
// // 				Array.from(targetNode).forEach(item => {
// // 					observer.observe(item, config);
// // 				})

				function clickEvent(e){
					console.log('click');
					e.preventDefault()
					let dom = e.target;
					if(dom.nodeName === 'HTML' || dom.nodeName === 'BODY') return;
					let context = '';
					let _class = s$(dom).attr("class") ? s$(dom).attr("class") : s$(dom).parent().attr("class");
					switch(dom.nodeName){
						case 'INPUT':
						case 'SELECT':
						case 'CHECKBOX':
						case 'RADIO':
							context = s$(dom).attr('name');
							break;
						default:
							context = s$.trim(dom.innerText);
					}
					if(!context || context.length > 20) context = '';
					console.log(getXPath(dom, 'iframe'));
					content.push(getTimeStr() + `事件类型:${e.type};事件对象标签名:${dom.nodeName};事件对象文字内容:${context};事件对象样式名:${_class};`)
					saveData(content);
					console.log(`事件类型:${e.type};事件对象标签名:${dom.nodeName};事件对象文字内容:${context};事件对象样式名:${_class};`);
				}
				function bindClick(dom){
					// console.log('更新绑定',dom);
					let li = s$(s$("iframe")[0].contentDocument).find('.el-popper').find(".el-select-dropdown__item");
					let inp = s$(s$("iframe")[0].contentDocument).find('input');
					s$(dom).unbind("click").on('click',clickEvent)
					// li动态生成时
					li.unbind("click").on('click',clickEvent)
					inp.find('input[class=el-range-input],input[type=text]').unbind("click").on('click',clickEvent)
				}
				s$(s$("iframe")[0].contentDocument).find('input[class=el-range-input],input[type=text]').on('click',clickEvent)
				console.log('iframe 初次更新')
				bindClick();

				s$(s$("iframe")[0].contentDocument).on('change',function(e){
					let dom = e.target;
					let name = s$(dom).attr('name');

					content.push(getTimeStr() + `事件类型:${e.type};事件对象标签名:${dom.nodeName};事件对象name名:${name};输入内容:${s$(dom).val()}`)
					saveData(content);
					console.log(`事件类型:${e.type};事件对象标签名:${dom.nodeName};事件对象name名:${name};输入内容:${s$(dom).val()}`);
				});
			}
		},10000)

	});


// 注意，必须设置了run_at=document_start 此段代码才会生效
// 	document.addEventListener('DOMContentLoaded', function() {
// 		// 注入自定义JS
// 		console.log('注入代码')
// 		injectCustomJs();
// 		// 给谷歌搜索结果的超链接增加 _target="blank"
// 		if(location.host == 'www.google.com.tw')
// 		{
// 			var objs = document.querySelectorAll('h3.r a');
// 			for(var i=0; i<objs.length; i++)
// 			{
// 				objs[i].setAttribute('_target', 'blank');
// 			}
// 			console.log('已处理谷歌超链接！');
// 		}
// 		else if(location.host == 'www.baidu.com')
// 		{
// 			function fuckBaiduAD()
// 			{
// 				if(document.getElementById('my_custom_css')) return;
// 				var temp = document.createElement('style');
// 				temp.id = 'my_custom_css';
// 				(document.head || document.body).appendChild(temp);
// 				var css = `
// 			/* 移除百度右侧广告 */
// 			#content_right{display:none;}
// 			/* 覆盖整个屏幕的相关推荐 */
// 			.rrecom-btn-parent{display:none;}'
// 			/* 难看的按钮 */
// 			.result-op.xpath-log{display:none !important;}`;
// 				temp.innerHTML = css;
// 				console.log('已注入自定义CSS！');
// 				// 屏蔽百度推广信息
// 				removeAdByJs();
// 				// 这种必须用JS移除的广告一般会有延迟，干脆每隔一段时间清楚一次
// 				interval = setInterval(removeAdByJs, 2000);
//
// 				// 重新搜索时页面不会刷新，但是被注入的style会被移除，所以需要重新执行
// 				temp.addEventListener('DOMNodeRemoved', function(e)
// 				{
// 					console.log('自定义CSS被移除，重新注入！');
// 					if(interval) clearInterval(interval);
// 					fuckBaiduAD();
// 				});
// 			}
// 			let interval = 0;
// 			function removeAdByJs()
// 			{
// 				s$('[data-tuiguang]').parents('[data-click]').remove();
// 			}
// 			fuckBaiduAD();
// 			// initCustomPanel();
// 			// initCustomEventListen();
// 		}
// 	});


// 接收来自后台的消息
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
	{
		//console.log('收到来自 ' + (sender.tab ? "content-script(" + sender.tab.url + ")" : "popup或者background") + ' 的消息：', request);
		console.log(request);
		if(request === 'reload'){
			window.location.reload();
			return
		}

		if(request === 'saveLog'){
			createJson();
			return
		}

		if(request.cmd == 'update_font_size') {
			var ele = document.createElement('style');
			ele.innerHTML = `* {font-size: ${request.size}px !important;}`;
			document.head.appendChild(ele);
		}
		else {
			tip(JSON.stringify(request));
			sendResponse('我收到你的消息了：'+JSON.stringify(request));
		}
	});

// 主动发送消息给后台
// 要演示此功能，请打开控制台主动执行sendMessageToBackground()
	function sendMessageToBackground(message) {
		chrome.runtime.sendMessage({greeting: message || '你好，我是content-script呀，我主动发消息给后台！'}, function(response) {
			tip('收到来自后台的回复：' + response);
		});
	}

// 监听长连接
	chrome.runtime.onConnect.addListener(function(port) {
		console.log(port);
		if(port.name == 'test-connect') {
			port.onMessage.addListener(function(msg) {
				console.log('收到长连接消息：', msg);
				tip('收到长连接消息：' + JSON.stringify(msg));
				if(msg.question == '你是谁啊？') port.postMessage({answer: '我是你爸！'});
			});
		}
	});

	window.addEventListener("message", function(e)
	{
		// console.log('收到消息：', e.data);
		content.push(e.data);
		saveData(content);
	}, false);


	function initCustomEventListen() {
		var hiddenDiv = document.getElementById('myCustomEventDiv');
		if(!hiddenDiv) {
			hiddenDiv = document.createElement('div');
			hiddenDiv.style.display = 'none';
			hiddenDiv.id = 'myCustomEventDiv';
			document.body.appendChild(hiddenDiv);
		}
		hiddenDiv.addEventListener('myCustomEvent', function() {
			var eventData = document.getElementById('myCustomEventDiv').innerText;
			tip('收到自定义事件：' + eventData);
		});
	}

	var tipCount = 0;
// 简单的消息通知
	function tip(info) {
		info = info || '';
		var ele = document.createElement('div');
		ele.className = 'chrome-plugin-simple-tip slideInLeft';
		ele.style.top = tipCount * 70 + 20 + 'px';
		ele.innerHTML = `<div>${info}</div>`;
		document.body.appendChild(ele);
		ele.classList.add('animated');
		tipCount++;
		setTimeout(() => {
			ele.style.top = '-100px';
			setTimeout(() => {
				ele.remove();
				tipCount--;
			}, 400);
		}, 3000);
	}

});


