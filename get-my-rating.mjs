import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    const result = await getMyRating(event)

    try {

      return common.responseSuccess({
              code : 9001,
              msg : "내 별점 조회가 완료되었습니다.",
              body : result[0]
      });

    } catch (error) {

      return common.responseFail(error.message);
    }
};

// 내가준 별점 조회
const getMyRating = async (event) => {

    const query = 
    `
        SELECT
              SCORE
                  FROM TB_RATING
                      WHERE 1=1
                          AND USER_SRNO = ?
                              AND STORE_SRNO = ?
                                  AND VALID_YN = 'Y'
                                    `
    return await common.runQuery(pool, query, [event.userSrno, event.storeSrno]);
}
