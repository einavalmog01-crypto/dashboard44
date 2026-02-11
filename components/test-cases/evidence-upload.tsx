"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";

export default function EvidenceUpload({ itemId }: { itemId: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("itemId", itemId);
    
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/evidence/upload", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(prev => [...prev, ...data.files]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Upload Evidence</h3>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleUpload}
        className="hidden"
        accept="image/*,.json,.txt,.pdf"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? "Uploading..." : "Select Files"}
      </Button>
      
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploaded:</p>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <File className="h-4 w-4" />
              {file}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
