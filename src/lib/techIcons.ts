import {
  siDocker,
  siHtml5,
  siOpengl,
  siSocketdotio,
  siStorybook,
  siStripe,
  siWordpress,
  siExpo,
  siFastapi,
  siFlutter,
  siGooglecloud,
  siGraphql,
  siHuggingface,
  siJavascript,
  siKotlin,
  siKubernetes,
  siLangchain,
  siOllama,
  siPython,
  siPytorch,
  siRedux,
  siSwift,
  siTensorflow,
  siTerraform,
  siVite,
  siVuedotjs,
  siFigma,
  siGit,
  siGithubactions,
  siGsap,
  siJira,
  siLinux,
  siMongodb,
  siNestjs,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siNotion,
  siPostgresql,
  siPostman,
  siPrisma,
  siReact,
  siRedis,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVercel,
  siCoursera,
  siGithub,
  siFreecodecamp,
  siHashicorp,
  siLinuxfoundation,
  siMeta,
  siUdemy,
  type SimpleIcon,
} from "simple-icons";

export type TechIcon =
  | { kind: "svg"; name: string; path: string; color: string }
  | { kind: "text"; name: string; label: string; color: string };

/**
 * Tech name (as written in portfolio.json) → Simple Icons logo.
 * To add a technology: import its `si…` icon above and map the name here.
 * Browse names at https://simpleicons.org.
 */
const ICONS: Record<string, SimpleIcon> = {
  React: siReact,
  "Next.js": siNextdotjs,
  TypeScript: siTypescript,
  "Tailwind CSS": siTailwindcss,
  "three.js": siThreedotjs,
  GSAP: siGsap,
  "Node.js": siNodedotjs,
  NestJS: siNestjs,
  PostgreSQL: siPostgresql,
  MongoDB: siMongodb,
  Redis: siRedis,
  Prisma: siPrisma,
  Docker: siDocker,
  Vercel: siVercel,
  "GitHub Actions": siGithubactions,
  Nginx: siNginx,
  Linux: siLinux,
  Git: siGit,
  Figma: siFigma,
  Postman: siPostman,
  Jira: siJira,
  Notion: siNotion,
  JavaScript: siJavascript,
  Vue: siVuedotjs,
  Redux: siRedux,
  Vite: siVite,
  FastAPI: siFastapi,
  GraphQL: siGraphql,
  "React Native": siReact,
  Flutter: siFlutter,
  Expo: siExpo,
  Swift: siSwift,
  Kotlin: siKotlin,
  Python: siPython,
  PyTorch: siPytorch,
  TensorFlow: siTensorflow,
  "Hugging Face": siHuggingface,
  LangChain: siLangchain,
  Ollama: siOllama,
  Kubernetes: siKubernetes,
  "Google Cloud": siGooglecloud,
  Terraform: siTerraform,
  Stripe: siStripe,
  "Socket.io": siSocketdotio,
  GLSL: siOpengl,
  Storybook: siStorybook,
  WordPress: siWordpress,
  "HTML/CSS": siHtml5,
  // Certificate issuers
  GitHub: siGithub,
  Meta: siMeta,
  "The Linux Foundation": siLinuxfoundation,
  HashiCorp: siHashicorp,
  Coursera: siCoursera,
  freeCodeCamp: siFreecodecamp,
  Udemy: siUdemy,
};

/** Brands whose logos were removed from Simple Icons — shown as a short monogram. */
const MONOGRAMS: Record<string, { label: string; color: string }> = {
  AWS: { label: "AWS", color: "#FF9900" },
  "VS Code": { label: "VS", color: "#3B9BEF" },
};

/** Near-black brand colors vanish on the graphite background; light them up instead. */
function visible(hex: string) {
  const n = parseInt(hex, 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum < 70 ? "#ffffff" : `#${hex}`;
}

export function getTechIcon(name: string): TechIcon {
  const icon = ICONS[name];
  if (icon) return { kind: "svg", name, path: icon.path, color: visible(icon.hex) };
  const mono = MONOGRAMS[name];
  const label = mono?.label ?? name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  return { kind: "text", name, label, color: mono?.color ?? "#ffffff" };
}
