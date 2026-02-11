import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const dir = path.join(process.cwd(), "public/evidence", itemId);
if (!fs.existsSync(dir)) {
    return NextResponse.json([]);
  }
const files = fs.readdirSync(dir);
  return NextResponse.json(files);
}
