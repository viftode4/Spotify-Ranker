# Spotify Ranker

A web application to rank and tier Spotify albums. Built with Next.js, Tailwind CSS, Shadcn UI, Prisma ORM, and the Spotify API.

## Features

- Google authentication for users
- Search and add albums from Spotify
- Rate albums on a scale of 1-10
- View all albums in a grid layout with filtering options
- View albums organized in a tier list based on ratings
- All users have admin privileges to add/remove albums

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A PostgreSQL database (Neon recommended)
- Google OAuth credentials
- Spotify Developer API credentials

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Spotify API
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spotify-ranker.git
cd spotify-ranker
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations:
```bash
npx prisma migrate dev --name init
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Schema

The application uses the following data models:

- **User**: User accounts with Google authentication
- **Album**: Spotify albums with metadata
- **Rating**: User ratings for albums

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Prisma](https://www.prisma.io/) - ORM for database access
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Neon](https://neon.tech/) - Serverless PostgreSQL database
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Access to Spotify data

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
