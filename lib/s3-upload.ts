import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { access } from 'fs'

interface S3Config {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export default async function uploadToS3(file: Blob, fileName: string, config: any): Promise<UploadResult> {
    fileName = fileName + '.png'

    config = { ...config }
  try {
    const s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || '',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })

 
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.bucket,
        Key: fileName,
        Body: file,
        ContentType: 'image/png'  //file.type
      }
    })

    const response = await upload.done()
    

    // Construct the TOS URL
    const url = `https://images-hh.tos-cn-shanghai.volces.com/${encodeURIComponent(fileName)}` 
    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('Error uploading to S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function uploadMultipleToS3(files: { blob: Blob; fileName: string }[], config: S3Config): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadToS3(file.blob, file.fileName, config))
  return Promise.all(uploadPromises)
}