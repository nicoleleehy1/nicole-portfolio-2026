// A picture with optional light and dark versions. Both are rendered and CSS shows the one
// matching <html data-theme>, so the theme toggle swaps them without a flash.
type Props = { src: string; light?: string; alt?: string; loading?: "lazy" | "eager" };

export function ThemedImage({ src, light, alt = "", loading = "lazy" }: Props) {
  if (!light) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={loading} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={loading} className="theme-dark-only" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt={alt} loading={loading} className="theme-light-only" />
    </>
  );
}
