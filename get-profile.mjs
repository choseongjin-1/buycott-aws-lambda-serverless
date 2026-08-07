import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    try {
          const query = 
          `
              SELECT 
                    USER_ID AS userId
                          ,USER_NAME AS userName
                                ,NICK_NAME AS nickname
                                      ,EMAIL AS email
                                            ,ADDRESS AS address
                                                  ,PUSH_YN AS pushYn
                                                        ,SIGN_TYPE AS signType
                                                            FROM TB_USER
                                                                WHERE
                                                                      USER_SRNO = ?
                                                                          AND VALID_YN = 'Y'
                                                                              `
          const userInfo = await common.runQuery(pool, query, [event.userSrno])
          if (userInfo.lenth < 1) {
                  throw new Error("존재하지 않는 사용자 입니다.")
          }

      return common.responseSuccess({ 
                                            code : 6000,
                body: userInfo[0],
                msg : "프로필 조회가 완료되었습니다."
      })
    } catch(error) {

      return common.responseFail(error.message)
    }
};
