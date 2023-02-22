let APP_ID = "c1cb3ea9ce334d8fa80a4f27fd13403e"


let token = null;
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

let caller = true
let user1 = document.getElementById('user-1')
let user2 = document.getElementById('user-2')

if (!roomId) {
    window.location = 'lobby.html'
}

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302','stun:stun.gmx.net']
        },
        {
            urls:'turn:43.136.35.196',
            username:'chanzv',
            credential:'123'
        }
    ]
}



let init = async () => {
    //调用createInstance方法，创建并返回一个 RtmClient 实例。
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({ uid, token })

    //该方法创建一个 RtmChannel 实例
    channel = client.createChannel(roomId)
    console.log('RtmChannel:', channel);

    //调用该方法加入该频道，加入频道成功后可收到该频道消息和频道用户进退通知。最多可以加入 20 个频道。
    await channel.join()

    //RtmChannel 实例上的事件类型,参考网址如下
    //https://docs.agora.io/cn/Real-time-Messaging/API%20Reference/RTM_web/interfaces/rtmevents.rtmchannelevents.html
    //在这个接口，函数属性的名称为事件名称，函数的参数为事件监听回调的传入参数
    channel.on('MemberJoined', handleUserJoined)
    channel.on('MemberLeft', handleUserLeft)

    client.on('MessageFromPeer', handleMessageFromPeer)

    
    
}


let handleUserLeft = (MemberId) => {
    user2.style.display = 'none'
    user1.classList.remove('smallFrame')
}

let handleMessageFromPeer = async (message, MemberId) => {

    message = JSON.parse(message.text)

    if (message.type === 'offer') {
        caller = false
        console.log('接收到offer信息');
        console.log(message.offer)
        createAnswer(MemberId, message.offer)
    }

    if (message.type === 'answer') {
        console.log('接收到answer信息');
        console.log(message.answer)
        addAnswer(message.answer)
    }

    if (message.type === 'candidate') {
        if (peerConnection) {
            peerConnection.addIceCandidate(message.candidate)
        }
    }


}


let createPeerConnection = async (MemberId) => {
    //返回一个新建的 RTCPeerConnection 实例，它代表了本地端机器与远端机器的一条连接
    peerConnection = new RTCPeerConnection(servers)
    console.log('创建了rtc实例');
    console.log(peerConnection);

    //返回新建的 MediaStream 实例，该实例作为媒体流的内容的集合载体，其可能包含多个媒体数据轨
    //每个数据轨则由一个 MediaStreamTrack 对象表示。如果给出相应参数，在指定的数据轨则被添加到新的流中。否则，该流中不包含任何数据轨。
    remoteStream = new MediaStream()

    //HTMLMediaElement 接口的 srcObject 属性设定或返回一个对象
    //这个对象提供了一个与HTMLMediaElement关联的媒体源，这个对象通常是 MediaStream 
    user2.srcObject = remoteStream
    user2.style.display = 'block'

    user1.classList.add('smallFrame')


    // if (caller) {
    //     //Navigator 接口表示用户代理的状态和标识。它允许脚本查询它和注册自己进行一些活动
    //     //MediaDevices.getUserMedia() 会提示用户给予使用媒体输入的许可
    //     //媒体输入会产生一个MediaStream，里面包含了请求的媒体类型的轨道
    //     navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    //         .then(stream => {
    //             console.log('获取到的stream如下')
    //             console.log(stream)
    //             localStream = stream
    //         })
    //         .catch(err => console.log(err))
    //     user1.srcObject = localStream
    // }
    // if (!caller) {
    //     navigator.mediaDevices.getDisplayMedia()
    //         .then(stream => {
    //             console.log('获取到的stream如下')
    //             console.log(stream)
    //             localStream = stream
    //         })
    //         .catch(err => console.log(err))
    //     user1.srcObject = localStream
    // }

    //将本地流的每个数据轨道都添加到rtcpeerconnection实例中
    console.log('Localstream如下');
    console.log(localStream);
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    //setRemotedescription时触发ontrack
    peerConnection.ontrack = (event) => {
        console.log('ontrack事件触发了');
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    //RTCPeerConnection通过RTCPeerConnection.setLocalDescription()方法更改本地描述之后，该RTCPeerConnection会抛出icecandidate事件
    peerConnection.onicecandidate = async (event) => {
        console.log('icecandidate事件触发了');
        if (event.candidate) {
            client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, MemberId)
        }
    }
}

/************呼叫方***********/
/************呼叫方***********/
/************呼叫方***********/
/************呼叫方***********/
/************呼叫方***********/
/************呼叫方***********/

let constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: true
}

let handleUserJoined = async (MemberId) => {
    console.log('A new user joined the channel:', MemberId)
    console.log(this);
    // localStream = await navigator.mediaDevices.getUserMedia(constraints)
    localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            width: { ideal: 1920, max: 1920 },
            height: {ideal: 1080, max: 1080 },
        }
    })
    user1.srcObject = localStream
    createOffer(MemberId)
}



//有新成员加入频道时触发
//创建rtc实例 => 创建并存储offer => 把offer发送到对应的member => member端储存offer并生成answer
let createOffer = async (MemberId) => {
    console.log('触发createOffer函数')
    await createPeerConnection(MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    console.log('已存储本地生成的offer');

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, MemberId)
}

let addAnswer = async (answer) => {

    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer)
        console.log('呼叫方添加setRemoteDescription了');
    }
}



/***************被呼叫方****************/ 
/***************被呼叫方****************/ 
/***************被呼叫方****************/ 
/***************被呼叫方****************/ 
/***************被呼叫方****************/ 

let createAnswer = async (MemberId, offer) => {
    localStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            width: { ideal: 1920, max: 1920 },
            height: {ideal: 1080, max: 1080 },
        }
    })
    user1.srcObject = localStream
    console.log('触发createAnswer函数');
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)
    console.log('我真的添加offer到peerconnection了')

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    console.log('answer:')
    console.log(answer)


    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, MemberId)
}





/****************按钮事件*****************/
/****************按钮事件*****************/
/****************按钮事件*****************/
/****************按钮事件*****************/
/****************按钮事件*****************/


let leaveChannel = async () => {
    await channel.leave()
    await client.logout()
}

let toggleCamera = async () => {
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

    if (videoTrack.enabled) {
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    } else {
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

let toggleMic = async () => {
    await console.log(channel.getMembers())
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

    if (audioTrack.enabled) {
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    } else {
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

window.addEventListener('beforeunload', leaveChannel)

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)

init()
