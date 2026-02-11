"use client";
import { useEffect, useState } from "react";
import { File, Image, FileJson } from "lucide-react";

export default function EvidencePreview({ itemId }: { itemId: string }) {
  const [files, setFiles] = useState<string[]>([]);
  const [jsonData, setJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/evidence/${itemId}`)
      .then(res => res.json())
      .then(data => {
        setFiles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setFiles([]);
        setLoading(false);
      });
  }, [itemId]);

  async function loadJson(file: string) {
    try {
      const res = await fetch(`/evidence/${itemId}/${file}`);
      setJsonData(await res.json());
    } catch (error) {
      console.error("Failed to load JSON:", error);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading evidence...</div>;
  }

  if (files.length === 0) {
    return <div className="text-muted-foreground">No evidence files yet.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Evidence Files</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {files.map(file => {
          if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")) {
            return (
              <div key={file} className="border rounded overflow-hidden">
                <img
                  src={`/evidence/${itemId}/${file}`}
                  alt={file}
                  className="w-full h-auto"
                />
                <p className="p-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" /> {file}
                </p>
              </div>
            );
          }

          if (file.endsWith(".json")) {
            return (
              <button
                key={file}
                onClick={() => loadJson(file)}
                className="border p-4 rounded text-left hover:bg-muted transition-colors flex items-center gap-2"
              >
                <FileJson className="h-4 w-4" />
                {file}
              </button>
            );
          }

          return (
            <a
              key={file}
              href={`/evidence/${itemId}/${file}`}
              download
              className="border p-4 rounded flex items-center gap-2 hover:bg-muted transition-colors"
            >
              <File className="h-4 w-4" />
              {file}
            </a>
          );
        })}
      </div>

      {jsonData && (
        <pre className="bg-card border p-4 rounded overflow-auto text-sm">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      )}
    </div>
  );
}
