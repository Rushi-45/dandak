/**
 * Structured data for search engines.
 *
 * Rule for everything emitted through here: only assert what the page actually
 * shows and the dataset actually knows. Marking up a fee we have not verified,
 * or a phone number we found on a blog, is what gets a site's rich results
 * pulled — and it would contradict the confidence labels we print on the page.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped below; </script> in a string cannot break out
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
