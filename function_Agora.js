
const appId = '59810fc0e24c4ed1b4584f9b3f982842';
// Agora RTC 클라이언트 생성
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// 채널 참여 상태를 나타내는 변수
let isJoined = false;

// 로컬 트랙 변수
let localAudioTrack = null;
let localScreenVideoTrack = null; // 화면 공유용 비디오 트랙

// UI 엘리먼트 가져오기
const channelInput = document.getElementById('channel');
const uidInput = document.getElementById('uid');
const joinBtn = document.getElementById('join');
const leaveBtn = document.getElementById('leave');
const startScreenShareBtn = document.getElementById('start-screen-share');
const stopScreenShareBtn = document.getElementById('stop-screen-share');
const localVideoDiv = document.getElementById('local-video'); // 로컬 화면 표시 영역
const remoteContainer = document.getElementById('remote-container'); // 원격 화면 표시 영역

// === 이벤트 핸들러 설정 ===

// 원격 사용자가 채널에 발행(publish)했을 때
client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType); // 스트림 구독

    console.log(`user-published: ${user.uid} ${mediaType}`);

    if (mediaType === "video") {
        const remoteVideoTrack = user.videoTrack;
        const remoteVideoElementId = `remote-video-${user.uid}`;
        let videoElement = document.getElementById(remoteVideoElementId);

        if (!videoElement) {
            // 해당 사용자의 비디오 엘리먼트가 없으면 새로 생성
            videoElement = document.createElement('div');
            videoElement.id = `remote-container-${user.uid}`; // 각 사용자의 비디오를 담을 컨테이너
            videoElement.classList.add('remote-video');

            const videoTag = document.createElement('video');
            videoTag.id = remoteVideoElementId; // 실제 비디오 태그
            videoTag.autoplay = true;
            videoTag.playsinline = true; // 모바일 환경 고려

            const uidLabel = document.createElement('p');
            uidLabel.textContent = `User: ${user.uid}`;

            videoElement.appendChild(videoTag);
            videoElement.appendChild(uidLabel);
            remoteContainer.appendChild(videoElement);
        }

        // 비디오 트랙을 비디오 엘리먼트에 연결하여 재생
        remoteVideoTrack.play(remoteVideoElementId);

    } else if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack;
        // 오디오 트랙은 play() 호출 시 자동으로 재생됨
        remoteAudioTrack.play();
        console.log(`Remote audio from ${user.uid} is playing`);
    }
});

// 원격 사용자가 채널에서 발행 중지(unpublish)했을 때
client.on("user-unpublished", (user) => {
    console.log(`user-unpublished: ${user.uid}`);
    // 해당 사용자의 비디오 엘리먼트를 제거
    const remoteVideoContainer = document.getElementById(`remote-container-${user.uid}`);
    if (remoteVideoContainer) {
        remoteVideoContainer.remove();
    }
});

