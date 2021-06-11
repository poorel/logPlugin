// 通过postMessage调用content-script
function invokeContentScript(code)
{
	window.postMessage({cmd: 'invoke', code: code}, '*');
}
// 发送普通消息到content-script
function sendMessageToContentScriptByPostMessage(data)
{
	window.postMessage({cmd: 'message', data: data}, '*');
}

// 通过DOM事件发送消息给content-script
(function() {
	var customEvent = document.createEvent('Event');
	customEvent.initEvent('myCustomEvent', true, true);
	// 通过事件发送消息给content-script
	function sendMessageToContentScriptByEvent(data) {
		data = data || '你好，我是injected-script!';
		var hiddenDiv = document.getElementById('myCustomEventDiv');
		hiddenDiv.innerText = data
		hiddenDiv.dispatchEvent(customEvent);
	}
	window.sendMessageToContentScriptByEvent = sendMessageToContentScriptByEvent;
})();

// ajax 前提页面有引入jq 没有的话得换个写法  1 返回内容  2 请求详情
function ajaxLister (){
	// let _ws = new WebSocket('172.16.1.208:8889');
	// 有jq可以直接使用
	if (false) {
		$(document).ajaxComplete(function (e) {
			console.log('注入', arguments);
			let {url,type,data } = arguments[2];  // 地址 请求类型 请求参数
			let {responseText} = arguments[1]; //相应内容
		});
	}else {
		// 		内部没有jq  通知注入 其实注不注入也没用了

		sendMessageToContentScriptByPostMessage()
		// 修改xhr
		class XMLHttp {
			request (param) {};
			response (param) {};
		}
		let http = new XMLHttp();
		let http2 = false;
		if(window.frames[0]){
			http2 = new window.frames[0].XMLHttpRequest();
		}


		// 初始化 拦截XMLHttpRequest
		function initXMLHttpRequest() {
			let open = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open = function(...args){
				let send = this.send;
				let _this = this
				let post_data = []
				this.send = function (...data) {
					post_data = data;
					return send.apply(_this, data)
				}
				// 请求前拦截
				http.request(args)

				this.addEventListener('readystatechange', function () {
					if (this.readyState === 4) {
						let config = {
							url: args[1],
							status: this.status,
							method: args[0],
							data: post_data
						}
						// 请求后拦截
						http.response({config, response: this.response})
					}
				}, false)
				return open.apply(this, args);
			}

			setTimeout(() => {
				let ifr = document.getElementsByTagName("iframe");
				if(ifr && ifr[0]){
					let ifrWin = document.getElementsByTagName("iframe")[0].contentWindow;
					let open = ifrWin.XMLHttpRequest.prototype.open;
					ifrWin.XMLHttpRequest.prototype.open = function(...args){
						let send = this.send;
						let _this = this
						let post_data = []
						this.send = function (...data) {
							post_data = data;
							return send.apply(_this, data)
						}
						// 请求前拦截
						console.log('!!!!!9898')
						http.request(args)

						this.addEventListener('readystatechange', function () {
							if (this.readyState === 4) {
								let config = {
									url: args[1],
									status: this.status,
									method: args[0],
									data: post_data
								}
								// 请求后拦截
								http.response({config, response: this.response})
							}
						}, false)
						return open.apply(this, args);
					}
				}
			}, 3000)
		}

		// 初始化页面
		let keyXHR = [];
		let ajaxUrlSwitch = ''; // 待定
		window.addEventListener("message", function(e)
		{
			let {ajaxUrl,ajaxUrlSwitch} = e.data
			if(ajaxUrl){
				keyXHR = ajaxUrl.split(',')
				ajaxUrlSwitch = ajaxUrlSwitch;
			}
		}, false);
		(function () {
			function getTimeStr (){
				return new Date().toLocaleString();
			}
			console.log('执行接口监听～～～～～',window.frames[0])
			// XMLHttpRequest 拦截
			// http2 && http2.request = function (param) {
			// 	let data = JSON.parse(JSON.stringify(param))
			// 	// console.log(param, "---request");
			// 	data.push(getTimeStr(), window.location.href)
			// 	window.postMessage(data, '*');
			// };
			// http2 && http2.response = function (res) {
			// 	console.log(res, "---response");
			// 	let url = res.config.url;
			// 	let time = getTimeStr();
			// 	let param = {}
			// 	let IsCollectAllData = keyXHR.some(function (item){
			// 		return url.indexOf(item) > -1
			// 	})
			// 	if(IsCollectAllData && keyXHR.length){
			// 		param = {
			// 			...res,
			// 			time,
			// 			href: window.location.href
			// 		}
			// 	}else {
			// 		param = {
			// 			url,
			// 			time,
			// 			href: window.location.href
			// 		}
			// 	}
			// 	window.postMessage(param, '*');
			//
			// }
			http.request = function (param) {
				let data = JSON.parse(JSON.stringify(param))
				// console.log(param, "---request");
				data.push(getTimeStr(), window.location.href)
					window.postMessage(data, '*');
			};
			http.response = function (res) {
				console.log(res, "---response");
				let url = res.config.url;
				let time = getTimeStr();
				let param = {}
				let IsCollectAllData = keyXHR.some(function (item){
					return url.indexOf(item) > -1
				})
				if(IsCollectAllData && keyXHR.length){
					param = {
						...res,
						time,
						href: window.location.href
					}
				}else {
					param = {
						url,
						time,
						href: window.location.href
					}
				}
				window.postMessage(param, '*');

			}
			// 初始化 XMLHttpRequest
			initXMLHttpRequest();

		})();



	}



	// setTimeout(() => {
	// 	if($("iframe")[0] && $("iframe")[0].contentDocument ){
	// 		// console.log($("iframe"),$("iframe")[0].contentDocument.head)
	// 		$("iframe")[0].contentDocument.head.appendChild(script);
	// 		// debugger
	// 		$($("iframe")[0].contentDocument).ajaxComplete(function (e) {
	// 			console.log('vue注入', arguments);
	// 			let {url,type,data } = arguments[2];  // 地址 请求类型 请求参数
	// 			let {responseText} = arguments[1]; //相应内容
	// 		});
	// 	}
	// },2000)
}

// var script=document.createElement("script");
// script.type="text/javascript";
// script.src="https://code.jquery.com/jquery-2.1.4.min.js";
ajaxLister();

