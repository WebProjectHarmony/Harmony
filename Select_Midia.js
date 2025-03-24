document.addEventListener('DOMContentLoaded', function() {
let videoSelect = document.getElementById('videoSelect');
let audioSelect = document.getElementById('audioSelect');

async function getDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `${device.kind} ${device.deviceId.substr(0, 5)}`;
            if (device.kind === 'videoinput') {
                videoSelect.appendChild(option);
            } else if (device.kind === 'audioinput') {
                audioSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('장치 목록 가져오기 실패:', error);
    }
}

async function initMedia() {
    try {
        const constraints = {
            audio: {deviceId: audioSelect.value ? {exact: audioSelect.value} : undefined},
            video: {
                deviceId: videoSelect.value ? {exact: videoSelect.value} : undefined,
                width: {ideal: 1280},
                height: {ideal: 720},
                frameRate: {ideal: 30}
            }
        };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('localVideo').srcObject = localStream;
    } catch (err) {
        console.error('getUserMedia 오류:', err.name, err.message);
    }
}

videoSelect.onchange = initMedia;
audioSelect.onchange = initMedia;

// 초기화 실행
getDevices().then(initMedia);

});