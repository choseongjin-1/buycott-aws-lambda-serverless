import common from '/opt/common.js'

const pool = common.createPool()

export const handler = async (event) => {

    try {

      const notice = await getNotice()

      return common.responseSuccess({
              code : 9000,
              msg : '공지사항조회에 성공하였습니다.',
              body : notice
      })
    } catch {

    }

};

// 공지사항 조회
const getNotice = async () => {

    const query = 
    `
      SELECT
          NOTICE_SUBJECT AS noticeSubject
              , NOTICE_CONTENT AS noticeContent
                FROM
                    TB_NOTICE
                      WHERE
                          VALID_YN = 'Y'
                            `
    return await common.runQuery(pool, query, []);
}
