import type { LegalDoc } from '~/content/legal';
import { ui } from '~/content/ui';
import { formatDate, useLang } from '~/i18n';
import { SITE } from '~/site';

/** Long-form page (privacy, terms, support) rendered from structured content. */
export function LegalPage({ doc, showUpdated = true }: { doc: LegalDoc; showUpdated?: boolean }) {
  const lang = useLang();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-8">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{doc.title}</h1>
      {showUpdated && (
        <p className="mt-3 text-sm text-muted-foreground">
          {ui[lang].legal.updated} {formatDate(SITE.legalUpdated, lang)}
        </p>
      )}
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{doc.intro}</p>
      <div className="mt-10 flex flex-col gap-9">
        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">{section.heading}</h2>
            {section.blocks.map((block, index) =>
              typeof block === 'string' ? (
                <p key={index} className="leading-relaxed">
                  {block}
                </p>
              ) : (
                <ul key={index} className="flex list-disc flex-col gap-2 pl-5 leading-relaxed marker:text-primary">
                  {block.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
