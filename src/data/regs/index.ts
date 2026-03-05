import sectionA from "./section-a";
import sectionB from "./section-b";
import sectionC from "./section-c";
import sectionD from "./section-d";
import sectionF from "./section-f";
import type { RegSection } from "./types";

export const allSections: RegSection[] = [sectionA, sectionB, sectionC, sectionD, sectionF];

export const sectionMap: Record<string, RegSection> = {
  A: sectionA,
  B: sectionB,
  C: sectionC,
  D: sectionD,
  F: sectionF,
};

export type { RegSection, RegArticle } from "./types";
