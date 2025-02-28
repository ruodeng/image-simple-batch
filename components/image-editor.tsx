"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, RotateCw, Eraser, Maximize, ZoomIn, ZoomOut } from "lucide-react"

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

interface ImageEditorProps {
  image: ImageFile
  onUpdate: (updates: Partial<ImageFile>) => void,
  width: number
  height: number
  onDimensionsChange?: (width: number, height: number) => void
}

export function ImageEditor({ image, onUpdate, width = 800, height = 800, onDimensionsChange }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleRotate = useCallback(
    (direction: "left" | "right") => { 
      const newRotation = direction === "left" ? (image.rotation - 90) % 360 : (image.rotation + 90) % 360  
      onUpdate({ rotation: newRotation })
    },
    [image.rotation, onUpdate],
  )

  const handleRemoveBackground = useCallback(() => {
    onUpdate({
      needsAI: {
        ...image.needsAI,
        removeBackground: true,
      },
    })
  }, [image.needsAI, onUpdate])

  const handleExpandImage = useCallback(() => {
    onUpdate({
      needsAI: {
        ...image.needsAI,
        expand: true,
      },
    })
  }, [image.needsAI, onUpdate])

  const handleZoom = useCallback((delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 4))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    handleZoom(delta)
  }, [handleZoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = image.preview
    img.onload = () => { 
      // Set canvas dimensions based on props or defaults
     

      // Calculate scaling to fit image within canvas while maintaining aspect ratio
      const canvasAspectRatio = width / height
      const imageAspectRatio = img.naturalWidth / img.naturalHeight 

      
      let drawWidth, drawHeight
      if (canvasAspectRatio > 1) {
        // Image is wider than canvas 
        drawWidth = width
        drawHeight = width / canvasAspectRatio
      } else {
        // Image is taller than canvas 
        drawHeight = height
        drawWidth = height * canvasAspectRatio
      }

       

      

      canvas.width = drawWidth??800
      canvas.height = drawHeight??800 

      let imageWidth = canvas.width
      let imageHeight = canvas.height

      if(imageAspectRatio<canvasAspectRatio){
        imageWidth = imageHeight * imageAspectRatio
      }else{
        imageHeight = imageWidth / imageAspectRatio
      }
 
      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Save context state
      ctx.save()

      // Move to center and apply transformations
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((image.rotation * Math.PI) / 180)
      ctx.scale(scale, scale)
      ctx.translate(position.x / scale, position.y / scale)




      // Draw image centered
      ctx.drawImage(
        img,
          -imageWidth / 2,
          -imageHeight / 2, 
        imageWidth,
        imageHeight,
      )

      // Restore context state
      ctx.restore()

      // Update preview with transparency support
      const transformedPreview = canvas.toDataURL('image/png')
      onUpdate({ editedPreview: transformedPreview })
    }

    canvas.addEventListener('wheel', handleWheel)
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [image.preview, image.rotation, scale, position, onUpdate, handleWheel])



  return (
    <div className="relative w-full h-full">

      <div className="flex-grow flex flex-col items-center justify-center overflow-hidden">
        <div id="canvas-wrapper" className="bg-[conic-gradient(#f3f4f6_90deg,#e5e7eb_90deg_180deg,#f3f4f6_180deg_270deg,#e5e7eb_270deg)] bg-[length:20px_20px] border-2 border-gray-300 rounded-lg shadow-sm">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move object-contain"
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%', 
            }}
          />
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">

       
     


          <Button variant="outline" onClick={() => handleRotate("left")}>
            <RotateCcw className="mr-2 h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={() => handleRotate("right")}>
            <RotateCw className="mr-2 h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="mr-2 h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="mr-2 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={handleRemoveBackground}
            disabled={image.needsAI.removeBackground}
          >
            <Eraser className="mr-2 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={handleExpandImage}
            disabled={image.needsAI.expand}
          >
            <Maximize className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={() => {
          setScale(1)
          setPosition({ x: 0, y: 0 })
          onUpdate({ edited: false })
        }}>
          Reset
        </Button>
  
      </div>
    </div>
  )
}

