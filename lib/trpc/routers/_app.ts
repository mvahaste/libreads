import type { inferRouterOutputs } from "@trpc/server";

import { router } from "../init";
import { booksRouter } from "./books";
import { hardcoverRouter } from "./hardcover";
import { usersRouter } from "./users";

export const appRouter = router({
  users: usersRouter,
  hardcover: hardcoverRouter,
  books: booksRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
