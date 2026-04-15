/* eslint-disable @typescript-eslint/no-explicit-any */
export type InternalHardcoverWorkEditionsResponse = {
  data: {
    editions: Array<{
      id: number;
      title: string;
      subtitle: any;
      edition_format?: string;
      audio_seconds?: number;
      pages?: number;
      release_date?: string;
      release_year: any;
      isbn_10?: string;
      isbn_13?: string;
      publisher?: {
        id: number;
        name: string;
      };
      contributions: Array<{
        author: {
          id: number;
          name: string;
        };
      }>;
      image?: {
        url: string;
      };
      book: {
        id: number;
      };
    }>;
  };
};
