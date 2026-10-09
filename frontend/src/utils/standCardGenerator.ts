import QRCode from 'qrcode';
import { VenueQrConfig, computeTableDineUrl } from './venueConfig';
import { TableResponse } from '../types/order.types';

/**
 * Generates a clean high-resolution QR code data URL (PNG) with center logo margin.
 */
export const generateQrDataUrl = async (
  text: string,
  options?: {
    size?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> => {
  const size = options?.size || 600;
  const dark = options?.darkColor || '#000000';
  const light = options?.lightColor || '#ffffff';

  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H', // Level H gives 30% error recovery for center emblem overlay
    color: {
      dark,
      light,
    },
  });
};

/**
 * Draws a rounded rectangle path onto the canvas context.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const GOOGLE_REVIEWS_URL = 'https://share.google/fpQYpNSriMbsBasZS';
export const STAND_TEMPLATE_IMAGE_URL = '/images/chai_addaa_stand_template.jpeg';

let cachedTemplateImg: HTMLImageElement | null = null;
let cachedGoogleReviewQrDataUrl: string | null = null;

/**
 * Loads the base Siliguri's Chai Addaa stand card template image into an HTMLImageElement (cached in-memory).
 */
export const loadStandTemplateImage = (): Promise<HTMLImageElement | null> => {
  if (cachedTemplateImg && cachedTemplateImg.complete && cachedTemplateImg.naturalWidth > 0) {
    return Promise.resolve(cachedTemplateImg);
  }
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedTemplateImg = img;
      resolve(img);
    };
    img.onerror = () => {
      console.warn('Failed to load stand template image from', STAND_TEMPLATE_IMAGE_URL);
      resolve(null);
    };
    img.src = STAND_TEMPLATE_IMAGE_URL;
  });
};

/**
 * Generates and caches the Google Reviews QR code data URL (constant for all tables).
 */
export const getGoogleReviewsQrDataUrl = async (size = 300): Promise<string> => {
  if (cachedGoogleReviewQrDataUrl) return cachedGoogleReviewQrDataUrl;
  const dataUrl = await generateQrDataUrl(GOOGLE_REVIEWS_URL, {
    size,
    darkColor: '#000000',
    lightColor: '#ffffff',
  });
  cachedGoogleReviewQrDataUrl = dataUrl;
  return dataUrl;
};

let cachedFaviconImg: HTMLImageElement | null = null;

/**
 * Loads the brand favicon SVG image into an HTMLImageElement for canvas rendering (cached in-memory).
 */
const loadFaviconImage = (): Promise<HTMLImageElement | null> => {
  if (cachedFaviconImg) return Promise.resolve(cachedFaviconImg);
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedFaviconImg = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = '/favicon.svg';
  });
};

/**
 * Generates an ultra high-resolution printable Table QR Stand Card rendered on an HTML5 Canvas (2048 x 3072 px).
 * Renders the authentic Siliguri's Chai Addaa vintage parchment template:
 * 1. Upper large white space: Table-specific customer dine ordering QR code (Center: 1024, 1344; Size: 1040x1040).
 * 2. Lower small white space: Constant Google Reviews QR code (Center: 842, 2582; Size: 368x368).
 * 3. Bottom footer: Seamlessly cloned parchment background with dynamic table number: SILIGURI'S CHAI ADDAA • TABLE {num}.
 */
export const getTablePermanentToken = (table: TableResponse): string => {
  return (table as any).qrToken || table.qrCodeToken || `table-${table.tableNumber}`;
};

