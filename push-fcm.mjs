import admin from 'firebase-admin'
import common from '/opt/common.js'
import * as fs from 'fs';

// Firebase Admin SDK 구성 파일을 읽어오기 (Lambda Layer에 위치)
const serviceAccount = JSON.parse(fs.readFileSync('/opt/firebase-adminsdk.json', 'utf8'));
const pool = common.createPool()
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const handler = async (event) => {
    try {
          // 수신자의 FCM 토큰 (앱 인스턴스 식별자)을 설정
      const pushInfo = await common.runQuery(pool, "SELECT PUSH_TOKEN AS pushToken, PUSH_YN AS pushYn FROM TB_USER WHERE USER_SRNO=?", [event.userSrno]);

      const pushYn = pushInfo[0].pushYn
          if (!(pushInfo[0].pushYn == "Y")) {
                  return common.responseSuccess({code:3004, msg:"알림수신 거부 회원 입니다."})
          }

      // 푸시 알림 메시지 작성
      const message = {
              notification: {
                        title: event.title,
                        body: event.body,
              },
              data: event.data ? event.data : {},
              token: pushInfo[0].pushToken
      };

      // FCM을 통해 푸시 알림 보내기
      const response = await admin.messaging().send(message);
          console.log('Successfully sent message:', response);

      return common.responseSuccess({code:3003, msg:"알림전송이 완료되었습니다."})
    } catch (error) {

      console.error('Error sending push notification:', error);
          return common.responseFail(error.message)
    }
};
