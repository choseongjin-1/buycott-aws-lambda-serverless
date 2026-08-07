const jwt = require("jsonwebtoken")
const mysql  = require("mysql")
const axios = require("axios")

const common = {
      createPool : () => {
                return mysql.createPool({
                              host: process.env.DB_HOST,
                              user: process.env.DB_USER,
                              password: process.env.DB_PASSWORD,
                              database: process.env.DB_NAME
                });
      },
      getJWT : (id, password) => {
                const user = {
                            userId: "seongjin",
                            password: "1234"
                };
                const secretKey = process.env.JWT_SECRET;
                const token = jwt.sign(user, secretKey, { expiresIn: '30d' });
                console.log(token);
                return token
      },
      responseFail : (obj) => {
                return {
                              statusCode : 500,
                              error : obj
                }
      },
      responseSuccess : (obj) => {
                return {
                              statusCode : 200,
                              data : obj
                }
      },
      runQuery : (query, param = []) => {

      },
      callAxios: () => {
                const headers = {
                              "Authorization": `Bearer ${process.env.SAMPLE_TOKEN}`,
                              "Accept":"*/*",
                              'Access-Control-Allow-Origin': '*',
                              'Content-Type': 'application/json; charset = utf-8'
                }
                axios.get("https://set5ni0fd5.execute-api.ap-northeast-2.amazonaws.com/buycott/sample", {headers})
                    .then((res) => {
                                      console.log("res ==> ", res)
                    })
                    .catch((error) => {
                                      console.log("error ==> ", error.response.status)
                                      console.log("error ==> ", error.response.data)
                    })
      }
}
module.exports = common;
