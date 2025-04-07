import { AlbumClient } from "@/components/album/AlbumClient";

interface AlbumPageProps {
  params: {
    id: string;
  };
}

export default function AlbumPage({ params }: AlbumPageProps) {
  return (
    <div className="container mx-auto p-6">
      <AlbumClient albumId={params.id} />
    </div>
  );
} 