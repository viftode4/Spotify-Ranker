import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Track } from "./types";

interface TrackListProps {
  tracks: Track[];
}

export function TrackList({ tracks }: TrackListProps) {
  // Format duration from milliseconds to MM:SS
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="text-xl font-semibold">Tracks</h2>
      </CardHeader>
      <CardContent>
        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracks available</p>
        ) : (
          <ul className="space-y-2">
            {tracks
              .sort((a, b) => a.number - b.number)
              .map((track) => (
                <li key={track.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground w-6">
                      {track.number}.
                    </span>
                    <span>{track.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(track.duration)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 