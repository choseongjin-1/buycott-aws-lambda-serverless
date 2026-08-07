import common from '/opt/common.js'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const pool = common.createPool()
const s3 = new S3Client();

export const handler = async (event) => {

    try {

      const imgInfoResult = await getUserImgInfo(event.userSrno)
          if (imgInfoResult.length == 0) {
                  return common.responseSuccess({
                            event,
                            code : 4003,
                            msg : '사용자 이미지가 없습니다.'
                  })
          }

      // s3 미리 서명된 url 조회
      const getObjectCommand = new GetObjectCommand({
              Bucket: 'buycott-img',
              Key: `${imgInfoResult[0].imgPath}/${imgInfoResult[0].imgFileName}`,
      });
          const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 7200 });

      return common.responseSuccess({
              signedUrl,
              code : 4002,
              msg : '사용자 이미지 조회가 완료되었습니다.'
      })
    } catch (error) {

      return common.responseFail(error.message)
    }
};

// 사용자 프로필 이미지경로 조회
const getUserImgInfo = async (userSrno) => {

    const query = 
    `
      SELECT
          IMG_PATH AS imgPath
              , IMG_FILE_NAME AS imgFileName
                FROM
                    TB_USRIMG
                      WHERE
                          USER_SRNO = ?
                            AND VALID_YN = 'Y'
                              `
    return await common.runQuery(pool, query, [userSrno]);
}
