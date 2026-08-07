import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    try {

       const result = await getStore(event.x, event.y, event.radius)
           return common.responseSuccess({
                    code : 5000,
                    msg : "가게 조회에 성공하였습니다.",
                    body : result
           })
    } catch (error) {

      return common.responseFail(error.message)
    }

};

// 지도화면의 가게정보를 가져온다.
const getStore = async (x, y, radius) => {

    const query = 
    `
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
                                                          , CAST(
                                                              		ST_DISTANCE_SPHERE(
                                                                      	        POINT(?, ?),
                                                                                    	        A.STORE_LOC
                                                                                                	    ) AS SIGNED
                                                                                                            ) AS distance
                                                                                                              FROM
                                                                                                                    TB_STORE A
                                                                                                                      LEFT JOIN TB_RATING B 
                                                                                                                        ON A.STORE_SRNO = B.STORE_SRNO
                                                                                                                          AND B.VALID_YN = 'Y'
                                                                                                                            WHERE
                                                                                                                                  A.VALID_YN = 'Y'
                                                                                                                                        AND ST_DISTANCE_SPHERE(
                                                                                                                                                  POINT(?, ?),
                                                                                                                                                            A.STORE_LOC
                                                                                                                                                                  ) <= ?
                                                                                                                                                                    GROUP BY A.STORE_SRNO
                                                                                                                                                                      `
    return await common.runQuery(pool, query, [x, y, x, y, radius ? radius : "500"])
}
