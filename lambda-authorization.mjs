import jwt from 'jsonwebtoken'
import mysql from 'mysql'
import common from '/opt/common.js'

const pool = common.createPool()

// 정책을 생성하는 함수
const generatePolicy = (principalId, effect, resource) => {
      return {
              principalId: principalId,
              policyDocument: {
                        Version: "2012-10-17",
                        Statement: [
                          {
                                        Action: "execute-api:Invoke",
                                        Effect: effect,
                                        Resource: resource,
                          },
                                  ],
              },
      };
};

export const handler = async (event) => {

    // 클라이언트에서 전송한 JWT 토큰
    const token = event.authorizationToken.replace("Bearer ", "")

    // JWT 검증 키
    const secretKey = process.env.JWT_SECRET;

    try {

      // JWT 검증
      if (!token) {
              throw new Error('Token is missing');
      }

      // JWT 검증
      const decoded = jwt.verify(token, secretKey);

      // 여기서부터는 검증 성공에 대한 로직을 추가하면 됨
      const query = "SELECT COUNT(*) AS COUNT FROM TB_USER WHERE USER_id = ? AND PASSWORD = ? AND VALID_YN = ?"
          const result = await common.runQuery(pool, query, [decoded.userId, decoded.password, 'Y'])
          const count = result[0]['COUNT']

      if (count < 1) {
              return generatePolicy(decoded.userId, "Deny", event.methodArn)
      }

      // 권한이 부여된 경우
      return generatePolicy(decoded.userId, 'Allow', event.methodArn);

    } catch (error) {
            // 검증 실패 시 에러 처리
        console.error('JWT verification failed:', error);
            console.error('JWT verification failed:', error.name);
            if (error.name == "TokenExpiredError") {
                      return generatePolicy("", "Deny", event.methodArn)
            }

        return {
                    statusCode: 401,
                    error : error.message
        };
    }
};
