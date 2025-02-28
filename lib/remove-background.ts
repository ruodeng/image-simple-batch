 
export default async function removeBackground(imageUrl: string, apiKey: string): Promise<string> {
  try {
    // Prepare the API request
    const response = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: '7476056293154881574',
        parameters: {
          input: imageUrl
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

 
    
    // Extract the processed image URL from the response
    if (  data.data ) { 
      data.data = JSON.parse(data.data) 
      if(data.data.output){ 
        console.log("RMBG Success:",data.data.output)
        // Convert the returned URL to base64
        const processedImageResponse = await fetch(data.data.output)
        const processedImageBlob = await processedImageResponse.blob()  
        return await blobToBase64(processedImageBlob)
      } else {
        throw new Error('Invalid API response format')
      }
    } else {
      throw new Error('Invalid API response format')
    }
  } catch (error) {
    console.error('Error removing background:', error)
    throw error
  }
}

// Helper function to convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => {
      reject(new Error('Failed to convert blob to base64'))
    }
    reader.readAsDataURL(blob)
  })
}