export const generateStandCardCanvas = async (
  table: TableResponse,
  config: VenueQrConfig
): Promise<HTMLCanvasElement> => {
  // Ultra high-definition canvas (2x of 1024x1536 base template = 2048x3072 px)
  const scale = 2;
  const width = 1024 * scale;
  const height = 1536 * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize 2D canvas context');

  const tableNum = String(table.tableNumber);
  const token = getTablePermanentToken(table);
  const dineUrl = computeTableDineUrl(token, config);

  // 1. Draw Authentic Siliguri's Chai Addaa Template Background
  const templateImg = await loadStandTemplateImage();
  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, width, height);
  } else {
    // Graceful fallback if background template image is unavailable
    ctx.fillStyle = '#FAF7F2';
    roundRect(ctx, 0, 0, width, height, 48 * scale);
    ctx.fill();
    ctx.strokeStyle = '#3D1D0C';
    ctx.lineWidth = 6 * scale;
    roundRect(ctx, 16 * scale, 16 * scale, width - 32 * scale, height - 32 * scale, 40 * scale);
    ctx.stroke();
  }

  // 2. High-Resolution Table QR Code in Upper Large White Space (Menu QR)
  // Base template center: (512, 672), Size 520x520
  // Scaled 2x: Center (1024, 1344), Size 1040x1040
  const tableQrSize = 520 * scale; // 1040
  const tableQrX = 512 * scale - tableQrSize / 2; // 504
  const tableQrY = 672 * scale - tableQrSize / 2; // 824

  const tableQrDataUrl = await generateQrDataUrl(dineUrl, {
    size: tableQrSize,
    darkColor: '#000000',
    lightColor: '#FFFFFF',
  });

  const tableQrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = tableQrDataUrl;
  });

  ctx.drawImage(tableQrImg, tableQrX, tableQrY, tableQrSize, tableQrSize);

  // 3. Constant Google Reviews QR Code in Lower Small White Space
  // Base template center: (421, 1291), Size 184x184
  // Scaled 2x: Center (842, 2582), Size 368x368
  const reviewQrSize = 184 * scale; // 368
  const reviewQrX = 421 * scale - reviewQrSize / 2; // 658
  const reviewQrY = 1291 * scale - reviewQrSize / 2; // 2398

  const reviewQrDataUrl = await getGoogleReviewsQrDataUrl(reviewQrSize);
  const reviewQrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = reviewQrDataUrl;
  });

  ctx.drawImage(reviewQrImg, reviewQrX, reviewQrY, reviewQrSize, reviewQrSize);

  // 4. Dynamic Footer Table Line & Number
  // Seamlessly clone pristine parchment background texture from y=1422 to cover existing text & divider line
  if (templateImg) {
    ctx.drawImage(
      canvas,
      160 * scale,
      1422 * scale,
      704 * scale,
      26 * scale,
      160 * scale,
      1448 * scale,
      704 * scale,
      26 * scale
    );
  }

  const brandName = (config.brandName || "SILIGURI'S CHAI ADDAA").toUpperCase();
  const footerText = `${brandName}  •  TABLE ${tableNum}`;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4B2616';
  ctx.font = `bold ${18 * scale}px "Georgia", "Playfair Display", "Times New Roman", serif`;
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = `${1.5 * scale}px`;
  }

  const cx = 512 * scale; // 1024
  const cy = 1461 * scale; // 2922
  const textMetrics = ctx.measureText(footerText);
  const textWidth = textMetrics.width;
  const textStartX = cx - textWidth / 2;
  const textEndX = cx + textWidth / 2;
  const linePadding = 16 * scale;

  ctx.strokeStyle = '#4B2616';
  ctx.lineWidth = 3 * scale;

  // Left decorative divider line (x: 168 * scale to textStartX - linePadding)
  if (textStartX - linePadding > 168 * scale) {
    ctx.beginPath();
    ctx.moveTo(168 * scale, cy);
    ctx.lineTo(textStartX - linePadding, cy);
    ctx.stroke();
  }

  // Right decorative divider line (x: textEndX + linePadding to 858 * scale)
  if (858 * scale > textEndX + linePadding) {
    ctx.beginPath();
    ctx.moveTo(textEndX + linePadding, cy);
    ctx.lineTo(858 * scale, cy);
    ctx.stroke();
  }

  // Centered footer label
  ctx.fillText(footerText, cx, cy);
  ctx.restore();

  return canvas;
};

/**
 * Generates an ultra-luxurious, large Board Poster rendered on an HTML5 Canvas (1800 x 2400 px, high-res for mounting on boards or walls).
 */
