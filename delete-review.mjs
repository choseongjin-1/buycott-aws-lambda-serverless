import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    try {

      // 리뷰삭제
      const result = await deleteReview(event)

      return common.responseSuccess({
              code : 7002,
              msg : "리뷰삭제가 완료되었습니다.",
      });

    } catch (error) {

      return common.responseFail(error.message);

    }

};

// 리뷰삭제
const deleteReview = async (event) => {

    const query = 
    `
        UPDATE 
              TB_REVIEW 
                  SET 
                        VALID_YN = 'N'
                              , MOD_ID = (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
                                    , MOD_DT = DATE_FORMAT(SYSDATE(), '%Y-%m-%d-%H-%i')
                                        WHERE 1=1
                                            AND REVIEW_SRNO = ?
                                                AND VALID_YN = 'Y'
                                                  `
    return await common.runQuery(pool, query, [event.userSrno, event.reviewSrno]);
}
