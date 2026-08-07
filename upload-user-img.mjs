import common from '/opt/common.js'
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import parser from 'lambda-multipart-parser';
import { v4 as uuidv4 } from 'uuid';

const pool = common.createPool()
const s3 = new S3Client();

export const handler = async (event) => {
  
  const connection = await common.getConnection(pool);
  
  try {
    
    const formData = await parseFromData(event)
    if (!formData) {
      throw new Error("폼데이터 파싱에러")
    }
    
    // 사용자 식별 번호와 이미지 데이터
    const userSrno = formData.userSrno;
    const imageData = formData.files[0];
    console.log('userSrno:', userSrno);
    console.log('imageData:', imageData);
    
    // key, filename extension세팅
    const key = `user/${userSrno}`;
    const extension = imageData.filename.split('.').pop();
    const filename = `${uuidv4()}.${extension}`
    
    // 트렌잭션 시작
    await connection.beginTransaction()
    
    // 디비데이터 업데이트 및 저장
    const updateResult = await updateUserProfile(connection, userSrno)
    console.log('updateResult ==> ', updateResult)
    const insertResult = await insertUserProfile(connection, userSrno, key, filename)
    console.log('insertResult ==> ', insertResult)
    
    // S3 매개변수 설정
    const params = {
      Bucket: 'buycott-img',
      Key: `${key}/${filename}`, // Set a unique key based on your requirements
      Body: imageData.content,
      ContentType: imageData.contentType, // Change the content type based on your file type
      //ACL: 'public-read', // Set the ACL as needed
    };
    
    // s3 파일업로드
    const putObjectCommand = new PutObjectCommand(params);
    const result = await s3.send(putObjectCommand);
    console.log('Image uploaded to S3:', result);
    
    // s3 미리 서명된 url 조회
    const getObjectCommand = new GetObjectCommand({
      Bucket: 'buycott-img',
      Key: `${key}/${filename}`,
    });
    const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 7200 }); // expiresIn은 초 단위로 서명 유효 기간을 설정합니다.
    
    // 트랜잭션 커밋
    await connection.commit();
    
    return common.responseSuccess({
      code : 4000,
      msg : "사용자 이미지 업로드가 완료되었습니다.",
      signedUrl : signedUrl
    });
  } catch (error) {
    
    console.error('Error uploading image to S3:', error.message);
    
    // 트랜잭션 롤백
    await connection.rollback();
    
    return common.responseFail(error.message);
    
  } finally {
    // 연결 해제
    await connection.release();
  }
  
};

// 폼데이터 파싱
const parseFromData = async (event) => {
  
  try {
    
    // Base64 디코딩
    const decodedData = Buffer.from(event.body, 'base64');
    
    // contentTypeHeader 추출
    let contentTypeHeader = event.params.header['Content-Type']
    if (!contentTypeHeader) {
      contentTypeHeader = event.params.header['content-type']
    }
    
    // 파싱 파라메터 세팅
    const parseParams = {
      body : decodedData,
      headers : {
        'content-type' : contentTypeHeader
      }
    }
    // 멀티파트 데이터 파싱
    const formData = await parser.parse(parseParams);
    return formData
    
  } catch (e) {
    return false
  }
}

// db 기존 프로필정보 유효여부 업데이트
const updateUserProfile = async (connection, userSrno) => {
  
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
  return await common.runQuery(connection, query, [userSrno, userSrno]);
}

// 새로운 프로필정보 인서트
const insertUserProfile = async (connection, userSrno, imgPath, fileName) => {
  
  const query = 
    `
      INSERT INTO TB_USRIMG
      (
        IMG_SRNO
      , USER_SRNO
      , IMG_PATH
      , IMG_FILE_NAME
      , VALID_YN
      , REG_DT
      , REG_ID
      ) VALUES
      (
      (SELECT A.IMG_SRNO FROM (SELECT COALESCE(MAX(IMG_SRNO), 0) + 1 AS IMG_SRNO FROM TB_USRIMG) AS A)
      , ?
      , ?
      , ?
      , 'Y'
      , DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), '%Y-%m-%d-%H-%i')
      , (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
      )
    `;
    
    return await common.runQuery(connection, query, [userSrno, imgPath, fileName, userSrno]);
}


