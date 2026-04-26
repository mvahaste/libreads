import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { router } from "../init";
import { AppRouter } from "./_app";
import {
  bookEditConflictsProcedure,
  bookEditOptionsProcedure,
  bookFormConflictsProcedure,
  bookFormOptionsProcedure,
  createBookProcedure,
  deleteBookProcedure,
  updateBookProcedure,
} from "./books/procedures/admin";
import {
  deleteAuthorProcedure,
  deleteGenreProcedure,
  deletePublisherProcedure,
  deleteSeriesProcedure,
  updateAuthorProcedure,
  updateGenreProcedure,
  updatePublisherProcedure,
  updateSeriesProcedure,
} from "./books/procedures/entities";
import { importBookProcedure } from "./books/procedures/import";
import {
  clearBookRatingProcedure,
  deleteReadThroughProcedure,
  getLibraryEntryStatsProcedure,
  rateBookProcedure,
  removeBookFromLibraryProcedure,
  setBookNotesProcedure,
  setBookStatusProcedure,
  setReadingProgressProcedure,
} from "./books/procedures/library";
import {
  allAuthorsProcedure,
  allBooksProcedure,
  allGenresProcedure,
  allPublishersProcedure,
  allSeriesProcedure,
  allTagsProcedure,
  bookDetailsProcedure,
  filterAuthorsProcedure,
  filterFormatsProcedure,
  filterGenresProcedure,
  filterPublishersProcedure,
  filterSeriesProcedure,
  filterStatusesProcedure,
  filterTagsProcedure,
  myBooksProcedure,
  myTagsProcedure,
  resolveFilterLabelsProcedure,
  seriesDetailsProcedure,
} from "./books/procedures/queries";
import { overallUserStatsProcedure } from "./books/procedures/statistics";
import { deleteTagProcedure, setBookTagsProcedure, updateTagProcedure } from "./books/procedures/tags";

export { paginate, parseSort } from "./books/shared";

// Export types
type RouterInput = inferRouterInputs<AppRouter>["books"];
type RouterOutput = inferRouterOutputs<AppRouter>["books"];

export type BookDetailsInput = RouterInput["bookDetails"];
export type BookDetailsOutput = RouterOutput["bookDetails"];

export type SeriesDetailsInput = RouterInput["seriesDetails"];
export type SeriesDetailsOutput = RouterOutput["seriesDetails"];

export type OverallUserStatsOutput = RouterOutput["overallUserStats"];

export const booksRouter = router({
  import: importBookProcedure,
  createBook: createBookProcedure,
  updateBook: updateBookProcedure,
  deleteBook: deleteBookProcedure,
  allBooks: allBooksProcedure,
  myBooks: myBooksProcedure,
  bookDetails: bookDetailsProcedure,
  allAuthors: allAuthorsProcedure,
  allGenres: allGenresProcedure,
  allPublishers: allPublishersProcedure,
  allSeries: allSeriesProcedure,
  updateAuthor: updateAuthorProcedure,
  deleteAuthor: deleteAuthorProcedure,
  updateSeries: updateSeriesProcedure,
  deleteSeries: deleteSeriesProcedure,
  updateGenre: updateGenreProcedure,
  deleteGenre: deleteGenreProcedure,
  updatePublisher: updatePublisherProcedure,
  deletePublisher: deletePublisherProcedure,
  allTags: allTagsProcedure,
  seriesDetails: seriesDetailsProcedure,
  filterGenres: filterGenresProcedure,
  filterAuthors: filterAuthorsProcedure,
  filterPublishers: filterPublishersProcedure,
  filterSeries: filterSeriesProcedure,
  bookFormConflicts: bookFormConflictsProcedure,
  bookFormOptions: bookFormOptionsProcedure,
  bookEditConflicts: bookEditConflictsProcedure,
  bookEditOptions: bookEditOptionsProcedure,
  filterStatuses: filterStatusesProcedure,
  filterTags: filterTagsProcedure,
  myTags: myTagsProcedure,
  updateTag: updateTagProcedure,
  deleteTag: deleteTagProcedure,
  setBookTags: setBookTagsProcedure,
  filterFormats: filterFormatsProcedure,
  resolveFilterLabels: resolveFilterLabelsProcedure,
  setBookStatus: setBookStatusProcedure,
  setReadingProgress: setReadingProgressProcedure,
  rateBook: rateBookProcedure,
  clearBookRating: clearBookRatingProcedure,
  setBookNotes: setBookNotesProcedure,
  getLibraryEntryStats: getLibraryEntryStatsProcedure,
  removeBookFromLibrary: removeBookFromLibraryProcedure,
  deleteReadThrough: deleteReadThroughProcedure,
  overallUserStats: overallUserStatsProcedure,
});
