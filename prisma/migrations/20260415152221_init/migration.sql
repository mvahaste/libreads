-- CreateTable
CREATE TABLE "book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hardcoverId" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "isbn10" TEXT,
    "isbn13" TEXT,
    "publisherId" TEXT,
    "publishYear" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'PHYSICAL',
    "format" TEXT,
    "pageCount" INTEGER,
    "audioSeconds" INTEGER,
    "coverId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "book_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "publisher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "book_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hardcoverId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "book_series" (
    "bookId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "position" REAL,

    PRIMARY KEY ("bookId", "seriesId"),
    CONSTRAINT "book_series_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "book_series_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hardcoverId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "book_author" (
    "bookId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    PRIMARY KEY ("bookId", "authorId"),
    CONSTRAINT "book_author_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "book_author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "author" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "genre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hardcoverId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "book_genre" (
    "bookId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    PRIMARY KEY ("bookId", "genreId"),
    CONSTRAINT "book_genre_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "book_genre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genre" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "publisher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hardcoverId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" TEXT,
    "wantsToRead" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_book_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "read_through" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userBookId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "read_through_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "user_book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tag_book" (
    "tagId" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tagId", "userBookId"),
    CONSTRAINT "tag_book_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tag_book_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "user_book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mime" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarId" TEXT,
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "target" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reading_goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "book_hardcoverId_key" ON "book"("hardcoverId");

-- CreateIndex
CREATE UNIQUE INDEX "book_slug_key" ON "book"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "book_isbn10_key" ON "book"("isbn10");

-- CreateIndex
CREATE UNIQUE INDEX "book_isbn13_key" ON "book"("isbn13");

-- CreateIndex
CREATE INDEX "book_publisherId_idx" ON "book"("publisherId");

-- CreateIndex
CREATE INDEX "book_coverId_idx" ON "book"("coverId");

-- CreateIndex
CREATE UNIQUE INDEX "series_hardcoverId_key" ON "series"("hardcoverId");

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "series_name_key" ON "series"("name");

-- CreateIndex
CREATE INDEX "book_series_seriesId_idx" ON "book_series"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "author_hardcoverId_key" ON "author"("hardcoverId");

-- CreateIndex
CREATE UNIQUE INDEX "author_slug_key" ON "author"("slug");

-- CreateIndex
CREATE INDEX "book_author_authorId_idx" ON "book_author"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "genre_hardcoverId_key" ON "genre"("hardcoverId");

-- CreateIndex
CREATE UNIQUE INDEX "genre_slug_key" ON "genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "genre_name_key" ON "genre"("name");

-- CreateIndex
CREATE INDEX "book_genre_genreId_idx" ON "book_genre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_hardcoverId_key" ON "publisher"("hardcoverId");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_slug_key" ON "publisher"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_name_key" ON "publisher"("name");

-- CreateIndex
CREATE INDEX "user_book_bookId_idx" ON "user_book"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "user_book_userId_bookId_key" ON "user_book"("userId", "bookId");

-- CreateIndex
CREATE INDEX "read_through_userBookId_idx" ON "read_through"("userBookId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_userId_name_key" ON "tag"("userId", "name");

-- CreateIndex
CREATE INDEX "tag_book_userBookId_idx" ON "tag_book"("userBookId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reading_goal_userId_year_key" ON "reading_goal"("userId", "year");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
