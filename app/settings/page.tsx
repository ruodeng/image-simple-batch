"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
 

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [s3Region, setS3Region] = useState("")
  const [s3Endpoint, setS3Endpoint] = useState("")
  const [s3AccessKey, setS3AccessKey] = useState("")
  const [s3SecretKey, setS3SecretKey] = useState("")
  const [s3Bucket, setS3Bucket] = useState("")
 

  useEffect(() => {
    const storedApiUrl = localStorage.getItem("apiUrl") || "https://api.coze.cn/v1/workflow/run"
    const storedApiKey = localStorage.getItem("apiKey")
    const storedS3Region = localStorage.getItem("s3Region") || "cn-shanghai"
    const storedS3Endpoint = localStorage.getItem("s3Endpoint") || "https://tos-s3-cn-shanghai.volces.com"
    const storedS3AccessKey = localStorage.getItem("s3AccessKey")
    const storedS3SecretKey = localStorage.getItem("s3SecretKey")
    const storedS3Bucket = localStorage.getItem("s3Bucket") || "images-hh"

    if (storedApiUrl) setApiUrl(storedApiUrl)
    if (storedApiKey) setApiKey(storedApiKey)
    if (storedS3Region) setS3Region(storedS3Region)
    if (storedS3Endpoint) setS3Endpoint(storedS3Endpoint)
    if (storedS3AccessKey) setS3AccessKey(storedS3AccessKey)
    if (storedS3SecretKey) setS3SecretKey(storedS3SecretKey)
    if (storedS3Bucket) setS3Bucket(storedS3Bucket)
  }, [])

  const handleSave = () => {
 
    if (!apiUrl.trim() || !apiKey.trim() || !s3Region.trim() || !s3Endpoint.trim() || 
        !s3AccessKey.trim() || !s3SecretKey.trim() || !s3Bucket.trim()) {
          console.log({
            title: "Error",
            description: "Please fill in all required fields.",
            duration: 3000
          })
      return
    }

    localStorage.setItem("apiUrl", apiUrl.trim())
    localStorage.setItem("apiKey", apiKey.trim())
    localStorage.setItem("s3Region", s3Region.trim())
    localStorage.setItem("s3Endpoint", s3Endpoint.trim())
    localStorage.setItem("s3AccessKey", s3AccessKey.trim())
    localStorage.setItem("s3SecretKey", s3SecretKey.trim())
    localStorage.setItem("s3Bucket", s3Bucket.trim())

    console.log({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
      duration: 3000
    })
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/" className="flex items-center text-primary hover:underline mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Editor
      </Link>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="api-url">API URL</Label>
          <Input 
            id="api-url" 
            value={apiUrl} 
            onChange={(e) => setApiUrl(e.target.value)} 
            placeholder="Enter API URL"
            required
          />
        </div>
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key"
            required
          />
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">S3 Configuration</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="s3-region">Region</Label>
              <Input
                id="s3-region"
                value={s3Region}
                onChange={(e) => setS3Region(e.target.value)}
                placeholder="Enter S3 Region"
                required
              />
            </div>
            <div>
              <Label htmlFor="s3-endpoint">Endpoint URL</Label>
              <Input
                id="s3-endpoint"
                value={s3Endpoint}
                onChange={(e) => setS3Endpoint(e.target.value)}
                placeholder="Enter S3 Endpoint URL"
                required
              />
            </div>
            <div>
              <Label htmlFor="s3-access-key">Access Key ID</Label>
              <Input
                id="s3-access-key"
                value={s3AccessKey}
                onChange={(e) => setS3AccessKey(e.target.value)}
                placeholder="Enter S3 Access Key ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="s3-secret-key">Secret Access Key</Label>
              <Input
                id="s3-secret-key"
                type="password"
                value={s3SecretKey}
                onChange={(e) => setS3SecretKey(e.target.value)}
                placeholder="Enter S3 Secret Access Key"
                required
              />
            </div>
            <div>
              <Label htmlFor="s3-bucket">Bucket Name</Label>
              <Input
                id="s3-bucket"
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
                placeholder="Enter S3 Bucket Name"
                required
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} className="mt-6">Save Settings</Button>
      </div>
    </div>
  )
}

