import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {
  
  const query = 
  `
  UPDATE 
    TB_USER 
  SET 
      PUSH_TOKEN = ?
    , MOD_ID = (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
    , MOD_DT = DATE_FORMAT(SYSDATE(), '%Y-%m-%d-%H-%i')
  WHERE 
      USER_SRNO = ?
  AND VALID_YN = 'Y'
  `
  const param = [event.pushToken, event.userSrno, event.userSrno];
  
  try {  
    const result = await common.runQuery(pool, query, param);
    
    if (result.affectedRows < 1) {
      throw new Error("존재하지 않는 사용자 입니다.")
    }
    return common.responseSuccess({
      code : 3000,
      msg : "토큰업데이트에 성공하였습니다."
    })
    
  } catch(error) {
    
    return common.responseFail(error.message)
  }
  
};
