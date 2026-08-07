import jwt from 'jsonwebtoken'
import common from '/opt/common.js'

const pool = common.createPool()

const getJWT = (id, password, expire) => {
    // 사용자 정보 또는 클레임을 적절히 설정
    const user = {
          userId: id,
          password: password
    };

    // JWT를 생성
    const secretKey = process.env.JWT_SECRET; // 환경변수로 관리
    const token = jwt.sign(user, secretKey, { expiresIn: expire ? expire : '30d' });
    return token
}

export const handler = async (event) => {

    const jwt = getJWT(event.userId, event.password, event.expire)
    const query = 
    `
      UPDATE 
          TB_USER 
            SET 
                JWT = ? 
                    ,VALID_YN = 'Y'
                        , MOD_ID = ?
                            , MOD_DT = DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), '%Y-%m-%d-%H-%i')
                              WHERE 
                                    USER_ID = ? 
                                      AND PASSWORD = ?
                                        `
    const param = [jwt, event.userId, event.userId, event.password];

    try {  
      const result = await common.runQuery(pool, query, param);

      if (result.affectedRows < 1) {
              throw new Error("존재하지 않는 사용자 입니다.")
      }
          const userSrno = await common.runQuery(pool, "SELECT USER_SRNO AS userSrno FROM TB_USER WHERE USER_ID = ?", [event.userId])
          return common.responseSuccess({ 
                                              token: jwt, 
                  userSrno: userSrno[0].userSrno,
                  code : 1001,
                  msg : "로그인이 완료되었습니다."
      })

    } catch(error) {

      return common.responseFail(error.message)
    }

};
