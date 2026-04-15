import { getSignUpEnabled } from "@/lib/utils/server/get-sign-up-enabled";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { AUTH } from "../constants";
import { env } from "../env";
import { prisma } from "../prisma";

export const auth = betterAuth({
  secret: env.LIBREADS_AUTH_SECRET,
  baseURL: env.LIBREADS_BASE_URL,
  appName: "Libreads",
  session: {
    cookieCache: {
      enabled: true,
      maxAge: AUTH.SESSION_COOKIE_MAX_AGE,
      version: AUTH.SESSION_CACHE_VERSION,
    },
  },
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: AUTH.PASSWORD_MIN_LENGTH,
    maxPasswordLength: AUTH.PASSWORD_MAX_LENGTH,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ password, hash }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  user: {
    additionalFields: {
      avatarId: {
        type: "string",
        nullable: true,
        required: false,
        input: false,
      },
      isAdmin: {
        type: "boolean",
        nullable: false,
        required: false,
        default: false,
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const isSignUpAllowed = await getSignUpEnabled();

      if (ctx.path === "/sign-up/email" && !isSignUpAllowed) {
        throw new APIError("BAD_REQUEST", {
          code: "SIGN_UP_DISABLED",
          message: "SIGN_UP_DISABLED",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isFirstUser = (await prisma.user.count()) === 0;

          return { data: { ...user, isAdmin: isFirstUser } };
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
    cookies: {
      session_token: {
        name: AUTH.SESSION_TOKEN_COOKIE_NAME,
      },
      session_data: {
        name: AUTH.SESSION_DATA_COOKIE_NAME,
      },
    },
  },
  plugins: [nextCookies()],
});
