import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {
  try {
    
    // 디비데이터 업데이트 및 저장
    const updateResult = await updateBaseImg(event.userSrno)
    
    return common.responseSuccess({
      statusCode: 200,
      data : {
        code : 4001,
        msg : "사용자 이미지가 기본이미지로 변경되었습니다."
      }
    });
  } catch (error) {
    
    return common.responseFail(error.message);
  }
};

// 사용자 기본이미지로 변경
const updateBaseImg = async (userSrno) => {
  
  const query = 
  `
    UPDATE 
      TB_USRIMG 
    SET 
      VALID_YN = 'N'
      , MOD_ID = (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
      , MOD_DT = DATE_FORMAT(SYSDATE(), '%Y-%m-%d-%H-%i')
    WHERE 
        USER_SRNO = ?
    AND VALID_YN = 'Y'
  `
  return await common.runQuery(pool, query, [userSrno, userSrno]);
  
}