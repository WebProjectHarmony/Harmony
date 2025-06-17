//const appId = process.env.appId;

let itsappID;

fetch('/env')
  .then(response => response.json())
  .then(data => {
    itsappID = data.appId
  })
  .catch(error => {
    console.error('환경변수 불러오기 실패:', error);
  });

// Agora SDK 로그 레벨 설정
// AgoraRTC.setLogLevel(level);
// level 값:
// DEBUG: 0 (가장 상세함, 기본값일 수 있음)
// INFO: 1
// WARNING: 2
// ERROR: 3 (오류만 출력)
// NONE: 4 (모든 Agora SDK 로그 출력 안함)

// 디버그 및 정보 로그를 제외하고 경고와 오류만 출력
 AgoraRTC.setLogLevel(4);

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

    console.log(`사용자 발행: ${user.uid} ${mediaType}`);

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
            uidLabel.textContent = `사용자: ${user.uid}`;

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
        console.log(`원격 오디오 재생 중: ${user.uid}`);
    }
});

// 원격 사용자가 채널에서 발행 중지(unpublish)했을 때
client.on("user-unpublished", (user) => {
    console.log(`사용자 발행 중지: ${user.uid}`);
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
    const uid = uidInput.value.trim() === '' ? null : uidInput.value.trim();

    if (!channelName) {
        alert('채널 이름을 입력해주세요.');
        return;
    }

    try {
        // 1. 서버에서 RTC 토큰 가져오기
        // 서버에 토큰 요청 시 uid를 쿼리 파라미터로 전달합니다.
        const tokenResponse = await fetch(`/rtcToken?channelName=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(uid === null ? '' : uid)}`);
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            alert('토큰을 가져오는데 실패했습니다: ' + tokenData.error);
            return;
        }
        const token = tokenData.rtcToken;
        console.log("RTC 토큰 가져오기 완료:", token);


        // 2. Agora 채널에 참여
        // join 메서드는 Promise를 반환하며, 참여 성공 시 사용자의 UID를 반환합니다.
        // uid 인자에 올바른 형식의 uid 값 또는 null을 전달
        const joinedUid = await client.join(itsappID, channelName, token, uid);
        console.log(`채널 참여 완료: ${channelName}, UID: ${joinedUid}`);
        alert(`채널 참여 성공! UID: ${joinedUid}`);

        // === 채널 참여 성공 시 상태 업데이트 ===
        isJoined = true; // 채널 참여 성공 상태로 변경

        // 3. 로컬 오디오 트랙 생성 및 발행
        // 로컬 비디오 트랙은 화면 공유 시에만 생성하므로 여기서는 오디오만 생성/발행합니다.
        // 채널 참여 시 오디오 트랙이 이미 생성되었는지 확인하여 중복 생성 방지 (선택 사항)
        if (!localAudioTrack) {
             localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
             console.log("로컬 오디오 트랙 생성.");
        }

        // 이미 발행 중인 트랙이 없다면 오디오 트랙 발행
        // 화면 공유 중에는 오디오 트랙 발행 상태가 변경될 수 있으므로 publish 호출 전 현재 상태 확인 필요
         const tracksToPublishOnJoin = [];
         if(localAudioTrack && !client.localTracks.includes(localAudioTrack)){
             tracksToPublishOnJoin.push(localAudioTrack);
         }

         if(tracksToPublishOnJoin.length > 0){
            await client.publish(tracksToPublishOnJoin);
            console.log("채널 참여 시 로컬 오디오 트랙 발행 완료.");
         } else {
            console.log("로컬 오디오 트랙이 이미 발행되었거나 발행 준비가 안됨.");
         }


        // UI 상태 변경
        joinBtn.disabled = true;
        leaveBtn.disabled = false;
        startScreenShareBtn.disabled = false; // 화면 공유 시작 가능하게
        stopScreenShareBtn.disabled = true; // 화면 공유 중지 버튼은 아직 비활성화

    } catch (error) {
        console.error("채널 참여 실패 (오류 발생):", error);

        let errorMessage = '알 수 없는 채널 참여 오류가 발생했습니다.';

        if (error instanceof Error) {
             errorMessage = error.message;
             if (error.name === 'AgoraRTCException') {
                 errorMessage = `Agora SDK 오류: ${error.message}`;
             } else if (error.name === 'NotAllowedError') {
                 errorMessage = '마이크/카메라 접근이 거부되었습니다. 브라우저 권한 설정을 확인해주세요.';
             }
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else {
             try {
                 errorMessage = JSON.stringify(error);
             } catch (e) {
                 errorMessage = String(error);
             }
        }

        alert('채널 참여에 실패했습니다: ' + errorMessage);

        // 에러 발생 시 상태 초기화
        isJoined = false;
        // UI 상태 되돌리기
        joinBtn.disabled = false;
        leaveBtn.disabled = true;
        startScreenShareBtn.disabled = true;
        stopScreenShareBtn.disabled = true;
    }
};

// 채널 나가기 버튼 클릭 핸들러
leaveBtn.onclick = async () => {
    // 발행 중인 로컬 트랙이 있으면 중지하고 해제
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
         console.log("로컬 오디오 트랙 중지 및 해제 완료.");
    }
    if (localScreenVideoTrack) {
        localScreenVideoTrack.stop();
        localScreenVideoTrack.close();
        localScreenVideoTrack = null;
        console.log("로컬 화면 공유 비디오 트랙 중지 및 해제 완료.");
    }

    // 로컬 비디오 엘리먼트 비우기
    localVideoDiv.innerHTML = '';
    console.log("로컬 비디오 엘리먼트 비우기 완료.");

    // 채널 나가기
    await client.leave();
    console.log("채널 나가기 완료.");
    alert('채널에서 나갔습니다.');

    // === 채널 나가기 후 상태 업데이트 ===
    isJoined = false; // 채널 나가기 후 상태 false로 변경

    // 원격 비디오 엘리먼트 모두 제거
    remoteContainer.innerHTML = '';
    console.log("원격 비디오 엘리먼트 모두 비우기 완료.");

    // UI 상태 변경
    joinBtn.disabled = false;
    leaveBtn.disabled = true;
    startScreenShareBtn.disabled = true;
    stopScreenShareBtn.disabled = true;
};


