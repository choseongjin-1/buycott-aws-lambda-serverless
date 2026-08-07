import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {
  
  const query = 
  `
  UPDATE 
    TB_USER 
  SET 
      PUSH_YN = ?
    , MOD_ID = (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
    , MOD_DT = DATE_FORMAT(SYSDATE(), '%Y-%m-%d-%H-%i')
  WHERE 
      USER_SRNO = ?
  AND VALID_YN = 'Y'
  `
  const param = [event.pushYn, event.userSrno, event.userSrno];
  
  try {  
    const result = await common.runQuery(pool, query, param);
    
    if (result.affectedRows < 1) {
      throw new Error("존재하지 않는 사용자 입니다.")
    }
    
    return common.responseSuccess({
      code : event.pushYn == "Y" ? 3001 : 3002,
      msg : event.pushYn == "Y" ? "알림수신 설정이 완료되었습니다." : "알림수신 거부가 완료되었습니다."
    })
    
  } catch(error) {
    
    return common.responseFail(error.message)
  }
  
};