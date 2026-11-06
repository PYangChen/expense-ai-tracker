import { initialOf, personColor } from "@/lib/people";

export default function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.5, background: personColor(name) }}
    >
      {initialOf(name)}
    </span>
  );
}
