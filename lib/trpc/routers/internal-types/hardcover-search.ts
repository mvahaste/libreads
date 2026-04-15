/* eslint-disable @typescript-eslint/no-explicit-any */
export type InternalHardcoverSearchResponse = {
  data: {
    search: {
      results: {
        facet_counts: Array<any>;
        found: number;
        hits: Array<{
          document: {
            activities_count: number;
            alternative_titles: Array<string>;
            author_names: Array<string>;
            compilation: boolean;
            content_warnings: Array<string>;
            contribution_types: Array<string>;
            contributions: Array<{
              author: {
                id: number;
                image: {
                  color?: string;
                  color_name?: string;
                  height?: number;
                  id?: number;
                  url?: string;
                  width?: number;
                };
                name: string;
                slug: string;
              };
              contribution?: string;
            }>;
            cover_color?: string;
            description?: string;
            genres: Array<string>;
            has_audiobook: boolean;
            has_ebook: boolean;
            id: string;
            image: {
              color?: string;
              color_name?: string;
              height?: number;
              id?: number;
              url?: string;
              width?: number;
            };
            isbns: Array<string>;
            lists_count: number;
            moods: Array<string>;
            pages?: number;
            prompts_count: number;
            rating: number;
            ratings_count: number;
            release_date: string;
            release_year: number;
            reviews_count: number;
            series_names: Array<string>;
            slug: string;
            subtitle?: string;
            tags: Array<string>;
            title: string;
            users_count: number;
            users_read_count: number;
          };
          highlight: {
            alternative_titles: Array<{
              matched_tokens: Array<string>;
              snippet: string;
            }>;
            series_names?: Array<{
              matched_tokens: Array<string>;
              snippet: string;
            }>;
            title: {
              matched_tokens: Array<string>;
              snippet: string;
            };
          };
          highlights: Array<{
            field: string;
            matched_tokens: Array<any>;
            snippet?: string;
            indices?: Array<number>;
            snippets?: Array<string>;
          }>;
          text_match: number;
          text_match_info: {
            best_field_score: string;
            best_field_weight: number;
            fields_matched: number;
            num_tokens_dropped: number;
            score: string;
            tokens_matched: number;
            typo_prefix_score: number;
          };
        }>;
        out_of: number;
        page: number;
        request_params: {
          collection_name: string;
          first_q: string;
          per_page: number;
          q: string;
        };
        search_cutoff: boolean;
        search_time_ms: number;
      };
    };
  };
};
