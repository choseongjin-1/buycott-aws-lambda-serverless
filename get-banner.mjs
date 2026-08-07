import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client();

export const handler = async (event) => {

      try {

          const bucket = 'buycott-img';
                const prefix = 'banner/';

          // S3 객체 리스트 가져오기
          const objectKeys = await getS3List(bucket, prefix)

          // 서명된 URL 가져오기
          const signedUrls = await getSignedUrls(bucket, objectKeys);

          // 성공 응답 반환
          return {
                        statusCode: 200,
                        data: {
                                          code : 8000,
                                          msg : '배너조회에 성공하였습니다.',
                                          body : signedUrls
                        },
          };
      } catch (error) {
                // 오류 처리
          console.error('Error:', error);
                return {
                              statusCode: 500,
                              error: error.message
                };
      }
};

// s3 객체리스트 조회
const getS3List = async (bucket, prefix) => {

      const listObjectsCommand = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
      });

      let response = await s3.send(listObjectsCommand);
      response.Contents.shift()
      response = response.Contents.map((object) => object.Key);
      return response;
}

// 조회한 객체리스트key로 서명가능url생성
const getSignedUrls = async (bucket, keys) => {

      const signedUrls = [];

      for (const key of keys) {
                const getObjectCommand = new GetObjectCommand({
                              Bucket: bucket,
                              Key: key,
                });

          const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 7200 });
                signedUrls.push({ fileName : key.replace("banner/", ""), signedUrl });
      }

      return signedUrls;
}
