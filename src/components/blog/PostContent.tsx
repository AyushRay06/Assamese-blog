import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/languages";

interface PostContentProps {
  contentHtml: string;
  language: LanguageCode;
}

export function PostContent({ contentHtml, language }: PostContentProps) {
  const isAssamese = language === "AS";
  const langConfig = SUPPORTED_LANGUAGES[language];

  return (
    <div
      lang={langConfig.langAttr}
      className={`prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:underline-offset-4 prose-img:rounded-xl prose-img:border prose-img:border-border/60 prose-img:shadow-xs prose-img:mx-auto prose-img:my-8 ${
        isAssamese
          ? "font-assamese prose-p:leading-loose prose-headings:leading-normal text-lg"
          : "font-sans prose-p:leading-relaxed text-base sm:text-lg"
      }`}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
