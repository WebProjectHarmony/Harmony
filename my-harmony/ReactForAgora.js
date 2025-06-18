import { createClient, createMicrophoneAudioTrack, createScreenVideoTrack } from 'agora-rtc-sdk-ng';


export const client = createClient({ mode: 'rtc', codec: 'vp8' });
// export let appId = null;

export let appId = '59810fc0e24c4ed1b4584f9b3f982842'
export let isJoined = false;

// 모든 트랙 관련 변수
export let localAudioTrack = null;
export let localScreenTrack = null;

// export function setAppId(id) {
//     appId = id;
// }

/** 채널 접속 */
export async function connectToChannel(channelName, uid = null) {
    if (!appId || !channelName) {
        console.error('appId 또는 채널명이 없습니다.');
        return;
    }

    try {
        // 토큰 요청
         const res = await fetch(`http://localhost:3000/rtcToken?channelName=${encodeURIComponent(channelName)}&uid=${uid ?? ''}`);
        //const res = await fetch(`http://localhost:3000/rtcToken?channelName=${encodeURIComponent(channelName)}&uid=${uid ?? ''}`);
        const data = await res.json();
        if (data.error || !data.rtcToken) {
            console.error('토큰을 받지 못했거나 오류:', data.error || '토큰 없음');
            return;
        }

        const rtcToken = data.rtcToken;
        const joinUid = await client.join(appId, channelName, rtcToken, uid);
        isJoined = true;

        // 오디오 트랙 생성 후 발행
        localAudioTrack = await createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        return joinUid;

    } catch (err) {
        console.error('채널 접속 실패:', err);
    }
}

/** 채널 나가기 */
export async function leaveChannel() {
    if (!isJoined) return;

    try {
        if (localAudioTrack) {
            await client.unpublish([localAudioTrack]);
            localAudioTrack.stop();
            localAudioTrack.close();
            localAudioTrack = null;
        }

        if (localScreenTrack) {
            await client.unpublish([localScreenTrack]);
            localScreenTrack.stop();
            localScreenTrack.close();
            localScreenTrack = null;
        }

        await client.leave();
        isJoined = false;
        console.log('채널에서 나갔습니다.');
    } catch (err) {
        console.error('채널 퇴장 실패:', err);
    }
}

/** 화면 공유 시작 */
export async function startScreenShare() {
    if (!isJoined) {
        console.error('채널에 먼저 참여하세요.');
        return;
    }

    try {
        // 기존에 있던 화면공유 종료 (드러내기 위해)
        if (localScreenTrack) {
            await client.unpublish([localScreenTrack]);
            localScreenTrack.stop();
            localScreenTrack.close();
            localScreenTrack = null;
        }

        // 화면 공유 트랙 생성
        localScreenTrack = await createScreenVideoTrack({ encoderConfig: "1080p_2", withAudio: 'auto' }, localAudioTrack);
        // 화면공유 미리보기
        // 사용자 맞게 화면공유 미리보기 DOM에 연결
        // 생략 가능 (사용자가 보는 곳에 연결하기 위해서는 DOM 드리기 필요)
        
        await client.publish([localScreenTrack]);
        console.log('화면 공유 시작');

        // 화면 공유 종료 이벤트(브라우저 '공유 중지' 버튼 등)
        localScreenTrack.on("track-ended", () => {
            stopScreenShare();
        });

    } catch (err) {
        console.error('화면 공유 시작 실패:', err);
    }
}

/** 화면 공유 중지 */
export async function stopScreenShare() {
    if (localScreenTrack) {
        await client.unpublish([localScreenTrack]);
        localScreenTrack.stop();
        localScreenTrack.close();
        localScreenTrack = null;
        console.log('화면 공유 종료');
    }
}