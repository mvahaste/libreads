import { TRPCError, initTRPC } from "@trpc/server";

import { auth } from "../auth/auth";
import { env } from "../env";

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

const enforceWriteable = t.middleware(({ type, next }) => {
  if (type === "mutation" && env.LIBREADS_READ_ONLY_MODE) {
    throw new TRPCError({
      code: "METHOD_NOT_SUPPORTED",
      message: "The application is in read-only mode. Mutations are disabled.",
    });
  }
  return next();
});

export const publicProcedure = t.procedure.use(enforceWriteable);

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

export const protectedProcedure = publicProcedure.use(enforceAuth);

export const adminProcedure = protectedProcedure.use(enforceAdmin);
