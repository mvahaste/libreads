import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

type ApiErrorResult<TCode extends string> = {
  ok: false;
  response: NextResponse<{ code: TCode }>;
};

type ApiSuccessResult<TValue> = {
  ok: true;
  value: TValue;
};

export type ApiResult<TValue, TCode extends string> = ApiSuccessResult<TValue> | ApiErrorResult<TCode>;

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export function apiErrorResponse<TCode extends string>(code: TCode, status: number): NextResponse<{ code: TCode }> {
  return NextResponse.json({ code }, { status });
}

export async function requireSessionOrError<TCode extends string>(
  req: NextRequest,
  unauthorizedCode: TCode,
): Promise<ApiResult<Session, TCode>> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return {
      ok: false,
      response: apiErrorResponse(unauthorizedCode, 401),
    };
  }

  return {
    ok: true,
    value: session,
  };
}

export function requireAdminOrError<TCode extends string>(
  session: Session,
  forbiddenCode: TCode,
): ApiResult<Session, TCode> {
  if (!session.user.isAdmin) {
    return {
      ok: false,
      response: apiErrorResponse(forbiddenCode, 403),
    };
  }

  return {
    ok: true,
    value: session,
  };
}

export function requireSessionUserOrError<TCode extends string>(
  session: Session,
  userId: string,
  unauthorizedCode: TCode,
): ApiResult<Session, TCode> {
  if (session.user.id !== userId) {
    return {
      ok: false,
      response: apiErrorResponse(unauthorizedCode, 401),
    };
  }

  return {
    ok: true,
    value: session,
  };
}

export async function parseFormDataOrError<TCode extends string>(
  req: NextRequest,
  invalidFormDataCode: TCode,
): Promise<ApiResult<FormData, TCode>> {
  try {
    const formData = await req.formData();

    return {
      ok: true,
      value: formData,
    };
  } catch {
    return {
      ok: false,
      response: apiErrorResponse(invalidFormDataCode, 400),
    };
  }
}

type ParseUploadOptions<TCode extends string> = {
  acceptedTypes: readonly string[];
  maxSize: number;
  noFileCode: TCode;
  invalidTypeCode: TCode;
  fileTooLargeCode: TCode;
};

export async function parseImageUploadOrError<TCode extends string>(
  formData: FormData,
  options: ParseUploadOptions<TCode>,
): Promise<ApiResult<{ mime: string; bytes: Uint8Array<ArrayBuffer> }, TCode>> {
  const { acceptedTypes, maxSize, noFileCode, invalidTypeCode, fileTooLargeCode } = options;
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      ok: false,
      response: apiErrorResponse(noFileCode, 400),
    };
  }

  if (!acceptedTypes.includes(file.type)) {
    return {
      ok: false,
      response: apiErrorResponse(invalidTypeCode, 400),
    };
  }

  if (file.size > maxSize) {
    return {
      ok: false,
      response: apiErrorResponse(fileTooLargeCode, 400),
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;

  if (bytes.length > maxSize) {
    return {
      ok: false,
      response: apiErrorResponse(fileTooLargeCode, 400),
    };
  }

  return {
    ok: true,
    value: {
      mime: file.type,
      bytes,
    },
  };
}

export function parseRequiredSearchParamOrError<TCode extends string>(
  req: NextRequest,
  key: string,
  invalidValueCode: TCode,
): ApiResult<string, TCode> {
  const value = req.nextUrl.searchParams.get(key)?.trim() ?? "";

  if (!value) {
    return {
      ok: false,
      response: apiErrorResponse(invalidValueCode, 400),
    };
  }

  return {
    ok: true,
    value,
  };
}
