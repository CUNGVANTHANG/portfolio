import raw from "@/data/portfolio.json";

/** All site content lives in src/data/portfolio.json; these types describe it. */

export type Social = { label: string; url: string };

export type ExperienceItem = {
  /** e.g. "2022 - 2024"; the first four characters are shown as the big year. */
  period: string;
  title: string;
  place: string;
  location: string;
  description: string;
  highlights: string[];
  /** Tech names, shown as logos (see techIcons.ts). */
  stack: string[];
};

export type Certificate = {
  name: string;
  issuer: string;
  /** Logo key (see techIcons.ts), e.g. "AWS", "Google Cloud", "Meta". */
  logo: string;
  year: string;
  /** Badge (square, transparent) or certificate scan; shown whole, centred. Empty = generated placeholder. */
  image: string;
};

export type Project = {
  /** Unique id (used as the React key). */
  slug: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  stack: string[];
  /** Screenshot (16:10); empty = graphite cover with the title. */
  image: string;
};

/** Labels for a grid that collapses after `limit` items ("{n}" = number hidden). */
type Collapsible = { limit: number; more: string; less: string };

export type Portfolio = {
  meta: { title: string; description: string; siteUrl: string; lang: string };
  profile: {
    name: string;
    role: string;
    /** "\n" marks the preferred line break on laptops and up. */
    tagline: string;
    avatar: string;
    email: string;
    resume: string;
    socials: Social[];
  };
  nav: { menu: string; close: string; resume: string; items: { id: string; label: string }[] };
  hero: { ctaPrimary: string; ctaSecondary: string; scrollHint: string };
  about: {
    heading: string;
    paragraphs: string[];
    education: { label: string; school: string; detail: string };
    softSkills: { label: string; items: string[] };
  };
  skills: {
    heading: string;
    intro: string;
    groups: { name: string; description: string; items: string[] }[];
  };
  experience: { heading: string; items: ExperienceItem[] };
  certificates: Collapsible & { heading: string; intro: string; view: string; close: string; items: Certificate[] };
  projects: Collapsible & { heading: string; intro: string; view: string; items: Project[] };
  contact: { heading: string; message: string; copied: string; hint: string; handsAlt: string };
};

export const data = raw as Portfolio;
