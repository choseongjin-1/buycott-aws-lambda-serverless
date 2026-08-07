import common from '/opt/common.js'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import parser from 'lambda-multipart-parser';

const pool = common.createPool()
const s3 = new S3Client();

export const handler = async (event) => {

    const connection = await common.getConnection(pool);

    try {

      await connection.beginTransaction()

      // 리뷰 시리얼넘버조회
      let reviewSrno = await getReviewSrno(connection)
          reviewSrno = reviewSrno[0].reviewSrno

      let formData = await parseFromData(event)
          if (!formData) {
                  throw new Error("폼데이터 파싱에러")
          }
          formData.reviewSrno = reviewSrno
          formData.userSrno = parseInt(formData.userSrno)
          formData.storeSrno = parseInt(formData.storeSrno)

      // 리뷰저장
      const reviewResult = await insertReview(connection, formData)

      // 별점저장
      const ratingResult = await insertRating(connection, formData)

      // 시리얼넘버, 이미지 데이터
      const storeSrno = formData.storeSrno;
          const imageData = formData.files;

      // 리뷰이미지 저장
      if (imageData && imageData.length > 0) {

            for (let img of imageData) {

                // key, filename extension세팅
                const key = `review/${storeSrno}/${reviewSrno}`;
                      const extension = img.filename.split('.').pop();
                      const filename = `${uuidv4()}.${extension}`

                // S3 매개변수 설정
                const params = {
                            Bucket: 'buycott-img',
                            Key: `${key}/${filename}`,
                            Body: img.content,
                            ContentType: img.contentType,
                };

                // s3 파일업로드
                const putObjectCommand = new PutObjectCommand(params);
                      const result = await s3.send(putObjectCommand);
                      await insertReviewImg(connection, formData, key, filename)

            }

      }

      // 트랜잭션 커밋
      await connection.commit();

      return common.responseSuccess({
              code : 7000,
              msg : "리뷰등록이 완료되었습니다."
      });

    } catch (error) {

      // 트랜잭션 롤백
      await connection.rollback();

      return common.responseFail(error.message);
    } finally {
          // 연결 해제
      await connection.release();
    }

};

// 폼데이터 파싱
const parseFromData = async (event) => {

    try {

      // Base64 디코딩
      const decodedData = Buffer.from(event.body, 'base64');

      // contentTypeHeader 추출
      let contentTypeHeader = event.params.header['Content-Type']
          if (!contentTypeHeader) {
                  contentTypeHeader = event.params.header['content-type']
          }

      // 파싱 파라메터 세팅
      const parseParams = {
              body : decodedData,
              headers : {
                        'content-type' : contentTypeHeader
              }
      }
          // 멀티파트 데이터 파싱
      const formData = await parser.parse(parseParams);
          return formData

    } catch (e) {
          return false
    }
}

// reviewSrno 조회
const getReviewSrno = async (connection) => {

    const query = 
    `
        SELECT COALESCE(MAX(REVIEW_SRNO), 0) + 1 AS reviewSrno FROM TB_REVIEW
          `
    const result = await common.runQuery(connection, query)
    return result;
}

// 리뷰등록
const insertReview = async (connection, event) => {

    const query = 
      `
            INSERT INTO TB_REVIEW
                  (
                          REVIEW_SRNO
                                , STORE_SRNO
                                      , USER_SRNO
                                            , REVIEW_CONTENT
                                                  , VALID_YN
                                                        , REG_DT
                                                              , REG_ID
                                                                    ) VALUES
                                                                          (
                                                                                  ?
                                                                                        , ?
                                                                                              , ?
                                                                                                    , ?
                                                                                                          , 'Y'
                                                                                                                , DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), '%Y-%m-%d-%H-%i')
                                                                                                                      , (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
                                                                                                                            )
                                                                                                                                `;

      return await common.runQuery(connection, query, [event.reviewSrno, event.storeSrno, event.userSrno, event.reviewContent, event.userSrno]);

}

// 별점등록
const insertRating = async (connection, event) => {

    const query = 
      `
            INSERT INTO TB_RATING
                  (
                          REVIEW_SRNO
                                , STORE_SRNO
                                      , USER_SRNO
                                            , SCORE
                                                  , VIEWS
                                                        , VALID_YN
                                                              , REG_DT
                                                                    , REG_ID
                                                                          ) VALUES
                                                                                (
                                                                                        ?
                                                                                              , ?
                                                                                                    , ?
                                                                                                          , ?
                                                                                                                , ?
                                                                                                                      , 'Y'
                                                                                                                            , DATE_FORMAT(SYSDATE(), '%Y-%m-%d-%H-%i')
                                                                                                                                  , (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
                                                                                                                                        )
                                                                                                                                            `;

      return await common.runQuery(connection, query, [event.reviewSrno, event.storeSrno, event.userSrno, event.score, 1, event.userSrno]);
}

// 새로운 리뷰이미지정보 인서트
const insertReviewImg = async (connection, formData, imgPath, fileName) => {

    const query = 
      `
            INSERT INTO TB_REVIEWIMG
                  (
                          IMG_SRNO
                                , REVIEW_SRNO
                                      , STORE_SRNO
                                            , USER_SRNO
                                                  , IMG_PATH
                                                        , IMG_FILE_NAME
                                                              , VALID_YN
                                                                    , REG_DT
                                                                          , REG_ID
                                                                                ) VALUES
                                                                                      (
                                                                                            (SELECT A.IMG_SRNO FROM (SELECT COALESCE(MAX(IMG_SRNO), 0) + 1 AS IMG_SRNO FROM TB_REVIEWIMG) AS A)
                                                                                                  , ?
                                                                                                        , ?
                                                                                                              , ?
                                                                                                                    , ?
                                                                                                                          , ?
                                                                                                                                , 'Y'
                                                                                                                                      , DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), '%Y-%m-%d-%H-%i')
                                                                                                                                            , (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
                                                                                                                                                  )
                                                                                                                                                      `;

      return await common.runQuery(connection, query, [formData.reviewSrno, formData.storeSrno, formData.userSrno, imgPath, fileName, formData.userSrno]);
}
