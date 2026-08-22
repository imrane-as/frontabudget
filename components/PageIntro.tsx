import type { ReactNode } from "react";

type PageIntroTone = "mint" | "violet" | "coral" | "blue" | "sun";

export default function PageIntro({
  eyebrow,
  title,
  description,
  icon,
  aside,
  tone = "mint"
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  icon: ReactNode;
  aside?: ReactNode;
  tone?: PageIntroTone;
}) {
  return (
    <section className={`page-intro page-intro-${tone}`}>
      <span className="page-intro-blob page-intro-blob-one" aria-hidden="true" />
      <span className="page-intro-blob page-intro-blob-two" aria-hidden="true" />
      <div className="page-intro-icon" aria-hidden="true">{icon}</div>
      <div className="page-intro-copy">
        <span className="page-intro-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className="page-intro-aside">{aside}</div>}
    </section>
  );
}
