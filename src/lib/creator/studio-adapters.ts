/*
  Server-only adapters a site provides in `src/studio.adapters.ts`. The
  shared studio calls these instead of touching site tables directly, so a
  site whose blog is `BlogPost` rows, or whose pictures live in Vercel Blob,
  plugs in without changing shared code.
*/

export interface ContentPost {
  id: string;
  title: string;
  /** Display date, already formatted ("Autumn 2023", "Nov 3, 2026") */
  date: string;
  img: string | null;
  excerpt: string;
  /** Plain-text paragraphs */
  paragraphs: string[];
  loc: string | null;
  published: boolean;
  starred: boolean;
  /** ISO, when known */
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ContentInput {
  title: string;
  excerpt: string;
  paragraphs: string[];
  img: string | null;
  loc: string | null;
  category?: string | null;
  pillarId?: string | null;
  published: boolean;
  /** Display date; the site may ignore it */
  date?: string | null;
}

export interface ContentAdapter {
  list(): Promise<ContentPost[]>;
  get(id: string): Promise<ContentPost | null>;
  /** Create a post (draft or published). Returns the new id. */
  create(input: ContentInput): Promise<{ id: string }>;
  /** Replace an existing post's fields (the generator's "Update") */
  update(id: string, input: ContentInput): Promise<void>;
  setPublished(id: string, published: boolean): Promise<void>;
  setStarred(id: string, starred: boolean): Promise<void>;
  /** Public URL of a post */
  url(id: string): string;
}

export interface SitePicture {
  /** Site path or absolute URL — the identity */
  src: string;
  label: string;
  collection: string;
  title?: string | null;
  loc?: string | null;
  blurb?: string | null;
  /** Page in a printed book, when the site has one */
  bookPage?: number | null;
}

export interface PicturesAdapter {
  /** Every picture the site owns that the studio may use (gallery, manifest…). Studio uploads are added by the shared code. */
  list(): Promise<SitePicture[]>;
  /** Patterns that mark a picture as never usable in ads/posts (mockups) */
  mockupPattern?: RegExp | null;
  /** Absolute URL for a src (defaults to site.url + src) */
  absolute?(src: string): string;
  /** Normalise a URL on this site to its src form */
  normalize?(src: string): string;
}

export interface UploadsAdapter {
  /** Store an image and return a public URL the site and Meta can fetch */
  upload(file: File): Promise<{ url: string }>;
}

export interface SubscribersAdapter {
  count(): Promise<number | null>;
  recent?(limit: number): Promise<Array<{ email: string; createdAt: string }>>;
}

export interface AuthAdapter {
  getSession(): Promise<{ email: string } | null>;
  /** Form action that signs out */
  logoutPath: string;
}

export interface StudioAdapters {
  content: ContentAdapter;
  pictures: PicturesAdapter;
  uploads: UploadsAdapter;
  subscribers: SubscribersAdapter;
  auth: AuthAdapter;
}
