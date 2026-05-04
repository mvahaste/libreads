import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { AUTH } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { mapUniqueConstraintError } from "@/lib/trpc/error-mappers";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import z from "zod/v4";

import { adminProcedure, protectedProcedure, router } from "../init";
import { withProcedureErrorHandling } from "./shared";

export const usersRouter = router({
  /**
   * List all users. Admin only.
   */
  list: adminProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatarId: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarId: user.avatarId,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    }));
  }),

  /**
   * Create a new user. Admin only.
   */
  create: adminProcedure.input(createUserSchema).mutation(async ({ input }) => {
    const { email, name, password } = input;

    await withProcedureErrorHandling(
      async () => {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              name,
            },
          });

          await tx.account.create({
            data: {
              providerId: "credential",
              userId: user.id,
              accountId: user.id,
              password: await bcrypt.hash(password, 10),
            },
          });
        });
      },
      {
        mapError: (error) => {
          if (!(error instanceof PrismaClientKnownRequestError) || error.code !== "P2002") {
            return null;
          }

          return mapUniqueConstraintError(error, {
            email: "EMAIL_ALREADY_IN_USE",
          });
        },
      },
    );

    return { message: "USER_CREATED" };
  }),

  /**
   * Update user profile. User can only update their own profile.
   */
  update: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        data: updateUserSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
      }

      const { name, email } = input.data;

      const userData: Record<string, string> = {};
      if (name !== undefined) userData.name = name;
      if (email !== undefined) userData.email = email;

      if (Object.keys(userData).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NO_FIELDS_TO_UPDATE" });
      }

      return withProcedureErrorHandling(
        async () => {
          const updatedUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
              where: { id: ctx.session.user.id },
              data: userData,
              select: { id: true, name: true, email: true },
            });

            return user;
          });

          return updatedUser;
        },
        {
          mapError: (error) => {
            if (!(error instanceof PrismaClientKnownRequestError) || error.code !== "P2002") {
              return null;
            }

            return mapUniqueConstraintError(error, {
              email: "EMAIL_ALREADY_IN_USE",
            });
          },
        },
      );
    }),

  /**
   * Delete a user. Users can delete themselves (requires password), admins can delete anyone.
   */
  delete: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, password } = input;

      const isSelf = ctx.session.user.id === userId;
      const isAdmin = !!ctx.session.user.isAdmin;

      // Only the user themselves or an admin can delete an account
      if (!isSelf && !isAdmin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
      }

      // Prevent deleting the only admin user if there are normal users
      const targetIsAdmin = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (targetIsAdmin?.isAdmin) {
        const userCount = await prisma.user.count();
        const adminCount = await prisma.user.count({
          where: {
            isAdmin: true,
          },
        });

        if (userCount > 1 && adminCount == 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CANNOT_DELETE_LAST_ADMIN" });
        }
      }

      // Self-deletion requires password verification
      if (isSelf) {
        if (!password) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "PASSWORD_REQUIRED" });
        }

        const { status } = await (
          await import("@/lib/auth/auth")
        ).auth.api
          .verifyPassword({
            body: { password },
            headers: ctx.headers,
          })
          .catch(() => ({ status: false }));

        if (!status) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "INVALID_PASSWORD" });
        }
      }

      // Delete all data, ensure no leftovers
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { avatarId: true, email: true },
        });

        await tx.user.delete({ where: { id: userId } });

        if (user?.avatarId) {
          const avatar = await tx.image.findUnique({ where: { id: user.avatarId } });

          if (avatar) {
            await tx.image.delete({ where: { id: user.avatarId } }).catch(() => {});
          }
        }

        if (user?.email) {
          const verifications = await tx.verification.findMany({ where: { identifier: user.email } });

          await Promise.all(
            verifications.map((verification) =>
              tx.verification.delete({ where: { id: verification.id } }).catch(() => {}),
            ),
          );
        }
      });

      // 'Sign out' by clearing cookies instead of using authClient.signOut()
      if (isSelf) {
        const cookieStore = await cookies();

        const sessionCookies = cookieStore
          .getAll()
          .filter(
            (cookie) =>
              cookie.name.includes(AUTH.SESSION_TOKEN_COOKIE_NAME) ||
              cookie.name.includes(AUTH.SESSION_DATA_COOKIE_NAME),
          );

        for (const cookie of sessionCookies) {
          cookieStore.set(cookie.name, "", {
            path: "/",
            maxAge: 0,
            secure: true,
          });
        }
      }

      return null;
    }),
});