// 화면 공유 시작 버튼 클릭 핸들러
startScreenShareBtn.onclick = async () => {
    // 채널 참여 상태 확인
    if (!isJoined) {
        alert('먼저 채널에 참여해주세요.');
        console.warn("채널 참여 전 화면 공유 시도.");
        return; // 채널 참여 상태가 아니면 여기서 함수 종료
    }

    console.log('화면 공유 시작 시도 중...'); // 화면 공유 시도 로그

    try {
        // 기존에 발행 중인 로컬 트랙들을 잠시 중지 (특히 일반 웹캠 비디오 트랙이 있다면)
        const currentPublishedTracks = client.localTracks;
        const tracksToUnpublish = currentPublishedTracks.filter(track => track.trackMediaType === 'video'); // 기존 비디오 트랙만 선택적으로 중지 (웹캠 등)

        if (tracksToUnpublish.length > 0) {
             console.log("기존 로컬 비디오 트랙 발행 취소 중:", tracksToUnpublish);
            await client.unpublish(tracksToUnpublish);
             console.log("기존 로컬 비디오 트랙 발행 취소 완료.");
             // 기존 웹캠 비디오 트랙이 있다면 해제 (화면 공유 중에는 웹캠 비디오 사용 안함)
             tracksToUnpublish.forEach(track => {
                 track.stop();
                 track.close();
             });
             console.log("기존 로컬 비디오 트랙 중지 및 해제 완료.");
        }


        console.log('AgoraRTC.createScreenVideoTrack 호출 중...'); // createScreenVideoTrack 호출 직전 로그

        // === 수정된 부분 시작: createScreenVideoTrack 결과 값을 먼저 변수에 할당하고 처리 ===
        const screenTrackResult = await AgoraRTC.createScreenVideoTrack(
            { encoderConfig: "1080p_2", withAudio: 'auto' }, // 화면 비디오 설정 및 오디오 옵션 (auto 시 시스템 오디오 포함 시도)
            localAudioTrack // 기존 오디오 트랙 (시스템 오디오 없을 경우 재활용될 수 있음)
       );
       // 720p_1: 720p 해상도 (1280x720), 15 fps
       // 720p_2: 720p 해상도 (1280x720), 30 fps
       // 1080p_1: 1080p 해상도 (1920x1080), 15 fps
       // 1080p_2: 1080p 해상도 (1920x1080), 30 fps
       ////////////////////////////////더 높은 해상도로 하고 싶다면/////////////////////////////////////////////
   //     const screenTrackResult = await AgoraRTC.createScreenVideoTrack(
   //         {
   //             // encoderConfig 객체 형태로 상세 설정
   //             encoderConfig: {
   //                 // 원본 화면 해상도 사용 (권장)
   //                 // width, height 옵션을 명시하지 않으면 브라우저가 공유 대상의 실제 해상도를 사용합니다.
   //                 // width: 1920, 
   //                 // height: 1080, 
   //                 frameRate: 60, // 최대 프레임 속도 지정 
   //                 // bitrate: 0 // 비트레이트 설정 (0이면 Agora가 자동 관리)
   //             },
   //             withAudio: 'auto' // 오디오 옵션 유지
   //         },
   //         localAudioTrack // 기존 오디오 트랙
   //    );
       ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        console.log("createScreenVideoTrack 원본 결과:", screenTrackResult); // raw 결과 값 로그 확인

        let screenVideoTrackFromResponse = null; // createScreenVideoTrack 호출 결과로 얻은 비디오 트랙
        let screenAudioTrackFromResponse = null; // createScreenVideoTrack 호출 결과로 얻은 시스템 오디오 트랙 (있다면)

        if (Array.isArray(screenTrackResult)) {
             // 결과가 배열인 경우 (SDK 문서에 따른 일반적인 반환 형태)
             screenVideoTrackFromResponse = screenTrackResult[0]; // 배열의 첫 번째 요소는 비디오 트랙
             if (screenTrackResult.length > 1 && screenTrackResult[1] && screenTrackResult[1].trackMediaType === 'audio') {
                 // 배열의 두 번째 요소가 유효한 오디오 트랙인 경우 (시스템 오디오 트랙)
                 screenAudioTrackFromResponse = screenTrackResult[1];
                  console.log("화면 공유 결과에 시스템 오디오 트랙 포함 (배열).");
             } else {
                 console.log("화면 공유 결과에 시스템 오디오 트랙 미포함 또는 두 번째 요소가 오디오 아님 (배열 결과).");
             }
             console.log("화면 트랙 결과 배열로 처리 완료.");

        } else if (screenTrackResult && typeof screenTrackResult === 'object' && screenTrackResult.trackMediaType === 'video') {
             // 결과가 배열이 아닌 단일 비디오 트랙 객체인 경우 (이전 오류 로그에서 확인된 경우)
             screenVideoTrackFromResponse = screenTrackResult; // 단일 객체가 비디오 트랙 자체임
             // 이 경우 시스템 오디오 트랙은 결과에 포함되지 않은 것으로 간주
             screenAudioTrackFromResponse = null; // 명시적으로 null 처리
             console.log("화면 트랙 결과 단일 비디오 트랙 객체로 처리 완료.");

        } else {
            // 예상치 못한 형태의 결과
            console.error("AgoraRTC.createScreenVideoTrack 예상치 못한 유형 반환:", screenTrackResult);
            let errorMessage = `화면 공유 트랙 생성 결과가 예상치 못한 형태입니다. 결과: ${String(screenTrackResult)}`;
            alert('화면 공유 시작에 실패했습니다: ' + errorMessage);

            // 에러 처리 후 UI 상태 되돌리기 및 함수 종료
            startScreenShareBtn.disabled = false;
            stopScreenShareBtn.disabled = true;
            console.log("예상치 못한 화면 트랙 결과 유형으로 UI 상태 초기화.");
            return; // 함수 종료하여 try 블록 나머지 코드가 실행되지 않도록 함
        }

        // 결과로 얻은 트랙들을 로컬 변수에 할당
        localScreenVideoTrack = screenVideoTrackFromResponse;
        // 시스템 오디오 트랙을 얻었다면 localAudioTrack 변수를 업데이트합니다.
        // 그렇지 않다면 localAudioTrack 변수는 createScreenVideoTrack 호출 시 전달한 기존 오디오 트랙을 유지합니다.
        if (screenAudioTrackFromResponse && screenAudioTrackFromResponse.trackMediaType === 'audio') {
             // createScreenVideoTrack 결과에 시스템 오디오가 포함된 경우, 기존 오디오 트랙이 있다면 중지하고 새로운 시스템 오디오 트랙 사용
             if(localAudioTrack && localAudioTrack.trackMediaType === 'audio'){
                  try{
                       await client.unpublish([localAudioTrack]);
                       localAudioTrack.stop();
                       localAudioTrack.close();
                       console.log("시스템 오디오 사용 시 이전 로컬 오디오 트랙 중지 및 발행 취소 완료.");
                  } catch (unpubAudioErr) {
                       console.warn("이전 오디오 트랙 중지/발행 취소 중 오류:", unpubAudioErr);
                  }
             }
             localAudioTrack = screenAudioTrackFromResponse; // localAudioTrack 변수를 시스템 오디오 트랙으로 업데이트
             console.log("localAudioTrack 시스템 오디오 트랙으로 업데이트.");
        } else {
             console.log("시스템 오디오 미사용, localAudioTrack은 createScreenVideoTrack 호출 전 상태 유지.");
             // 기존 오디오 트랙이 발행 중지되지 않았다면 계속 발행된 상태여야 합니다.
        }


        console.log("최종 localScreenVideoTrack:", localScreenVideoTrack);
        console.log("최종 localAudioTrack (업데이트 가능성 이후):", localAudioTrack);


        // 필수: 비디오 트랙이 유효한지 최종 확인
        if (!localScreenVideoTrack || localScreenVideoTrack.trackMediaType !== 'video') {
             console.error("얻은 객체가 유효한 화면 비디오 트랙이 아님:", localScreenVideoTrack);
             alert('화면 공유 시작에 실패했습니다: 유효한 비디오 트랙을 얻지 못했습니다.');

             // UI 상태 되돌리기
             startScreenShareBtn.disabled = false;
             stopScreenShareBtn.disabled = true;
             console.log("최종 화면 비디오 트랙 오류로 UI 상태 초기화.");
             return;
        }


        // 로컬 미리보기 엘리먼트에 화면 공유 스트림 연결
        const screenVideoElement = document.createElement('video');
        screenVideoElement.autoplay = true;
        screenVideoElement.playsinline = true; // 모바일 환경 고려
        screenVideoElement.style.width = '100%';
        screenVideoElement.style.height = '100%';
        localVideoDiv.innerHTML = ''; // 기존 내용 비우기
        localVideoDiv.appendChild(screenVideoElement);

        // 생성된 화면 공유 비디오 트랙을 로컬 비디오 엘리먼트에 재생
        localScreenVideoTrack.play(screenVideoElement);
        console.log("로컬 화면 공유 미리보기 재생 중.");


        // 발행할 트랙 목록 구성
        const tracksToPublish = [localScreenVideoTrack];
         // localAudioTrack 변수가 유효한 오디오 트랙이면 발행 목록에 추가
         // 이 localAudioTrack은 시스템 오디오 트랙이거나, 시스템 오디오가 없을 때 기존 오디오 트랙입니다.
        if (localAudioTrack && localAudioTrack.trackMediaType === 'audio') {
             // 현재 클라이언트의 발행된 트랙 목록에 포함되어 있지 않다면 발행 목록에 추가
             // (이미 발행 중인 경우는 중복 발행 시도 안함)
             if (!client.localTracks.includes(localAudioTrack)) {
                tracksToPublish.push(localAudioTrack);
                 console.log("발행 목록에 오디오 트랙 포함:", localAudioTrack);
             } else {
                  console.log("오디오 트랙이 이미 발행 중입니다.");
             }
        } else {
             console.log("발행할 유효한 오디오 트랙 없음.");
        }
         console.log("발행할 트랙 목록:", tracksToPublish);


        // 새로 생성된 화면 공유 트랙 (및 오디오 트랙) 발행
        // tracksToPublish에 유효한 트랙이 있다면 발행 시도
        if (tracksToPublish.length > 0) {
            await client.publish(tracksToPublish);
            console.log("로컬 화면 공유 트랙(들) 발행 완료.");
        } else {
             console.warn("화면 공유 트랙 생성 후 발행할 트랙이 없습니다.");
             alert('화면 공유 시작에 실패했습니다: 발행할 트랙이 없습니다.');

             // UI 상태 되돌리기 및 함수 종료
             if (localScreenVideoTrack) {
                localScreenVideoTrack.stop();
                localScreenVideoTrack.close();
                localScreenVideoTrack = null;
             }
             localVideoDiv.innerHTML = '';
             startScreenShareBtn.disabled = false;
             stopScreenShareBtn.disabled = true;
             console.log("발행할 트랙 없음으로 UI 상태 초기화.");
             return;
        }


        // 사용자가 브라우저 기본 공유 중지 버튼을 눌렀을 때 이벤트를 감지
        localScreenVideoTrack.on("track-ended", () => {
            console.log("브라우저 '공유 중지' 버튼으로 화면 공유 중지 감지.");
            // 화면 공유 중지 버튼 클릭 핸들러 직접 호출
            stopScreenShareBtn.onclick();
        });

        // UI 상태 변경: 화면 공유 시작 버튼 비활성화, 중지 버튼 활성화
        startScreenShareBtn.disabled = true;
        stopScreenShareBtn.disabled = false;
        console.log("화면 공유 시작 성공, UI 업데이트 완료.");

    } catch (error) {
       // === 오류 발생 시 처리 (이전과 동일한 안전한 예외 처리 로직 사용) ===
       // 이 catch 블록은 createScreenVideoTrack 호출이 Promise를 reject하거나,
       // try 블록의 다른 부분에서 오류가 발생했을 때 실행됩니다.
       console.error("화면 공유 시작 실패 (오류 발생):", error);

       let errorMessage = '알 수 없는 화면 공유 오류가 발생했습니다.'; // 기본 메시지

       if (error instanceof Error) {
           errorMessage = error.message; // Standard Error 객체 메시지 사용

           // 특정 오류 이름에 따라 사용자 친화적인 메시지 제공
           if (error.name === 'NotAllowedError') {
                // 브라우저 또는 OS 권한 거부 시 발생하는 오류
                errorMessage = '화면 공유 권한이 거부되었습니다. 브라우저 및 OS 설정을 확인해주세요.';
                console.error("화면 공유 권한 거부. 브라우저 및 OS 설정 확인 필요.");
           } else if (error.name === 'NotFoundError') {
               // 화면 공유 소스를 찾을 수 없는 경우 (예: 사용자가 선택 취소, 또는 공유할 창/화면 없음)
               errorMessage = '화면 공유 소스를 찾을 수 없습니다. 공유할 창이나 화면을 선택했는지 확인해주세요.';
               console.error("화면 공유 소스 찾을 수 없음 또는 사용자가 선택 취소.");
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = '요청한 화면 공유 설정(해상도, 프레임 등)을 지원하지 않습니다.';
                console.error("화면 공유 제약 조건 미지원.");
           } else if (error.name === 'AgoraRTCException' && error.message) {
                // AgoraSDK 자체에서 발생한 오류 메시지 사용
                errorMessage = `Agora SDK 오류: ${error.message}`;
                console.error("Agora SDK 예외 발생:", error.message);
           } else if (error.message && typeof error.message === 'string' && error.message.includes("cannot read properties of undefined (reading 'createScreenVideoTrack')")) {
                errorMessage = 'SDK 로딩 중 오류 또는 타이밍 문제.';
                console.error("SDK 로딩 또는 타이밍 문제.");
           }


       } else if (typeof error === 'string') {
           // 오류가 문자열 형태로 넘어온 경우
           errorMessage = error;
            console.error("발생한 오류가 문자열 형태임:", errorMessage);
       } else {
           // 그 외 알 수 없는 형태의 오류 객체인 경우 안전하게 문자열로 변환 시도
           try {
               errorMessage = JSON.stringify(error);
                console.error("발생한 오류 객체 JSON 문자열화 완료:", errorMessage);
           } catch (e) {
               errorMessage = String(error);
               console.error("발생한 오류 객체 문자열화 완료:", errorMessage);
           }
       }

       // 최종 구성된 오류 메시지를 알람으로 표시
       alert('화면 공유 시작에 실패했습니다: ' + errorMessage);

       // 에러 발생 시 로컬 트랙 상태 초기화 및 UI 변경
       // localScreenVideoTrack이 유효하면 정리 시도
        if (localScreenVideoTrack) {
             try {
                  // isJoined 상태에서 에러가 났고 트랙이 유효하며 아직 발행 취소되지 않았다면 unpublish 시도
                  // (createScreenVideoTrack 실패 시에는 발행되지 않았을 가능성이 높음)
                  if(isJoined && client.localTracks.includes(localScreenVideoTrack)) {
                      await client.unpublish([localScreenVideoTrack]);
                       console.log("오류 발생 후 화면 트랙 발행 취소 시도 완료.");
                  }
             } catch(unpubError) {
                  console.warn("오류 발생 후 화면 트랙 발행 취소 중 오류:", unpubError);
             }
             localScreenVideoTrack.stop();
             localScreenVideoTrack.close();
             localScreenVideoTrack = null;
              console.log("오류 발생 후 로컬 화면 비디오 트랙 정리 완료.");
        }
        // localAudioTrack은 createScreenVideoTrack 호출 결과로 업데이트되었을 수 있으나,
        // 에러 시에는 해당 트랙을 정리하지 않고 기존 오디오 트랙 상태를 유지하거나,
        // 시스템 오디오 트랙이었다면 그것만 정리할 수 있습니다.
        // 여기서는 localScreenVideoTrack만 명시적으로 정리합니다. 필요시 audio 정리 로직 추가

         localVideoDiv.innerHTML = ''; // 로컬 비디오 엘리먼트 비우기
         console.log("로컬 비디오 엘리먼트 비우기 완료.");

       startScreenShareBtn.disabled = false;
       stopScreenShareBtn.disabled = true;
        console.log("화면 공유 오류 후 UI 상태 초기화 완료.");
       // === catch 블록 끝 ===
    }
};


