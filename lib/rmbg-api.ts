// Common types for API responses
type ApiResponse<T = any> = {
  success: boolean
  data: T | null
}

// Base parameters interface that all API calls will extend
interface BaseParams {
  user_id: string
  user_name: string
}

// Specific parameters for each API feature
interface RemoveBackgroundParams extends BaseParams {}

interface ExpandImageParams extends BaseParams {
  width: number
  height: number
  direction?: 'all' | 'horizontal' | 'vertical'
}

// API configuration
const API_CONFIG = {
  BASE_URL: 'https://api.coze.cn/v1/workflow/run',
  API_KEY: 'pat_hfwkehfncaf****', // Replace with actual API key
  WORKFLOWS: {
    REMOVE_BACKGROUND: '7476005333221605439', // Replace with actual workflow ID
    EXPAND_IMAGE: 'your_expand_workflow_id', // Add your expand image workflow ID
  }
}

// Base function to make API requests
async function makeApiRequest<T>(
  workflowId: string,
  parameters: BaseParams
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(API_CONFIG.BASE_URL??'https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        parameters
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('API request failed:', error)
    return {
      success: false,
      data: null
    }
  }
}

// Feature-specific functions
export async function removeBackground(
  params: RemoveBackgroundParams
): Promise<ApiResponse> {
  return makeApiRequest(
    API_CONFIG.WORKFLOWS.REMOVE_BACKGROUND,
    params
  )
}

export async function expandImage(
  params: ExpandImageParams
): Promise<ApiResponse> {
  return makeApiRequest(
    API_CONFIG.WORKFLOWS.EXPAND_IMAGE,
    params
  )
}