export const generateBoardPosterCanvas = async (
  table: TableResponse,
  config: VenueQrConfig
): Promise<HTMLCanvasElement> => {
  const width = 1800;
  const height = 2400;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize 2D canvas context');

  const theme = config.themeStyle || 'EMERALD_GOLD';
  const tableNum = String(table.tableNumber);
  const token = getTablePermanentToken(table);
  const dineUrl = computeTableDineUrl(token, config);

  let bgGradient: CanvasGradient;
  let frameColor: string;
  let textPrimary: string;
  let textSecondary: string;
  let accentColor: string;
  let plaqueBg: string;
  let plaqueBorder: string;

  if (theme === 'ROYAL_NOIR') {
    bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#040711');
    bgGradient.addColorStop(0.5, '#0B132B');
    bgGradient.addColorStop(1, '#050914');
    frameColor = '#38BDF8';
    textPrimary = '#F8FAFC';
    textSecondary = '#94A3B8';
    accentColor = '#38BDF8';
    plaqueBg = '#0F172A';
    plaqueBorder = '#38BDF8';
  } else if (theme === 'SUNSET_AMBER') {
    bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1C0E07');
    bgGradient.addColorStop(0.5, '#35190C');
    bgGradient.addColorStop(1, '#150A04');
    frameColor = '#F97316';
    textPrimary = '#FFF7ED';
    textSecondary = '#FED7AA';
    accentColor = '#FB923C';
    plaqueBg = '#3C1D0E';
    plaqueBorder = '#F97316';
  } else if (theme === 'CYBER_NEON') {
    bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#06050C');
    bgGradient.addColorStop(0.5, '#120D25');
    bgGradient.addColorStop(1, '#06050D');
    frameColor = '#A855F7';
    textPrimary = '#FAF5FF';
    textSecondary = '#C084FC';
    accentColor = '#22C55E';
    plaqueBg = '#221540';
    plaqueBorder = '#A855F7';
  } else if (theme === 'MINIMAL_IVORY') {
    bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#FAF9F6');
    bgGradient.addColorStop(1, '#EDECE8');
    frameColor = '#18181B';
    textPrimary = '#18181B';
    textSecondary = '#52525B';
    accentColor = '#059669';
    plaqueBg = '#18181B';
    plaqueBorder = '#27272A';
  } else {
    // EMERALD_GOLD
    bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#03120D');
    bgGradient.addColorStop(0.5, '#07261C');
    bgGradient.addColorStop(1, '#041710');
    frameColor = '#D97706';
    textPrimary = '#F8FAFC';
    textSecondary = '#94A3B8';
    accentColor = '#F59E0B';
    plaqueBg = '#0B3325';
    plaqueBorder = '#F59E0B';
  }

  // Fill Background
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Border Frame
  const margin = 60;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 6;
  roundRect(ctx, margin, margin, width - margin * 2, height - margin * 2, 40);
  ctx.stroke();

  // Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 44px "Cinzel", "Playfair Display", Georgia, serif';
  ctx.fillText('✦  CHAI  •  FOOD  •  PEOPLE  •  STORIES  ✦', width / 2, 170);

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 64px "Cinzel", "Playfair Display", serif';
  ctx.fillText(config.brandName.toUpperCase(), width / 2, 250);

  ctx.fillStyle = textSecondary;
  ctx.font = 'italic 30px "Inter", sans-serif';
  ctx.fillText(config.tagline || 'Scan with Camera to Explore Menu & Order Instantly', width / 2, 305);

  // Big Table Badge
  const plaqueW = 700;
  const plaqueH = 140;
  const plaqueX = (width - plaqueW) / 2;
  const plaqueY = 360;

  ctx.fillStyle = plaqueBg;
  roundRect(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 30);
  ctx.fill();
  ctx.strokeStyle = plaqueBorder;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = theme === 'MINIMAL_IVORY' ? '#FFFFFF' : '#FEF08A';
  ctx.font = 'bold 70px "Cinzel", Georgia, serif';
  ctx.fillText(`TABLE ${tableNum}`, width / 2, plaqueY + 80);

  const zoneText = table.capacity ? `SEATS ${table.capacity} GUESTS` : 'DINE & DISPATCH';
  ctx.fillText(zoneText, width / 2, plaqueY + 120);

  // Center Big QR Container
  const qrBox = 900;
  const qrBoxX = (width - qrBox) / 2;
  const qrBoxY = 550;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, qrBoxX, qrBoxY, qrBox, qrBox, 40);
  ctx.fill();
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  const qrDataUrl = await generateQrDataUrl(dineUrl, { size: 800 });
  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  const qrDrawSize = 800;
  const qrDrawX = (width - qrDrawSize) / 2;
  const qrDrawY = qrBoxY + (qrBox - qrDrawSize) / 2;
  ctx.drawImage(qrImg, qrDrawX, qrDrawY, qrDrawSize, qrDrawSize);

  // Center Favicon Badge on QR
  const posterFaviconImg = await loadFaviconImage();
  const posterBadgeSize = 124;
  const posterBadgeX = (width - posterBadgeSize) / 2;
  const posterBadgeY = qrDrawY + (qrDrawSize - posterBadgeSize) / 2;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, posterBadgeX - 6, posterBadgeY - 6, posterBadgeSize + 12, posterBadgeSize + 12, 26);
  ctx.fill();

  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  if (posterFaviconImg) {
    ctx.drawImage(posterFaviconImg, posterBadgeX, posterBadgeY, posterBadgeSize, posterBadgeSize);
  }

  // 3-Step Instruction Cards
  const stepY = 1530;
  const stepW = 1560;
  const stepH = 220;
  const stepX = (width - stepW) / 2;

  ctx.fillStyle = theme === 'MINIMAL_IVORY' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)';
  roundRect(ctx, stepX, stepY, stepW, stepH, 30);
  ctx.fill();
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  const colW = stepW / 3;
  const stepIcons = ['📷  STEP 1', '👆  STEP 2', '🍽️  STEP 3'];
  const stepTitles = ['Open Smartphone Camera', 'Tap Browser Notification', 'Explore & Order Instantly'];
  const stepSubs = ['No special apps or signups needed', 'Opens live dining portal securely', 'Kitchen prepares & servers deliver'];

  for (let i = 0; i < 3; i++) {
    const colCenterX = stepX + colW * i + colW / 2;
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 30px "Inter", sans-serif';
    ctx.fillText(stepIcons[i], colCenterX, stepY + 60);

    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 34px "Inter", sans-serif';
    ctx.fillText(stepTitles[i], colCenterX, stepY + 115);

    ctx.fillStyle = textSecondary;
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillText(stepSubs[i], colCenterX, stepY + 165);
  }

  // Wi-Fi Banner
  let curY = 1820;
  if (config.showWifi && config.wifiSsid) {
    const wBoxW = 1200;
    const wBoxH = 100;
    const wBoxX = (width - wBoxW) / 2;
    ctx.fillStyle = theme === 'MINIMAL_IVORY' ? '#F4F4F5' : 'rgba(16, 185, 129, 0.15)';
    roundRect(ctx, wBoxX, curY, wBoxW, wBoxH, 24);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 34px "Inter", sans-serif';
    ctx.fillText(`📶 Restaurant Guest Wi-Fi:  ${config.wifiSsid}    •    Password:  ${config.wifiPassword || 'None'}`, width / 2, curY + 62);
    curY += 130;
  } else {
    curY += 40;
  }

  // Dining Guarantee
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 28px "Inter", sans-serif';
  ctx.fillText('⚡ ZERO APP INSTALLS REQUIRED   •   DIRECT LIVE KITCHEN CONNECTION   •   SPLIT BILLS & REORDERS', width / 2, curY + 50);

  ctx.fillStyle = theme === 'MINIMAL_IVORY' ? '#71717A' : '#94A3B8';
  ctx.font = '600 22px "Cinzel", "Inter", serif';
  ctx.fillText(`✦   ${config.brandName.toUpperCase()}   •   FINE DINING & BOTANICAL BAR   •   TABLE ${tableNum}   ✦`, width / 2, curY + 100);

  return canvas;
};

