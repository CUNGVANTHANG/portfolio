import { data } from "@/lib/data";

/** Footer: just the copyright line, centred. */
export function Footer() {
  return (
    <footer className="px-5 py-10 text-center text-sm text-fg-3 sm:px-8">
      © {new Date().getFullYear()} {data.profile.name}
    </footer>
  );
}
