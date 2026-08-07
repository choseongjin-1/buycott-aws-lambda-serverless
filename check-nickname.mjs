import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    const query = 
    `
      SELECT
          NICK_NAME AS nickname
            FROM
                TB_USER
                  WHERE
                      NICK_NAME=?
                        `
    const param = [event.nickname]

    try {

      const result = await common.runQuery(pool, query, param);

      if (result.length == 0) {
              return common.responseSuccess({
                        code : 2002,
                        msg : "사용 가능한 닉네임 입니다."
              })
      }

      return common.responseSuccess({
                code : 2003,
                msg : "중복된 닉네임 입니다."
      })

    } catch(error) {

      return common.responseFail(error.message)
    }

};
