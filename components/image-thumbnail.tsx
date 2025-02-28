import { cn } from "@/lib/utils"

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

interface ImageThumbnailProps {
  image: ImageFile
  isSelected: boolean
  onClick: () => void
  width?: number
  height?: number
}

export function ImageThumbnail({ image, isSelected, onClick, width = 800, height = 800 }: ImageThumbnailProps) {
  const aspectRatio = width / height
  const thumbnailSize = 100 // Base size for thumbnails
  const thumbnailWidth = thumbnailSize
  const thumbnailHeight = thumbnailSize / aspectRatio

  return (
    <div
      className={cn(
        "relative cursor-pointer rounded-md overflow-hidden border-2 bg-[conic-gradient(#f3f4f6_90deg,#e5e7eb_90deg_180deg,#f3f4f6_180deg_270deg,#e5e7eb_270deg)] bg-[length:20px_20px]",
        isSelected ? "border-primary" : "border-transparent",
        "transition-all duration-200",
      )}
      onClick={onClick}
      style={{
        width: `${thumbnailWidth}px`,
        height: `${thumbnailHeight}px`,
      }}
    >
      <img
        src={image.editedPreview || image.preview}
        alt={image.file.name}
        className="w-full h-full object-cover"
      
      />

      {/* Gray overlay for unedited images */}
      {!image.edited && (
        <div className="absolute inset-0 bg-gray-500/50 flex items-center justify-center">
          <span className="text-xs text-white font-medium">Not Edited</span>
        </div>
      )}

      {/* AI badge if needed */}
      {(image.needsAI.removeBackground || image.needsAI.expand) && (
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1 rounded">AI</div>
      )}
    </div>
  )
}

