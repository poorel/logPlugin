console.log('socket...')
let keySocket = [];
let sendKeySocket = []

window.addEventListener("message", function(e)
{
    let {msgType,sendMsgType,configInfo} = e.data
    if(!configInfo){
        return ;
    }
    if(msgType){
        keySocket = msgType.split(',');
        console.log('keySocket!!!!',keySocket)
    }
    if(sendMsgType){
        sendKeySocket = sendMsgType.split(',');
    }
}, false);

let time = setInterval(() => {
    if(window._PickWebSocket){
        clearInterval(time);
        console.log('socket监听启动')
        window._PickWebSocket.on('message',function (_, data){
            let arr = data.msgType.split('.')
            let end = arr.slice(-1)[0];
            if(keySocket.indexOf(end) > -1){
                data._time = new Date().toLocaleString();
                window.postMessage(data, '*');
            }
        })
        // 改写代码已获得发送时信息
        let fn = window._PickWebSocket.send;
        window._PickWebSocket.send  = function (msgType, data_request){
            fn(msgType, data_request)
            let arr = msgType.msgType.split('.');
            let end = arr.slice(-1)[0];
            if(sendKeySocket.indexOf(end) > -1){
                msgType._time = new Date().toLocaleString();
                window.postMessage(msgType, '*');
            }
        }
    }
},100)
