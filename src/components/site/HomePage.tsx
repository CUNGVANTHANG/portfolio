"use client";

import { useCallback, useState } from "react";
import { DeviceIntro } from "../intro/DeviceIntro";
import { ReadingProgress } from "../fx/ReadingProgress";
import { SmoothScroll } from "../providers/SmoothScroll";
import { About } from "../sections/About";
import { Certificates } from "../sections/Certificates";
import { Contact } from "../sections/Contact";
import { Experience } from "../sections/Experience";
import { Hero } from "../sections/Hero";
import { Projects } from "../sections/Projects";
import { Skills } from "../sections/Skills";
import { Footer } from "./Footer";
import { SectionNav } from "./SectionNav";

/** The site: intro, nav, then every section in order. */
export function HomePage() {
  const [introDone, setIntroDone] = useState(false);
  const onIntroDone = useCallback(() => setIntroDone(true), []);

  return (
    <SmoothScroll>
      {/* Plays on the first visit only (once="first-visit" is the default). */}
      <DeviceIntro onDone={onIntroDone} />
      <ReadingProgress visible={introDone} />
      <SectionNav visible={introDone} />
      <main>
        <Hero play={introDone} />
        <About />
        <Skills />
        <Experience />
        <Certificates />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
