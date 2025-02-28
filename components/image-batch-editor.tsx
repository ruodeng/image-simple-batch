"use client"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import JSZip from "jszip"
import FileSaver from "file-saver"
import { ImageEditor } from "@/components/image-editor"
import { ImageThumbnail } from "@/components/image-thumbnail"
import { Button } from "@/components/ui/button"
import { Loader2, Download, FolderOpen } from "lucide-react" 
import removeBackground from "@/lib/remove-background"
import uploadToS3 from "@/lib/s3-upload"
type ImageFile = {
  id: string
  file: File
  preview: string
  edited: boolean
  editedPreview?: string
  rotation: number
  needsAI: {
    removeBackground: boolean
    expand: boolean
  }
}

export function ImageBatchEditor() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({
    total: 0,
    current: 0,
    status: ''
  })
 

  const [settings,setSettings] = useState({
    width: 800,
    height: 800,
    outputFormat: 'jpeg'
  })

  const handleDimensionPreset  = (preset: string) => {
    switch (preset) {
      case "800":
        setSettings({ ...settings, width: 800, height: 800 })
        break
      case "1024":
        setSettings({ ...settings, width: 1024, height: 1024 })
        break
      case "2048":
        setSettings({...settings, width: 2048, height: 2048 })
        break
      case "16:9":
        setSettings({...settings, width: 1600, height: 900 })
        break
      case "1:1":
        setSettings({...settings, width: 1000, height: 1000 })
        break
      default:
        break
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    onDrop: async (acceptedFiles) => {
      setIsLoading(true)

      const newImages = await Promise.all(
        acceptedFiles.map(async (file) => {
          const preview = await createImagePreview(file)
          return {
            id: Math.random().toString(36).substring(2, 9),
            file,
            preview,
            edited: false,
            rotation: 0,
            needsAI: {
              removeBackground: false,
              expand: false,
            },
          }
        }),
      )

      setImages((prev) => [...prev, ...newImages])
      if (!selectedImage && newImages.length > 0) {
        setSelectedImage(newImages[0].id)
      }
      setIsLoading(false)
    },
  })

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpdate = useCallback((id: string, updates: Partial<ImageFile>) => { 
    setImages((prevImages) => prevImages.map((img) => (img.id === id ? { ...img, ...updates, edited: true } : img)))
  }, [])

  const handleDownload = async () => {
    setIsProcessing(true)
    setDownloadProgress({ total: 0, current: 0, status: 'Preparing...' })

    try {
      const editedImages = images.filter((img) => img.edited)
      const imagesNeedingAI = editedImages.filter((img) => img.needsAI.removeBackground || img.needsAI.expand)

      if (imagesNeedingAI.length > 0) {
        const apiKey = localStorage.getItem("apiKey") 

        if (!apiKey) {
          setIsProcessing(false)
          return
        }

        setDownloadProgress({
          total: imagesNeedingAI.length,
          current: 0,
          status: 'Processing images with AI...'
        })

        const aiProcessedImages = await processImagesWithAI(imagesNeedingAI, (progress) => {
          setDownloadProgress(prev => ({
            ...prev,
            current: progress,
            status: `Processing image ${progress} of ${imagesNeedingAI.length}`
          }))
        })

        editedImages.forEach((img, index) => {
          const aiProcessedImage = aiProcessedImages.find((aiImg) => aiImg.id === img.id)
          if (aiProcessedImage) {
            editedImages[index].editedPreview = aiProcessedImage.editedPreview
          }
        })
      }

      setDownloadProgress({
        total: editedImages.length,
        current: 0,
        status: 'Creating zip file...'
      })

      const zip = new JSZip()

      for (let i = 0; i < editedImages.length; i++) {
                   const image = editedImages[i]  
                  let imageData = image.editedPreview || image.preview
                  const canvas = document.createElement("canvas")
                  const ctx = canvas.getContext("2d")
                  if (!ctx) {
                    throw new Error("Could not get canvas context")
                  }

                  canvas.width = settings.width
                  canvas.height = settings.height
                  
                  // Set white background for !png format
                  if (settings.outputFormat !== 'png') {
                    ctx.fillStyle = '#FFFFFF'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                  }

                  const img = new Image()
                  await new Promise((resolve, reject) => {
                    img.onload = resolve
                    img.onerror = reject
                    img.src = imageData
                  })

                  const scale = Math.min(settings.width / img.width, settings.height / img.height)
                  const newWidth = img.width * scale
                  const newHeight = img.height * scale
                  const x = (settings.width - newWidth) / 2
                  const y = (settings.height - newHeight) / 2

                  ctx.drawImage(img, x, y, newWidth, newHeight)
                  
                  await new Promise(resolve => {
                    canvas.toBlob(blob => {
                      if (!blob) {
                        throw new Error("Failed to create blob from canvas")
                      }
                      const fileName = image.file.name.replace(/\.[^.]+$/, '')
                      zip.file(`${fileName}.${settings.outputFormat}`, blob)
                      resolve()
                    }, `image/${settings.outputFormat}`)
                  })

        setDownloadProgress(prev => ({
          ...prev,
          current: i + 1,
          status: `Adding image ${i + 1} of ${editedImages.length} to zip`
        }))
      }

      setDownloadProgress(prev => ({ ...prev, status: 'Generating zip file...' }))
      const content = await zip.generateAsync({ 
        type: "blob",
        onUpdate: (metadata) => {
          if (metadata.percent) {
            setDownloadProgress(prev => ({
              ...prev,
              status: `Compressing: ${Math.round(metadata.percent)}%`
            }))
          }
        }
      })
      
      FileSaver.saveAs(content, `edited-images-${settings.width}x${settings.height}-${settings.outputFormat}.zip`)
    } catch (error) {
      console.error("Error creating zip file:", error)
    } finally {
      setIsProcessing(false)
      setDownloadProgress({ total: 0, current: 0, status: '' })
    }
  }

  // Update processImagesWithAI to accept onProgress callback
  const processImagesWithAI = async (images: ImageFile[], onProgress?: (progress: number) => void): Promise<ImageFile[]> => {
    const apiKey = localStorage.getItem("apiKey")
 

    const s3Config = {
      region: localStorage.getItem('s3Region') || '',
      accessKeyId: localStorage.getItem('s3AccessKey') || '',
      secretAccessKey: localStorage.getItem('s3SecretKey') || '',
      bucket: localStorage.getItem('s3Bucket') || '',
      endpoint: localStorage.getItem('s3Endpoint') || ''
    }

    const processedImages = [...images]

    for (let i = 0; i < processedImages.length; i++) {
      const image = processedImages[i]
      
      if (image.needsAI.removeBackground) {
        try {
          const imageData = image.editedPreview || image.preview
          const base64Data = imageData.split(",")[1]
          const binaryData = atob(base64Data)
          const array = new Uint8Array(binaryData.length)
          for (let j = 0; j < binaryData.length; j++) {
            array[j] = binaryData.charCodeAt(j)
          }
          const blob = new Blob([array], { type: "image/png" })

          console.log(s3Config)
          const s3UploadResult = await uploadToS3(blob, `${Date.now()}-${image.file.name}`, s3Config)
          
          if (!s3UploadResult.success || !s3UploadResult.url) {
            throw new Error(`Failed to upload image to S3: ${s3UploadResult.error}`)
          }else{
            console.log("Uploaded to S3:", s3UploadResult.url)
          } 
          const processedImageBase64 = await removeBackground(s3UploadResult.url, apiKey??'') 
          if (!processedImageBase64) {
            throw new Error("Failed to process image with AI")
          } 
          processedImages[i] = {
            ...image,
            editedPreview: processedImageBase64
          } 
          onProgress?.(i + 1)
        } catch (error) {
          console.error(`Error processing image ${image.file.name}:`, error)
          throw error
        }
      }
    }
    return processedImages
  }

  const selectedImageData = useMemo(
    () => (selectedImage ? images.find((img) => img.id === selectedImage) : null),
    [selectedImage, images],
  )

  const editedCount = useMemo(() => images.filter((img) => img.edited).length, [images])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-160px)]">
      {/* Left sidebar - Thumbnails */}
      <div className="border rounded-lg p-4 flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-4">Images ({images.length})</h2>

        {images.length === 0 && !isLoading ? (
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition-colors"
          >

         
            <input {...getInputProps()} directory="" webkitdirectory="" />
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">Drag & drop a folder or click to select images</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-grow">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading thumbnails...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image) => (
                    <ImageThumbnail
                      key={image.id}
                      image={image}
                      isSelected={selectedImage === image.id}
                      onClick={() => setSelectedImage(image.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button {...getRootProps()} variant="outline" className="w-full mb-2">
                <input {...getInputProps()} directory="" webkitdirectory="" />
                <FolderOpen className="mr-2 h-4 w-4" />
                Add More Images
              </Button>

              <Button onClick={handleDownload} className="w-full" disabled={editedCount === 0 || isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="flex-1 text-left">
                      {downloadProgress.status}
                      {downloadProgress.total > 0 && (
                        <span className="text-xs block">
                          {downloadProgress.current} / {downloadProgress.total}
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Edited ({editedCount}/{images.length})
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="border rounded-lg p-4 flex flex-col h-full">
        {selectedImageData ? (
          <ImageEditor
            key={selectedImageData.id}
            image={selectedImageData}
            width={settings.width}
            height={settings.height}
            onUpdate={(updates) => handleImageUpdate(selectedImageData.id, updates)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {images.length > 0 ? "Select an image to edit" : "Upload images to start editing"}
          </div>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="space-y-4">
          {/* Dimension Presets */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dimension Presets</label>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleDimensionPreset("800")}>800×800</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDimensionPreset("1024")}>1024×1024</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDimensionPreset("2048")}>2048×2048</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDimensionPreset("16:9")}>16:9</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDimensionPreset("1:1")}>1:1</Button>
            </div>
          </div>
          
          {/* Dimensions and Format Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Width</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value, 10)
                  if (!isNaN(newWidth)) {
                    setSettings({ ...settings, width: newWidth })
                  }
                }}
                className="w-full border rounded-lg p-2"
                placeholder="Width"
                min="1"
                max="8192"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Height</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value, 10)
                  if (!isNaN(newHeight)) {
                    setSettings({ ...settings, height: newHeight })
                  }
                }}
                className="w-full border rounded-lg p-2"
                placeholder="Height"
                min="1"
                max="8192"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select
                value={settings.outputFormat}
                onChange={(e) => setSettings({ ...settings, outputFormat: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



