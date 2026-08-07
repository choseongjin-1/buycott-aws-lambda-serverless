import jwt from 'jsonwebtoken'
import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {
  
  const connection = await common.getConnection(pool);
  
  try {
    
    // jwt 생성
    const jwt = await getJWT(event.userId, event.password)
    console.log("jwt ==> ", jwt)
    
    await connection.beginTransaction()
    
    // 사용자 시리얼넘버 조회
    const userSrno = await getUserSrno(connection, jwt)
    console.log("userSrno ==> ", userSrno[0].userSrno)
    
    // 사용자 데이터 저장
    const param = [userSrno[0].userSrno, event.userId, event.password, event.userName, event.nickname, event.email, event.address, event.birth, event.gender, event.signType, jwt, 'Y', event.userId];
    const insertResult = await insertUser(connection, param)
    console.log("insertResult ==> ", insertResult)
    
    // 트랜잭션 커밋
    await connection.commit();
  
    return common.responseSuccess({ 
      token : jwt, 
      userSrno : userSrno[0].userSrno,
      code : 1000,
      msg : "회원가입이 완료되었습니다."
    })
    
  } catch (error) {
    
    // 트랜잭션 롤백
    await connection.rollback();
    
    return common.responseFail(error.message)
    
  } finally {
    // 연결 해제
    await connection.release();
  }
};

// 사용자정보 저장
const insertUser = async (connection, param) => {
  const query = 
    `
      INSERT INTO TB_USER
      (
      USER_SRNO
      , user_id
      , password
      , USER_NAME
      , NICK_NAME
      , email
      , address
      , birth
      , gender
      , sign_type
      , jwt
      , reg_dt
      , valid_yn
      , reg_id
      ) VALUES
      (
        ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), '%Y-%m-%d-%H-%i')
      , ?
      , ?
      )
    `;
    
    return await common.runQuery(connection, query, param);
}

// 사용자 시리얼넘버 조회
const getUserSrno = async (connection) => {
  
  const query = 
  `
    SELECT COALESCE(MAX(USER_SRNO), 0) + 1 AS userSrno FROM TB_USER
  `
  
  return await common.runQuery(connection, query)
}

// jwt 생성
const getJWT = async (id, password) => {
  // 사용자 정보 또는 클레임을 적절히 설정
  const user = {
    userId: id,
    password: password
  };
  
  // JWT를 생성
  const secretKey = 'buycott'; // 비밀 키는 안전한 곳에 저장해야 합니다.
  const token = jwt.sign(user, secretKey, { expiresIn: '30d' }); // 1시간 동안 유효한 토큰
  return token
}
