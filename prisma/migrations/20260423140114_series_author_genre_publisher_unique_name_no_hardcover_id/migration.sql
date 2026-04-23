/*
  Warnings:

  - You are about to drop the column `hardcoverId` on the `author` table. All the data in the column will be lost.
  - You are about to drop the column `hardcoverId` on the `genre` table. All the data in the column will be lost.
  - You are about to drop the column `hardcoverId` on the `publisher` table. All the data in the column will be lost.
  - You are about to drop the column `hardcoverId` on the `series` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_author" ("createdAt", "id", "name", "slug", "updatedAt") SELECT "createdAt", "id", "name", "slug", "updatedAt" FROM "author";
DROP TABLE "author";
ALTER TABLE "new_author" RENAME TO "author";
CREATE UNIQUE INDEX "author_slug_key" ON "author"("slug");
CREATE UNIQUE INDEX "author_name_key" ON "author"("name");
CREATE TABLE "new_genre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_genre" ("createdAt", "id", "name", "slug", "updatedAt") SELECT "createdAt", "id", "name", "slug", "updatedAt" FROM "genre";
DROP TABLE "genre";
ALTER TABLE "new_genre" RENAME TO "genre";
CREATE UNIQUE INDEX "genre_slug_key" ON "genre"("slug");
CREATE UNIQUE INDEX "genre_name_key" ON "genre"("name");
CREATE TABLE "new_publisher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_publisher" ("createdAt", "id", "name", "slug", "updatedAt") SELECT "createdAt", "id", "name", "slug", "updatedAt" FROM "publisher";
DROP TABLE "publisher";
ALTER TABLE "new_publisher" RENAME TO "publisher";
CREATE UNIQUE INDEX "publisher_slug_key" ON "publisher"("slug");
CREATE UNIQUE INDEX "publisher_name_key" ON "publisher"("name");
CREATE TABLE "new_series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_series" ("createdAt", "description", "id", "name", "slug", "updatedAt") SELECT "createdAt", "description", "id", "name", "slug", "updatedAt" FROM "series";
DROP TABLE "series";
ALTER TABLE "new_series" RENAME TO "series";
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");
CREATE UNIQUE INDEX "series_name_key" ON "series"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
