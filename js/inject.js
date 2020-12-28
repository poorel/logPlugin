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
function ajaxLister (script){
	// 有jq可以直接使用
	if ($) {
		$(document).ajaxComplete(function (e) {
			console.log('注入', arguments);
			let {url,type,data } = arguments[2];  // 地址 请求类型 请求参数
			let {responseText} = arguments[1]; //相应内容
		});
	}else {
		// 没有jq 如何监听 请求的发送和接受

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
