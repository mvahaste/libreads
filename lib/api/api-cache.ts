import { LRUCache } from "lru-cache";

import { env } from "../env";

export const externalAPICache =
  env.LIBREADS_EXTERNAL_API_CACHE_MAX > 0 && env.LIBREADS_EXTERNAL_API_CACHE_TTL > 0
    ? new LRUCache({
        max: env.LIBREADS_EXTERNAL_API_CACHE_MAX,
        ttl: env.LIBREADS_EXTERNAL_API_CACHE_TTL,
      })
    : null;
