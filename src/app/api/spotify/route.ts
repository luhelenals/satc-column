import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const TOP_TRACKS_ENDPOINT =
  'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10';

async function getAccessToken() {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN || '',
    }),
    cache: 'no-store',
  });

  return response.json();
}

export async function GET() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return NextResponse.json(
      { error: 'Credenciais do Spotify não configuradas.' },
      { status: 500 }
    );
  }

  try {
    const { access_token } = await getAccessToken();

    const res = await fetch(TOP_TRACKS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Falha ao buscar top tracks do Spotify' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const tracks = data.items || [];

    if (tracks.length === 0) {
      return NextResponse.json({ track: null });
    }

    // Sorteia 1 música aleatória do seu Top 10 da semana
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    return NextResponse.json({
      title: randomTrack.name,
      artist: randomTrack.artists.map((a: { name: string }) => a.name).join(', '),
      albumArt: randomTrack.album.images?.[0]?.url || null,
      songUrl: randomTrack.external_urls.spotify,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro interno na integração com Spotify' },
      { status: 500 }
    );
  }
}