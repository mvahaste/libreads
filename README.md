# Libreads

A self-hosted reading tracker.

## Demo

See the public read-only demo at [libdemo.mvahaste.dev](https://libdemo.mvahaste.dev).

| Email                 | Password     |
| --------------------- | ------------ |
| `admin@libdemo.local` | `adminadmin` |
| `user@libdemo.local`  | `useruser`   |

## Features

- Track reading status with progress, ratings, and dates
- Browse, search, and filter your book collection
- Organize books by authors, series, publishers, genres, and tags
- View your reading statistics
- Manual book and related entity creation
- Search-based or ISBN barcode scanning import (requires Hardcover API key)
- Multi-user support
- Light and dark mode
- Support for English and Estonian

## Screenshots

| Dashboard                        | Browse Books                           | Book Details                                   |
| -------------------------------- | -------------------------------------- | ---------------------------------------------- |
| ![Dashboard](docs/dashboard.png) | ![Browse Books](docs/browse-books.png) | ![Book Details](docs/browse-books-details.png) |

| Books / Search                                  | Books / Filter                                   | Books / Edit                                        |
| ----------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| ![Books / Search](docs/browse-books-search.png) | ![Books / Filter](docs/browse-books-filters.png) | ![Books / Edit](docs/browse-books-details-edit.png) |

| Books / Add                               | Books / Add / Manual                                      | My Books                              |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------- |
| ![Books / Add](docs/browse-add-books.png) | ![Books / Add / Manual](docs/browse-add-books-manual.png) | ![My Books](docs/browse-my-books.png) |

| Authors                             | Series                            | Publishers                                |
| ----------------------------------- | --------------------------------- | ----------------------------------------- |
| ![Authors](docs/browse-authors.png) | ![Series](docs/browse-series.png) | ![Publishers](docs/browse-publishers.png) |

| Genres                            | Tags                          | Statistics                         |
| --------------------------------- | ----------------------------- | ---------------------------------- |
| ![Genres](docs/browse-genres.png) | ![Tags](docs/browse-tags.png) | ![Statistics](docs/statistics.png) |

| Settings / Preferences                                   | Settings / Security                                | Settings / Users                             |
| -------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| ![Settings / Preferences](docs/settings-preferences.png) | ![Settings / Security](docs/settings-security.png) | ![Settings / Users](docs/settings-users.png) |

| Settings / System                              | Settings / Danger Zone                                   |     |
| ---------------------------------------------- | -------------------------------------------------------- | --- |
| ![Settings / System](docs/settings-system.png) | ![Settings / Danger Zone](docs/settings-danger-zone.png) |     |

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
LIBREADS_HARDCOVER_API_TOKEN=

# If your resources permit, you can enable a simple in-memory cache for external API responses (e.g. Hardcover) to reduce the number of requests made to their API if there happen to be repeated requests for the same data.
# You can set the max number of cached responses and the TTL (time-to-live) for each cached response in milliseconds.
# To disable caching, set both variables to 0.
# Defaults to caching up to 100 responses for 1 hour (3600000 milliseconds) if not set.
LIBREADS_EXTERNAL_API_CACHE_MAX=100
LIBREADS_EXTERNAL_API_CACHE_TTL=3600000

# Disables all mutations (create, update, delete).
# Mutations will just throw errors instead. Not really useful, just for creating a public read-only instance for demos.
# Defaults to false if not set.
LIBREADS_READ_ONLY_MODE=false
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
