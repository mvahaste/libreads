# Libreads

A self-hosted reading tracker.

## Deployment

Docker compose:

```yaml
services:
  libreads:
    image: ghcr.io/mvahaste/libreads:latest
    container_name: libreads
    user: 1000:1000
    environment:
      - LIBREADS_BASE_URL=<your-base-url> # e.g. https://libreads.example.com
      - LIBREADS_AUTH_SECRET=<your-auth-secret> # Generate via `openssl rand -base64 32`
    ports:
      - 3000:3000
    volumes:
      - <persistent-data-location>:/data # e.g. ./libreads/data:/data
    restart: unless-stopped
```

Environment variables:

```env
# The base URL for the application, it must match the URL used to access the app in the browser.
# Needs to use HTTPS for ISBN scanning to work (required for camera access).
LIBREADS_BASE_URL=https://localhost:3000

# Where to store the SQLite database and images.
# SQLite database will be at `${LIBREADS_DATA_LOCATION}/libreads.db`
LIBREADS_DATA_LOCATION="./.libreads/node"

# Generate via `openssl rand -base64 32`.
# Defaults to a random value on startup if not set.
LIBREADS_AUTH_SECRET=

# If you want to use the Hardcover API to import book data, you need to set this variable to a valid API token (without `Bearer `).
# You can obtain your API token at https://hardcover.app/account/api. Keep in mind that it expires after a year.
# Hardcover has a rate limit of 60 requests per minute.
HARDCOVER_API_TOKEN=

# If your resources permit, you can enable a simple in-memory cache for external API responses (e.g. Hardcover) to reduce the number of requests made to their API if there happen to be repeated requests for the same data.
# You can set the max number of cached responses and the TTL (time-to-live) for each cached response in milliseconds.
# To disable caching, set both variables to 0.
# Defaults to caching up to 100 responses for 1 hour (3600000 milliseconds) if not set.
LIBREADS_EXTERNAL_API_CACHE_MAX=100
LIBREADS_EXTERNAL_API_CACHE_TTL=3600000
```

## Development

1. Copy `example.env` to `.env` and fill in the required environment variables.
2. Install required dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open [https://localhost:3000](https://localhost:3000) in your browser.

## Stack

- [Next.js](https://nextjs.org/) - Meta-framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide Icons](https://lucide.dev/) - Icon library
- [shadcn/ui](https://ui.shadcn.com/) - Base UI components
- [next-intl](https://next-intl.dev/docs/) - Internationalization library
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [tRPC](https://trpc.io/) - Typesafe API layer
- [Prisma](https://www.prisma.io/) - ORM
- [SQLite](https://www.sqlite.org/index.html) - Database
- [Docker](https://www.docker.com/) - Containerization and deployment