// 채널 참여 버튼 클릭 핸들러
joinBtn.onclick = async () => {
    const channelName = channelInput.value;
    // 사용자가 UID를 입력했으면 해당 값 사용, 비워두었으면 null로 설정하여 Agora가 자동 생성하도록 함
    // 입력된 값이 숫자 형식인지 확인하고, 아니면 문자열로 처리하거나 유효성 검사 필요
    const uid = uidInput.value.trim() === '' ? null : uidInput.value.trim();

    // 만약 숫자로 처리하고 싶다면 (0-10000 범위)
    // const uidValue = uidInput.value.trim();
    // const uid = uidValue === '' ? null : (isNaN(Number(uidValue)) ? uidValue : Number(uidValue));
    // 숫자인 경우 0-10000 범위 확인 로직 추가 필요

    if (!channelName) {
        alert('채널 이름을 입력해주세요.');
        return;
    }

    // TODO: UID 유효성 검사 추가 (입력된 UID가 문자열 요구사항 또는 숫자 요구사항을 만족하는지)

    try {
        // 1. 서버에서 RTC 토큰 가져오기
        // 서버에 토큰 요청 시 uid를 쿼리 파라미터로 전달
        // null을 전달하면 서버에서는 0으로 처리되도록 Node_Server.js에서 구현
        const tokenResponse = await fetch(`/rtcToken?channelName=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(uid === null ? '' : uid)}`); // 서버에 null 대신 빈 문자열 전달 또는 적절히 처리
        // Note: Node_Server.js에서 uid 쿼리 파라미터가 없거나 빈 문자열이면 0으로 처리하므로, 여기서는 빈 문자열로 넘겨도 됩니다.

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            alert('토큰을 가져오는데 실패했습니다: ' + tokenData.error);
            return;
        }
        const token = tokenData.rtcToken;

        // 2. Agora 채널에 참여
        // join 메서드의 uid 인자에 올바른 형식의 uid 값을 전달
        const joinedUid = await client.join(appId, channelName, token, uid); // uid변수 수정함
        console.log(`Joined channel: ${channelName} with UID ${joinedUid}`);
        alert(`채널 참여 성공! UID: ${joinedUid}`);

        // 채널 참여 성공 시 상태 업데이트 
        isJoined = true; // 채널 참여 성공 상태로 변경

        // 로컬 트랙 생성 및 발행 코드 ...
         localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
         await client.publish([localAudioTrack]);
         console.log("Published local audio track");


        // UI 상태 변경
        joinBtn.disabled = true;
        leaveBtn.disabled = false;
        startScreenShareBtn.disabled = false;

    } catch (error) {
        console.error("Failed to join channel:", error);
        // AgoraRTCException 객체인 경우 상세 에러 메시지 확인
        if (error.name === 'AgoraRTCException') {
             alert('채널 참여에 실패했습니다: ' + error.message);
        } else {
             alert('채널 참여에 실패했습니다: ' + error); // 다른 종류의 에러
        }
    }
};

// 채널 나가기 버튼 클릭 핸들러
leaveBtn.onclick = async () => {
    // 발행 중인 로컬 트랙이 있으면 중지하고 해제
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    if (localScreenVideoTrack) {
        localScreenVideoTrack.stop();
        localScreenVideoTrack.close();
        localScreenVideoTrack = null;
        // 로컬 비디오 엘리먼트 비우기
        localVideoDiv.innerHTML = '';
        stopScreenShareBtn.disabled = true; // 화면 공유 중지 버튼 비활성화
    }

    // 채널 나가기
    await client.leave();
    console.log("Left the channel");
    alert('채널에서 나갔습니다.');

    // 채널 나가기 후 상태 업데이트
    isJoined = false; // 채널 나가기 후 상태 false로 변경

    // 원격 비디오 엘리먼트 모두 제거
    remoteContainer.innerHTML = '';

    // UI 상태 변경
    joinBtn.disabled = false;
    leaveBtn.disabled = true;
    startScreenShareBtn.disabled = true; // 채널 나가면 화면 공유도 불가능
};

