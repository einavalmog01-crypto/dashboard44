import EvidenceUpload from "@/components/test-cases/evidence-upload";
import EvidencePreview from "@/components/test-cases/evidence-preview";

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ item: string }>;
}) {
  const { item } = await params;
  return (
    <div className="p-6 space-y-6">
      <EvidenceUpload itemId={item} />
      <EvidencePreview itemId={item} />
    </div>
  );
}
