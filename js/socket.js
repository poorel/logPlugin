console.log('socket...')
let keySocket = [];
let sendKeySocket = []
let currentTime = new Date().getTime();
let _socketProcess = '0'
window.addEventListener("message", function(e)
{
    let {msgType,sendMsgType,configInfo,socketProcess} = e.data
    if(!configInfo){
        return ;
    }
    console.log('!!!!!', e.data)
    if(msgType){
        keySocket = msgType.split(',');
        console.log('keySocket!!!!',keySocket)
    }
    if(sendMsgType){
        sendKeySocket = sendMsgType.split(',');
    }
    _socketProcess = socketProcess
}, false);


let time = setInterval(() => {
    if(window._PickWebSocket){
        clearInterval(time);
        console.log('socket监听启动')
        window._PickWebSocket.on('message',function (_, data){
            let arr = data.msgType.split('.')
            let end = arr.slice(-1)[0];
            if(_socketProcess === '2'){
                data._time = new Date().toLocaleString();
                window.postMessage(data, '*');
            }
            if(_socketProcess === '1'){
                let obj = {
                    _time : new Date().toLocaleString(),
                    msgType: '接受信息' + end
                }
                window.postMessage(obj, '*');
            }
            if(_socketProcess === '0'){
                if(keySocket.indexOf(end) > -1){
                    data._time = new Date().toLocaleString();
                    window.postMessage(data, '*');
                }
            }
        })
        // 改写代码已获得发送时信息
        let fn = window._PickWebSocket.send;
        window._PickWebSocket.send  = function (msgType, data_request){
            fn(msgType, data_request)
            let arr = msgType.msgType.split('.');
            let end = arr.slice(-1)[0];
            if(_socketProcess === '2'){
                msgType._time = new Date().toLocaleString();
                window.postMessage(msgType, '*');
            }
            if(_socketProcess === '1'){
                let obj = {
                    _time : new Date().toLocaleString(),
                    msgType: '发送信息' + end
                }
                window.postMessage(obj, '*');
            }
            if(_socketProcess === '0'){
                if(sendKeySocket.indexOf(end) > -1){
                    msgType._time = new Date().toLocaleString();
                    window.postMessage(msgType, '*');
                }
            }

        }
    }
    // 30s还没有 就不要再玩了
    if((new Date().getTime() - currentTime) > 30000 ){
        clearInterval(time)
    }
},100)