// 화면 공유 시작 버튼 클릭 핸들러
startScreenShareBtn.onclick = async () => {
    if (!isJoined) {
        // 채널에 참여 중인지 확인 (간단한 확인)    
         alert('먼저 채널에 참여해주세요.');
         return;
    }

    try {
        // 기존 오디오 트랙과 함께 화면 공유 비디오 트랙 생성 (오디오 포함 여부는 옵션)
        // screenVideoTrack에는 화면 공유 비디오와 시스템 오디오(선택 사항)가 포함될 수 있습니다.
        [localScreenVideoTrack, localAudioTrack] = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "720p_1", withAudio: 'auto' }, localAudioTrack);
        // withAudio: true (시스템 오디오 포함), false (시스템 오디오 제외), 'auto' (브라우저 지원 시 포함)

        // 로컬 비디오 엘리먼트에 화면 공유 스트림 연결
        const screenVideoElement = document.createElement('video');
        screenVideoElement.autoplay = true;
        screenVideoElement.playsinline = true; // 모바일 환경 고려
        screenVideoElement.style.width = '100%';
        screenVideoElement.style.height = '100%';
        localVideoDiv.innerHTML = ''; // 기존 내용 비우기
        localVideoDiv.appendChild(screenVideoElement);
        localScreenVideoTrack.play(screenVideoElement);


        // 기존 발행 트랙(일반 비디오 트랙이 있다면)을 중지하고 화면 공유 트랙 발행
        // 이 예제에서는 일반 비디오는 없고 오디오만 발행 중이므로, 오디오 트랙은 그대로 두고 화면 공유 트랙만 발행합니다.
        // 만약 웹캠 비디오도 사용한다면, 기존 비디오 트랙을 언퍼블리시하고 화면 공유 트랙을 퍼블리시 해야 합니다.
        await client.unpublish(client.localTracks); // 기존 발행 중인 트랙 모두 중지
        const tracksToPublish = [localScreenVideoTrack];
        if(localAudioTrack && localAudioTrack.trackMediaType === 'audio'){
             // 화면 공유 생성 시 오디오를 새로 만들지 않았다면 기존 오디오 트랙 포함
             tracksToPublish.push(localAudioTrack);
        } else if (localAudioTrack && localAudioTrack.trackMediaType === 'video'){
             // 만약 웹캠 비디오 트랙이라면 (이 예제에는 없지만), 화면 공유 중에는 언퍼블리시 되어야 합니다.
             localAudioTrack.stop();
             localAudioTrack.close();
             localAudioTrack = null; // 웹캠 트랙 해제
        }


         // 새로 생성된 트랙들을 발행
        await client.publish(tracksToPublish);
        console.log("Published local screen share track");

        // 화면 공유 중지 시 이벤트 리스너 추가 (사용자가 브라우저 기본 공유 중지 버튼 누를 때)
        localScreenVideoTrack.on("track-ended", () => {
            console.log("Screen share stopped by browser");
            stopScreenShareBtn.click(); // 화면 공유 중지 버튼 클릭과 동일하게 처리
        });


        // UI 상태 변경
        startScreenShareBtn.disabled = true;
        stopScreenShareBtn.disabled = false;

    } catch (error) {
        console.error("Failed to start screen share:", error);
        alert('화면 공유 시작에 실패했습니다: ' + error.message);
        // 에러 발생 시 상태 초기화
         if (localScreenVideoTrack) {
            localScreenVideoTrack.stop();
            localScreenVideoTrack.close();
            localScreenVideoTrack = null;
         }
          localVideoDiv.innerHTML = ''; // 로컬 비디오 엘리먼트 비우기

         // 기존 오디오 트랙이 있었다면 다시 발행 시도 (선택적)
         if(localAudioTrack && !client.localTracks.includes(localAudioTrack)){
             try {
                 await client.publish([localAudioTrack]);
                  console.log("Re-published local audio track after screen share failure.");
             } catch (publishError) {
                  console.error("Failed to re-publish audio track:", publishError);
             }
         }


        // UI 상태 되돌리기
        startScreenShareBtn.disabled = false; // 다시 시작 가능하게
        stopScreenShareBtn.disabled = true;

    }
};

// 화면 공유 중지 버튼 클릭 핸들러
stopScreenShareBtn.onclick = async () => {
    if (!localScreenVideoTrack) {
        console.log("Screen share is not active.");
        return;
    }

    // 화면 공유 트랙 발행 중지 및 해제
    await client.unpublish([localScreenVideoTrack]);
    localScreenVideoTrack.stop();
    localScreenVideoTrack.close();
    localScreenVideoTrack = null;
    console.log("Unpublished and closed local screen share track");

    // 로컬 비디오 엘리먼트 비우기
    localVideoDiv.innerHTML = '';


    // 기존 로컬 오디오 트랙이 있다면 다시 발행
    if(localAudioTrack){
        await client.publish([localAudioTrack]);
         console.log("Re-published local audio track.");
    } else {
         // 오디오 트랙이 없다면 새로 생성하여 발행 (이 예제에서는 채널 참여 시 오디오 생성)
         // 여기서는 채널 참여 시 생성된 localAudioTrack을 재활용합니다.
    }


    // UI 상태 변경
    startScreenShareBtn.disabled = false;
    stopScreenShareBtn.disabled = true;
};

// 초기 UI 상태 설정
leaveBtn.disabled = true;
startScreenShareBtn.disabled = true;
stopScreenShareBtn.disabled = true;

//웹 페이지 로드 시 마이크/카메라 접근 권한 미리 요청
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
        console.log("Microphone access granted.");
        stream.getTracks().forEach(track => track.stop()); // 바로 사용하지 않으므로 트랙 중지
    })
    .catch(err => {
        console.error("Microphone access denied:", err);
        // 사용자에게 권한 필요함을 알리는 UI 표시
    });

