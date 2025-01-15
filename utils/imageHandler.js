import AWS from "aws-sdk";

export class AWSS3Uploader {
  constructor(config) {
    AWS.config = new AWS.Config();
    AWS.config.update({
      region: config.region || "ca-central-1",
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    });

    this.s3 = new AWS.S3();
    this.config = config;
  }
}

const s3Uploader = new AWSS3Uploader({
  accessKeyId: process.env.AWS_ACCES_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  destinationBucketName: process.env.BUCKET
});

const uploadImgToAWS = async (file, folder) => {
  const { createReadStream, filename, mimetype, encoding } = await file;

  const stream = createReadStream();
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const fileBuffer = Buffer.concat(chunks);
  const fileSizeInBytes = fileBuffer.byteLength;
  const fileSizeInGB = fileSizeInBytes / (1024 ** 3);

  const upload = {
    Bucket: process.env.BUCKET,
    ACL: 'public-read',
    ContentDisposition: 'inline',
    Key: `${folder}${Date.now()}${filename}`,
    Body: fileBuffer
  };

  const data = await new Promise((resolve, reject) => {
    s3Uploader.s3.upload(upload, (err, data) => {
      if (err) {
        reject(new Error('There was an error uploading your file: ', err));
      } else {
        resolve(data);
      }
    });
  });

  return ({
    data,
    filename,
    mimetype,
    encoding,
    fileSizeInBytes,
    fileSizeInGB: fileSizeInGB.toFixed(2)
  });
};

const deleteImgToAWS = async (key) => {
  const upload = {
    Bucket: process.env.BUCKET,
    Key: key,
  };
  await new Promise((resolve) => {
    s3Uploader.s3.deleteObject(upload, (err, data) => {
      if (err) {
        console.log('There was an error delete your file: ', err);
        resolve(null);
      } else {
        resolve(data);
      }
    });
  });
  return true
}

export {
  uploadImgToAWS,
  deleteImgToAWS
}
