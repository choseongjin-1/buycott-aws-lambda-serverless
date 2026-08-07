import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    try {

       const result = await getStore()
           return common.responseSuccess({
                    code : 5000,
                    msg : "가게 조회에 성공하였습니다.",
                    body : result
           })
    } catch (error) {

      return common.responseFail(error.message)
    }
};

// 메인화면의 가게정보를 가져온다.
const getStore = async () => {

    const query = 
    `
      (
          SELECT
                  A.STORE_SRNO AS storeSrno
                          , A.STORE_TYPE AS storeType
                                  , A.STORE_TYPE_NM AS storeTypeNm
                                          , A.STORE_PHONE AS storePhone
                                                  , A.STORE_ADDRESS AS storeAddress
                                                          , A.STORE_DESC AS storeDesc
                                                                  , A.STORE_LOC AS storeLoc
                                                                          , A.STORE_NAME AS storeName
                                                                                  , ROUND(COALESCE(AVG(B.SCORE) , 0)) AS score
                                                                                          , A.REG_DT as regDt
                                                                                                  , A.PRP_REASON AS prpReason
                                                                                                          , A.BUSINESS_HOURS AS businessHours
                                                                                                                  , 1 AS code
                                                                                                                        FROM
                                                                                                                                TB_STORE A
                                                                                                                                      LEFT JOIN TB_RATING B 
                                                                                                                                            ON A.STORE_SRNO = B.STORE_SRNO 
                                                                                                                                                  WHERE 1=1
                                                                                                                                                        AND A.VALID_YN = 'Y'
                                                                                                                                                              GROUP BY A.STORE_SRNO
                                                                                                                                                                    limit 5
                                                                                                                                                                      )
                                                                                                                                                                        UNION ALL
                                                                                                                                                                          (
                                                                                                                                                                              SELECT
                                                                                                                                                                                      A.STORE_SRNO AS storeSrno
                                                                                                                                                                                              , A.STORE_TYPE AS storeType
                                                                                                                                                                                                      , A.STORE_TYPE_NM AS storeTypeNm
                                                                                                                                                                                                              , A.STORE_PHONE AS storePhone
                                                                                                                                                                                                                      , A.STORE_ADDRESS AS storeAddress
                                                                                                                                                                                                                              , A.STORE_DESC AS storeDesc
                                                                                                                                                                                                                                      , A.STORE_LOC AS storeLoc
                                                                                                                                                                                                                                              , A.STORE_NAME AS storeName
                                                                                                                                                                                                                                                      , ROUND(COALESCE(AVG(B.SCORE) , 0)) AS score
                                                                                                                                                                                                                                                              , A.REG_DT as regDt
                                                                                                                                                                                                                                                                      , A.PRP_REASON AS prpReason
                                                                                                                                                                                                                                                                              , A.BUSINESS_HOURS AS businessHours
                                                                                                                                                                                                                                                                                      , 2 AS code
                                                                                                                                                                                                                                                                                            FROM
                                                                                                                                                                                                                                                                                                    TB_STORE A
                                                                                                                                                                                                                                                                                                          LEFT JOIN TB_RATING B 
                                                                                                                                                                                                                                                                                                                ON A.STORE_SRNO = B.STORE_SRNO
                                                                                                                                                                                                                                                                                                                      WHERE 1=1
                                                                                                                                                                                                                                                                                                                            AND A.VALID_YN = 'Y'
                                                                                                                                                                                                                                                                                                                                  AND STR_TO_DATE(A.REG_DT, '%Y-%m-%d-%H-%i') > DATE_SUB(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), INTERVAL 1 WEEK)
                                                                                                                                                                                                                                                                                                                                        GROUP BY A.STORE_SRNO
                                                                                                                                                                                                                                                                                                                                              limit 5
                                                                                                                                                                                                                                                                                                                                                )
                                                                                                                                                                                                                                                                                                                                                  ORDER BY 
                                                                                                                                                                                                                                                                                                                                                    	code
                                                                                                                                                                                                                                                                                                                                                        	, CASE WHEN code = 1 THEN score END DESC
                                                                                                                                                                                                                                                                                                                                                            	, CASE WHEN code = 2 THEN regDt END DESC
                                                                                                                                                                                                                                                                                                                                                                `
    return await common.runQuery(pool, query)
}
