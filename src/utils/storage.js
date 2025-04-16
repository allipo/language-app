import { Storage } from '@google-cloud/storage';

// Initialize storage
const storage = new Storage({
  projectId: process.env.REACT_APP_GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH
});

const bucketName = process.env.REACT_APP_GOOGLE_CLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// Upload a file
export const uploadFile = async (file) => {
  try {
    const blob = bucket.file(file.name);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.type,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => reject(error));
      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        resolve(publicUrl);
      });
      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get file URL
export const getFileUrl = (fileName) => {
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
};

// Delete a file
export const deleteFile = async (fileName) => {
  try {
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}; 