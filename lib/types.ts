export interface RMBGParams {
  image: string
}

export interface RMBGResponse {
  success: boolean
  data: {
    output?: string
  } | null
}