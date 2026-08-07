import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    const query = 
    `
      SELECT
          USER_ID AS userID
              , NICK_NAME AS nickName
                FROM
                    TB_USER
                      WHERE
                          USER_ID=?
                            `
    const param = [event.userId]

    try {

      const result = await common.runQuery(pool, query, param);

      if (result.length == 0) {
              return common.responseSuccess({
                        code : 2000,
                        msg : "신규가입 대상 회원 입니다."
              })
      }

      return common.responseSuccess({
                code : 2001,
                msg : "로그인 대상 회원 입니다."
      })

    } catch(error) {

      return common.responseFail(error.message)
    }

};