/**
 * Generates a Compact Square Table Sticker Canvas (1000 x 1000 px).
 * Contains ONLY the clean QR code with center favicon badge and bottom table label.
 */
export const generateTableStickerCanvas = async (
  table: TableResponse,
  config: VenueQrConfig
): Promise<HTMLCanvasElement> => {
  const size = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize 2D canvas context');

  const tableNum = String(table.tableNumber);
  const token = getTablePermanentToken(table);
  const dineUrl = computeTableDineUrl(token, config);

  // Background
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 0, 0, size, size, 48);
  ctx.fill();

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 4;
  roundRect(ctx, 2, 2, size - 4, size - 4, 46);
  ctx.stroke();

  // QR Code
  const qrSize = 750;
  const qrX = (size - qrSize) / 2;
  const qrY = 60;

  const qrDataUrl = await generateQrDataUrl(dineUrl, { size: qrSize });
  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Center Favicon Badge on Sticker QR
  const stickerFaviconImg = await loadFaviconImage();
  const stickerBadgeSize = 124;
  const stickerBadgeX = (size - stickerBadgeSize) / 2;
  const stickerBadgeY = qrY + (qrSize - stickerBadgeSize) / 2;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, stickerBadgeX - 5, stickerBadgeY - 5, stickerBadgeSize + 10, stickerBadgeSize + 10, 24);
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  roundRect(ctx, stickerBadgeX - 5, stickerBadgeY - 5, stickerBadgeSize + 10, stickerBadgeSize + 10, 24);
  ctx.stroke();

  if (stickerFaviconImg) {
    ctx.save();
    roundRect(ctx, stickerBadgeX, stickerBadgeY, stickerBadgeSize, stickerBadgeSize, 18);
    ctx.clip();
    ctx.drawImage(stickerFaviconImg, stickerBadgeX, stickerBadgeY, stickerBadgeSize, stickerBadgeSize);
    ctx.restore();
  }

  // Bottom Label: BRAND NAME • TABLE {tableNum}
  const brandName = (config.brandName || "SILIGURI'S CHAI ADDAA").toUpperCase();
  const footerText = `${brandName} • TABLE ${tableNum}`;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1E3A5F';
  ctx.font = 'bold 34px "Cinzel", "Playfair Display", Georgia, serif';
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = '2px';
  }
  ctx.fillText(footerText, size / 2, qrY + qrSize + 90);

  return canvas;
};

