import { BookFormPage } from "@/components/browse/books/book-form-page";
import { auth } from "@/lib/auth/auth";
import { caller } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.isAdmin) {
    redirect(`/browse/books/${slug}`);
  }

  const book = await caller.books.bookDetails({ slug }).catch((e) => {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") {
      return null;
    }

    throw e;
  });

  if (!book) {
    return notFound();
  }

  return <BookFormPage mode="edit" book={book} cancelHref={`/browse/books/${book.slug}`} />;
}
