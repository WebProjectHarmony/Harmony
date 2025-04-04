document.addEventListener('DOMContentLoaded', function() {
    let videoSelect = document.getElementById('videoSelect');
    let inputSelect = document.getElementById('inputSelect'); // 오디오 입력 장치
    let outputSelect = document.getElementById('outputSelect'); // 오디오 출력 장치

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
                    inputSelect.appendChild(option);
                } else if (device.kind === 'audiooutput') {
                    outputSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('장치 목록 가져오기 실패:', error);
        }
    }

    async function initMedia() {
        try {
            const constraints = {
                audio: { deviceId: inputSelect.value ? { exact: inputSelect.value } : undefined },
                video: {
                    deviceId: videoSelect.value ? { exact: videoSelect.value } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }
            };
            const localStream = await navigator.mediaDevices.getUserMedia(constraints);
            document.getElementById('localVideo').srcObject = localStream;

            // 출력 장치를 설정
            if (outputSelect.value) {
                localStream.getAudioTracks().forEach(track => {
                    const audioContext = new AudioContext();
                    const source = audioContext.createMediaStreamSource(localStream);
                    const destination = audioContext.createMediaStreamDestination();
                    source.connect(destination);
                    track.applyConstraints({ deviceId: outputSelect.value });
                });
            }
        } catch (err) {
            console.error('getUserMedia 오류:', err.name, err.message);
        }
    }

    videoSelect.onchange = initMedia;
    inputSelect.onchange = initMedia;
    outputSelect.onchange = initMedia;

    // 초기화 실행
    getDevices().then(initMedia);
});