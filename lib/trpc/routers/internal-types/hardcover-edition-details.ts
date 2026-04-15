/* eslint-disable @typescript-eslint/no-explicit-any */
export type InternalHardcoverEditionDetailsResponse = {
  data: {
    editions: Array<{
      id: number;
      title: string;
      subtitle: any;
      edition_format: string;
      audio_seconds: any;
      pages: number;
      release_date: string;
      release_year: any;
      isbn_10: string;
      isbn_13: string;
      publisher: {
        id: number;
        name: string;
      };
      contributions: Array<{
        author: {
          id: number;
          name: string;
        };
      }>;
      image: {
        url: string;
      };
      book: {
        id: number;
        title: string;
        subtitle: string;
        description: string;
        contributions: Array<{
          author: {
            id: number;
            name: string;
          };
        }>;
        taggable_counts: Array<{
          tag: {
            id: number;
            tag: string;
            tag_category_id: number;
            count: number;
          };
        }>;
        book_series: Array<{
          series_id: number;
          position: number;
          series: {
            name: string;
            description?: string;
          };
        }>;
      };
    }>;
  };
};
