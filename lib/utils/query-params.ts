type ParamType = "string" | "number";

interface ParamConfig {
  type: ParamType;
  required?: boolean;
  default?: string | number;
  /** Optional custom validation function, done before normalization */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate?: (value: any) => boolean;
  /** Optional normalization function, done after validation */
  normalize?: (value: string) => string;
}

type Schema = Record<string, ParamConfig>;

export function parseQueryParams(searchParams: URLSearchParams, schema: Schema) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};

  for (const key in schema) {
    const config = schema[key];
    const rawValue = searchParams.get(key);

    if (!rawValue) {
      if (config.required) {
        throw new Error(`Missing query parameter '${key}'`);
      }

      if (config.default !== undefined) {
        result[key] = config.default;
        continue;
      }

      result[key] = undefined;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = rawValue;

    switch (config.type) {
      case "number": {
        const parsed = parseInt(rawValue, 10);

        if (isNaN(parsed)) {
          throw new Error(`Invalid '${key}' parameter`);
        }

        if (config.validate && !config.validate(parsed)) {
          throw new Error(`Invalid '${key}' parameter`);
        }

        value = parsed;
        break;
      }
      case "string":
      default:
        break;
    }

    if (config.normalize) {
      value = config.normalize(value);
    }

    result[key] = value;
  }

  return result;
}
