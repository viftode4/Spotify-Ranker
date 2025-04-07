import SpotifyWebApi from "spotify-web-api-node";

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Function to get an access token
export async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    return data.body.access_token;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    return null;
  }
}

// Search for albums
export async function searchAlbums(query: string) {
  await getSpotifyToken();
  const response = await spotifyApi.searchAlbums(query, { limit: 10 });
  return response.body.albums?.items || [];
}

// Get album details by ID
export async function getAlbumById(id: string) {
  await getSpotifyToken();
  const response = await spotifyApi.getAlbum(id);
  return response.body;
} 