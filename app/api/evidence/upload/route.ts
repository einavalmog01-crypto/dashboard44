import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll("files");
  const itemId = formData.get("itemId") as string;
const uploadDir = path.join(process.cwd(), "public/evidence", itemId);
  fs.mkdirSync(uploadDir, { recursive: true });
for (const file of files) {
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, (file as File).name), buffer);
  }
return NextResponse.json({ success: true });
}
