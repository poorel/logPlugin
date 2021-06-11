console.log('socket...')
let time = setInterval(() => {
    if(window._PickWebSocket){
        clearInterval(time);
        console.log('socket监听启动')
        window._PickWebSocket.on('message',function (_, data){
            switch (data.msgType) {
                // 需要监听的type类型
                case 'com.geekplus.beetle.station.message.MergedFetchPickTaskMsg':
                    console.log('MergedFetchPickTaskMsg', data);
                    return;
            }
        })
    }
},1000)
