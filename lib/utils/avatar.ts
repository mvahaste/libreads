export function getAvatarFallback(name: string | undefined) {
  if (!name || name.trim() === "") return "U";

  const names = name.split(" ");

  const initials = names
    .map((namePart) => namePart[0])
    .join("")
    .toUpperCase();

  return initials.substring(0, 2);
}
