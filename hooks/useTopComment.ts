import { useState, useEffect } from "react";

interface TopComment {
  id: string;
  content: string;
  votes: number;
  raterUser: {
    id: string;
    name: string;
    image: string;
  };
}

export function useTopComment(userId: string) {
  const [topComment, setTopComment] = useState<TopComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopComment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/top-comment`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch top comment");
        }

        const data = await response.json();
        setTopComment(data.topComment);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTopComment();
    }
  }, [userId]);

  return { topComment, loading, error };
} 