/**
 * Downloads a rendered HTML5 Canvas as a PNG file.
 */
export const downloadCanvasAsPng = (canvas: HTMLCanvasElement, filename: string): void => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
};

/**
 * Downloads a single table's luxury stand card PNG.
 */
export const downloadStandCard = async (table: TableResponse, config: VenueQrConfig): Promise<void> => {
  const canvas = await generateStandCardCanvas(table, config);
  const cleanBrand = (config.brandName || 'Chai_Addaa').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanBrand}_Table_${table.tableNumber}_QR.png`;
  downloadCanvasAsPng(canvas, filename);
};

/**
 * Downloads a single table's large board poster PNG.
 */
export const downloadBoardPoster = async (table: TableResponse, config: VenueQrConfig): Promise<void> => {
  const canvas = await generateBoardPosterCanvas(table, config);
  const cleanBrand = (config.brandName || 'Aura').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanBrand}_Table_${table.tableNumber}_Board_Poster.png`;
  downloadCanvasAsPng(canvas, filename);
};

/**
 * Downloads a single table's square sticker PNG.
 */
export const downloadTableSticker = async (table: TableResponse, config: VenueQrConfig): Promise<void> => {
  const canvas = await generateTableStickerCanvas(table, config);
  const cleanBrand = (config.brandName || 'Aura').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanBrand}_Table_${table.tableNumber}_Sticker.png`;
  downloadCanvasAsPng(canvas, filename);
};

/**
 * Downloads only the raw high-resolution QR code PNG (1024x1024).
 */
export const downloadQrOnly = async (table: TableResponse, config: VenueQrConfig): Promise<void> => {
  const token = getTablePermanentToken(table);
  const dineUrl = computeTableDineUrl(token, config);
  const dataUrl = await generateQrDataUrl(dineUrl, { size: 1024 });

  const cleanBrand = (config.brandName || 'Aura').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanBrand}_Table_${table.tableNumber}_QR_Raw.png`;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Downloads all stands sequentially with a slight delay so browser doesn't block multiple downloads.
 */
export const batchDownloadAllStands = async (
  tables: TableResponse[],
  config: VenueQrConfig,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    if (onProgress) onProgress(i + 1, tables.length);
    await downloadStandCard(table, config);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
};

/**
 * Downloads all board posters sequentially.
 */
export const batchDownloadAllPosters = async (
  tables: TableResponse[],
  config: VenueQrConfig,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    if (onProgress) onProgress(i + 1, tables.length);
    await downloadBoardPoster(table, config);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
};

/**
 * Downloads all table stickers sequentially.
 */
export const batchDownloadAllStickers = async (
  tables: TableResponse[],
  config: VenueQrConfig,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    if (onProgress) onProgress(i + 1, tables.length);
    await downloadTableSticker(table, config);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
};

/**
 * Downloads all raw QR codes sequentially.
 */
export const batchDownloadAllQrs = async (
  tables: TableResponse[],
  config: VenueQrConfig,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    if (onProgress) onProgress(i + 1, tables.length);
    await downloadQrOnly(table, config);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
};
