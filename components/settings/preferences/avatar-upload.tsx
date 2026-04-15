"use client";

import { useSubmitMutation } from "@/hooks/use-submit-mutation";
import { authClient } from "@/lib/auth/auth-client";
import { AVATAR } from "@/lib/constants";
import { useTRPC } from "@/lib/trpc/client";
import { getAvatarFallback } from "@/lib/utils/avatar";
import { uploadFileAsFormData, validateUploadFile } from "@/lib/utils/file-upload-client";
import { getImageUrl } from "@/lib/utils/image-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LucideCamera } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

interface AvatarUploadProps {
  name: string;
  label: string;
  description: string;
}

type AvatarUploadErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_FORM_DATA"
  | "NO_FILE_UPLOADED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED";

type AvatarUploadSuccessResponse = {
  avatarId: string;
};

function mapAvatarUploadError(code: AvatarUploadErrorCode | undefined, tErrors: ReturnType<typeof useTranslations>) {
  switch (code) {
    case "INVALID_FILE_TYPE":
      return tErrors("invalidType");
    case "FILE_TOO_LARGE":
      return tErrors("tooLarge");
    case "UNAUTHORIZED":
    case "INVALID_FORM_DATA":
    case "NO_FILE_UPLOADED":
    case "UPLOAD_FAILED":
    default:
      return tErrors("uploadFailed");
  }
}

export default function AvatarUpload({ name, label, description }: AvatarUploadProps) {
  const { data: session, refetch } = authClient.useSession();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("settings.preferences");
  const tErrors = useTranslations("errors.avatar");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const uploadAvatar = useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      uploadFileAsFormData<AvatarUploadSuccessResponse, AvatarUploadErrorCode>(`/api/users/${userId}/avatar`, file, {
        timeoutMs: 12000,
        mapError: (code) => mapAvatarUploadError(code, tErrors),
      }),
  });

  const { submit: submitAvatarUpload, isPending: isUploadingAvatar } = useSubmitMutation({
    mutation: uploadAvatar,
    defaultErrorMessage: tErrors("uploadFailed"),
    onSuccess: async () => {
      await refetch({ query: { disableCookieCache: true } });
      await queryClient.invalidateQueries({ queryKey: trpc.users.list.queryKey() });
      toast.success(t("avatarUploadSuccess"));
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message || tErrors("uploadFailed"));
      } else {
        toast.error(tErrors("uploadFailed"));
      }

      return true;
    },
  });

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!session) return;
    if (isUploadingAvatar) return;

    const file = e.target.files?.[0];

    if (!file) {
      e.target.value = "";
      return;
    }

    const validationError = validateUploadFile(file, {
      acceptedTypes: AVATAR.ACCEPTED_TYPES,
      maxSize: AVATAR.MAX_SIZE,
    });

    if (validationError) {
      toast.error(validationError === "INVALID_FILE_TYPE" ? tErrors("invalidType") : tErrors("tooLarge"));
      e.target.value = "";
      return;
    }

    void submitAvatarUpload({
      userId: session.user.id,
      file,
    });

    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <div className="group relative">
        <Avatar className="size-16">
          <AvatarImage src={getImageUrl(session?.user.avatarId)} />
          <AvatarFallback className="text-xl">{getAvatarFallback(name)}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          disabled={isUploadingAvatar}
          aria-label={label}
          className="bg-foreground/50 absolute inset-0 flex cursor-pointer items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => avatarInputRef.current?.click()}
        >
          <LucideCamera className="text-background" />
        </button>
        <input
          type="file"
          className="hidden"
          accept={AVATAR.ACCEPTED_EXTENSIONS}
          ref={avatarInputRef}
          onChange={onAvatarFileChange}
          disabled={isUploadingAvatar}
        />
      </div>
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
      </div>
    </div>
  );
}
