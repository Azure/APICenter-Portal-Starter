import React, { useEffect } from 'react';
import DotGridCanvas from './DotGridCanvas';
import styles from './HeroBanner.module.scss';

/**
 * Homepage hero banner background — a customizable "slot".
 *
 * This is the main rebrand surface for self-hosted portals:
 *  - By default it renders the animated dot-grid (CoreAI design-system study)
 *    on a transparent background, so it blends seamlessly into the page in both
 *    light and dark themes.
 *  - If `bannerImage` is provided (via config.json `hero.bannerImage`), that
 *    image fills the slot instead — this is how a customer like EY swaps in
 *    their own branded banner WITHOUT editing any component code.
 *
 * Everything is driven by props (fed from config.json in Home.tsx), so the
 * banner is fully customizable from a single settings file.
 */

interface HeroBannerProps {
  /** Custom banner image URL/path. When set, replaces the default dot-grid. */
  bannerImage?: string;
  /** Accent color for the default dot-grid (hex). */
  accentColor?: string;
  /**
   * Optional solid banner background (hex). When set, the dots sit on this color
   * and the hero text auto-switches to dark/light for contrast. When omitted,
   * the banner is transparent and blends seamlessly into the page.
   */
  backgroundColor?: string;
  /** Hero text color to use with a custom banner image (default white). */
  textColor?: string;
}

const DEFAULT_DOT_COLOR = '#a78bfa';
const DARK_TEXT = '#1b1640';
const LIGHT_TEXT = '#ffffff';

/** True when a hex color is light enough to need dark text on top. */
function isLightColor(hex: string): boolean {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ bannerImage, accentColor, backgroundColor, textColor }) => {
  // Decide the hero title color:
  //  - custom image: default light (most banners are dark) unless overridden
  //  - solid backgroundColor: auto dark/light from its luminance
  //  - transparent default: leave unset so the hero inherits the app theme color
  useEffect(() => {
    const root = document.documentElement;
    let color: string | null = null;
    if (bannerImage) color = textColor ?? LIGHT_TEXT;
    else if (backgroundColor) color = isLightColor(backgroundColor) ? DARK_TEXT : LIGHT_TEXT;
    if (color) root.style.setProperty('--hero-text-color', color);
    else root.style.removeProperty('--hero-text-color');
    return () => {
      root.style.removeProperty('--hero-text-color');
    };
  }, [bannerImage, backgroundColor, textColor]);

  if (bannerImage) {
    return <div className={styles.imageLayer} style={{ backgroundImage: `url("${bannerImage}")` }} aria-hidden />;
  }

  return (
    <>
      {backgroundColor && <div className={styles.colorLayer} style={{ background: backgroundColor }} aria-hidden />}
      <div className={styles.waveLayer} aria-hidden>
        <DotGridCanvas color={accentColor || DEFAULT_DOT_COLOR} />
      </div>
    </>
  );
};

export default React.memo(HeroBanner);