// 화면 공유 중지 버튼 클릭 핸들러
stopScreenShareBtn.onclick = async () => {
    if (!localScreenVideoTrack) {
        console.log("Screen share is not active.");
        // UI 상태가 잘못되었을 수 있으니 한번 더 확인하고 업데이트
        startScreenShareBtn.disabled = isJoined ? false : true;
        stopScreenShareBtn.disabled = true;
        return;
    }

    console.log("Attempting to stop screen share...");

    try {
        // 화면 공유 트랙 발행 중지
        await client.unpublish([localScreenVideoTrack]);
        console.log("Unpublished local screen share track.");

        // 화면 공유 트랙 중지 및 해제
        localScreenVideoTrack.stop();
        localScreenVideoTrack.close();
        localScreenVideoTrack = null;
        console.log("Stopped and closed local screen share track.");

        // 로컬 비디오 엘리먼트 비우기
        localVideoDiv.innerHTML = '';
        console.log("Cleared local video element.");

        // 기존 오디오 트랙이 있다면 다시 발행 (화면 공유 시작 시 오디오를 언퍼블리시했다면)
        // 화면 공유 시작 시 오디오 트랙 발행 상태를 어떻게 관리했는지에 따라 달라짐
        // 이 예제에서는 오디오 트랙을 계속 유지하고 화면 공유 시작 시 함께 발행하거나 재활용하므로,
        // 화면 공유 중지 후에도 오디오 트랙은 계속 발행된 상태일 것으로 예상됩니다.
        // 따라서 명시적으로 오디오 트랙을 다시 발행하는 코드는 필요 없을 수 있습니다.
        // 만약 화면 공유 시작 시 오디오 트랙을 언퍼블리시했다면 여기서 다시 발행해야 합니다.
         if(localAudioTrack && localAudioTrack.trackMediaType === 'audio' && isJoined && !client.localTracks.includes(localAudioTrack)){
              await client.publish([localAudioTrack]);
              console.log("Re-published local audio track after stopping screen share.");
         } else {
             console.log("Local audio track publishing status unchanged or not available.");
         }


        // UI 상태 변경: 화면 공유 시작 버튼 활성화, 중지 버튼 비활성화
        startScreenShareBtn.disabled = false;
        stopScreenShareBtn.disabled = true;
        console.log("Screen share stopped successfully, UI updated.");

    } catch (error) {
        console.error("Failed to stop screen share:", error);
        // 중지 중 에러 발생 시 사용자에게 알림
         alert('화면 공유 중지에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));

         // 에러 발생 시 UI 상태는 변경하지 않거나, 사용자가 수동으로 조작하도록 안내
         // 또는 강제로 상태 초기화 시도 (복잡해질 수 있음)
    }
};


// 초기 UI 상태 설정 (페이지 로드 시)
joinBtn.disabled = false;
leaveBtn.disabled = true;
startScreenShareBtn.disabled = true;
stopScreenShareBtn.disabled = true;

// 웹 페이지 로드 시 마이크/카메라 접근 권한 미리 요청 (선택 사항 - 주석 해제 시 사용 가능)
// 사용자에게 미리 권한 요청하여 실제 기능 사용 시 지연 감소

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
        console.log("Microphone access granted on page load.");
        // 바로 사용하지 않으므로 미디어 스트림의 트랙을 중지하여 리소스 해제
        stream.getTracks().forEach(track => track.stop());
    })
    .catch(err => {
        console.error("Microphone access denied on page load:", err);
        // 사용자에게 권한이 필요함을 알리는 UI 표시 또는 안내
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
    });

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        console.log("Camera access granted on page load.");
        stream.getTracks().forEach(track => track.stop());
    })
    .catch(err => {
        console.error("Camera access denied on page load:", err);
        alert('카메라 접근 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
    });
