import { BookFormPage } from "@/components/browse/books/book-form-page";

export default function Page() {
  return <BookFormPage mode="create" cancelHref="/browse/add-books" />;
}
