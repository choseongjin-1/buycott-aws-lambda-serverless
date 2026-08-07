import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {
    try {
          const valid = await checkStroe(event);
          if (valid.length > 0) {

            if (valid[0].VALID_YN != "Y") {
                      return common.responseSuccess({
                                  code: 5003,
                                  msg: "관리자 승인 진행중인 가게입니다.",
                      });
            }

            return common.responseSuccess({
                      code: 5002,
                      msg: "이미 등록된 가게입니다.",
            });
          }

      const result = await insertStore(event);
          return common.responseSuccess({
                  code : 5001,
                  msg : "가게등록이 완료되었습니다. 관리자 승인 진행 후 조회 가능합니다."
          });

    } catch (error) {

      return common.responseFail(error.message);
    }
};

// 등록가게 확인
const checkStroe = async (event) => {
    const query =
        `
          SELECT * FROM TB_STORE WHERE STORE_LOC = POINT(?, ?)
            `
    const result = await common.runQuery(pool, query, [event.x, event.y]);
    return result
}
// 가게정보 등록
const insertStore = async (event) => {
    const query = 
    `
        INSERT INTO TB_STORE
            (
                STORE_SRNO
                    , API_ID
                        , USER_SRNO
                            , STORE_TYPE
                                , STORE_TYPE_NM
                                    , STORE_ADDRESS
                                        , STORE_LOC
                                            , STORE_PHONE
                                                , STORE_NAME
                                                    , STORE_DESC
                                                        , PRP_REASON
                                                            , BUSINESS_HOURS
                                                                , VALID_YN
                                                                    , REG_DT
                                                                        , REG_ID
                                                                            ) VALUES
                                                                                (
                                                                                    (SELECT A.STORE_SRNO FROM (SELECT COALESCE(MAX(STORE_SRNO), 0) + 1 AS STORE_SRNO FROM TB_STORE) AS A)
                                                                                        , ?
                                                                                            , ?
                                                                                                , ?
                                                                                                    , ?
                                                                                                        , ?
                                                                                                            , POINT(?, ?)
                                                                                                                , ?
                                                                                                                    , ?
                                                                                                                        , ?
                                                                                                                            , ?
                                                                                                                                , ?
                                                                                                                                    , 'N'
                                                                                                                                        , DATE_FORMAT(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'), '%Y-%m-%d-%H-%i')
                                                                                                                                            , (SELECT A.USER_ID FROM (SELECT USER_ID FROM TB_USER WHERE USER_SRNO = ?) AS A)
                                                                                                                                                )
                                                                                                                                                  `;
    const param = [event.apiId, event.userSrno, event.storeType, event.storeTypeNm, event.storeAddress, event.x, event.y, event.storePhone, event.storeName, event.storeDesc, event.prpReason, event.businessHours, event.userSrno]
    const result = await common.runQuery(pool, query, param);
    return result
}
