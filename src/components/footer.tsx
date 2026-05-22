import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="footer__logo"
            src="/assets/logo-script.png"
            alt="Robert Castellino Photography"
          />
          <span className="footer__line">
            A working studio in Boulder, Colorado — est. 1989. Commissions, prints, and licensing inquiries welcome.
          </span>
        </div>
        <ul className="footer__nav">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/gallery">Gallery</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/book">The Book</Link></li>
        </ul>
        <ul className="footer__contact">
          <li><span>Studio</span>1314 Pearl St, Boulder · CO 80302</li>
          <li><span>Email</span>studio@robertcastellino.com</li>
          <li><span>Phone</span>+1 303 555 0142</li>
        </ul>
      </div>
      <div className="footer__bot">
        <span>© {new Date().getFullYear()} Robert Castellino. All photographs and likeness reserved.</span>
        <span className="footer__set">Set in Cormorant Garamond &amp; Manrope.</span>
      </div>
    </footer>
  );
}
