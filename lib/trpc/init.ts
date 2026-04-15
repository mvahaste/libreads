import { TRPCError, initTRPC } from "@trpc/server";

import { auth } from "../auth/auth";

export type TRPCContext = {
  headers: Headers;
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

export async function createTRPCContext(opts: { headers: Headers }): Promise<TRPCContext> {
  const session = await auth.api.getSession({ headers: opts.headers });

  return {
    headers: opts.headers,
    session,
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware that enforces the user is authenticated.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

/**
 * Middleware that enforces the user is an admin.
 */
const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN" });
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

/** Procedure that requires authentication. */
export const protectedProcedure = t.procedure.use(enforceAuth);

/** Procedure that requires admin privileges. */
export const adminProcedure = protectedProcedure.use(enforceAdmin);
