type Props = {
  img: string;
  alt: string;
  index: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
};

export function PageHero({ img, alt, index, title, sub }: Props) {
  return (
    <div className="page-hero">
      <div className="page-hero__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={alt} />
        <div className="page-hero__grade" />
        <div className="page-hero__vignette" />
        <div className="page-hero__fade" />
      </div>
      <div className="page-hero__chrome">
        <span className="page-hero__index">{index}</span>
        <h1 className="page-hero__title">{title}</h1>
        {sub && <p className="page-hero__sub">{sub}</p>}
      </div>
    </div>
  );
}
