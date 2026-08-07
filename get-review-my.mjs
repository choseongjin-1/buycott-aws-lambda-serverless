import common from '/opt/common.js'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const pool = common.createPool()
const s3 = new S3Client();

export const handler = async (event) => {

    const connection = await common.getConnection(pool);

    try {

      // 트렌잭션 시작
      await connection.beginTransaction()

      const review = await getReview(connection, event)

      // 미리서명된 url 추출
      for (let i = 0; i < review.length; i++) {
              let storeSrno = review[i].storeSrno
              let reviewSrno = review[i].reviewSrno
              let signedUrls = []

                      // 리뷰이미지 데이터 조회
                      let reviewImg = await getReviewImg(connection, storeSrno, reviewSrno)

            // 미리서명된 url 조회
            if (reviewImg.length > 0) {

                for (let i = 0; i < reviewImg.length; i++) {

                        // s3 미리 서명된 url 조회
                        const getObjectCommand = new GetObjectCommand({
                                      Bucket: 'buycott-img',
                                      Key: `${reviewImg[i].imgPath}/${reviewImg[i].imgFileName}`,
                        });
                            const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 7200 });
                            signedUrls.push(signedUrl)
                }

            }
              review[i].signedUrls = signedUrls
      }

      // 트랜잭션 커밋
      await connection.commit();

      return common.responseSuccess({
              code : 7001,
              msg : "리뷰조회가 완료되었습니다.",
              body : {
                        review,
                        totalPageNum : review[0].totalPageNum
              }
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

// 내가쓴리뷰목록 조회
const getReview = async (connection, event) => {

    const pageNum = parseInt(event.pageNum)
    const limit = parseInt(event.limit)
    const offset = (pageNum - 1) * limit

    const query = 
    `
      SELECT 
          A.REVIEW_SRNO AS reviewSrno
              , A.STORE_SRNO AS storeSrno
                  , C.STORE_NAME AS storeName
                      , A.USER_SRNO AS userSrno
                          , A.REVIEW_CONTENT AS reviewContent
                              , A.REG_DT AS regDt
                                  , (SELECT CEIL(COUNT(*) / ?) FROM TB_REVIEW WHERE USER_SRNO  = A.USER_SRNO) AS totalPageNum
                                      , COALESCE(B.SCORE , 0) AS score
                                        FROM
                                              TB_REVIEW A
                                                LEFT JOIN
                                                  	TB_RATING B
                                                      ON
                                                        	A.REVIEW_SRNO = B.REVIEW_SRNO
                                                            AND B.VALID_YN = 'Y'
                                                              AND A.STORE_SRNO = B.STORE_SRNO 
                                                                AND A.USER_SRNO = B.USER_SRNO 
                                                                  AND B.VALID_YN = 'Y'
                                                                    LEFT JOIN
                                                                        TB_STORE C
                                                                          ON
                                                                              A.STORE_SRNO = C.STORE_SRNO
                                                                                AND C.VALID_YN = 'Y'
                                                                                  WHERE 1=1
                                                                                    AND A.USER_SRNO = ?
                                                                                      AND A.VALID_YN = 'Y'
                                                                                        ORDER BY A.REG_DT DESC
                                                                                          LIMIT ? OFFSET ?
                                                                                            `
    const result = await common.runQuery(connection, query, [limit, event.userSrno, limit, offset]);
    return result
}

const getReviewImg = async (connection, storeSrno, reviewSrno) => {

    const query =
        `
          SELECT
              IMG_PATH AS imgPath
                  ,IMG_FILE_NAME AS imgFileName
                    FROM TB_REVIEWIMG
                      WHERE 1=1
                        AND STORE_SRNO = ?
                          AND REVIEW_SRNO = ?
                            AND VALID_YN = 'Y'
                              `
    const result = await common.runQuery(connection, query, [storeSrno, reviewSrno]);
    return result
}
