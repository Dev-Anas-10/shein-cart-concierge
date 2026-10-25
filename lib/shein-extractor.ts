import { ExtractedCartResult, GoodItem } from './types';

// Regex to extract SHEIN URL from any conversational context or share message
export const SHEIN_URL_REGEX = /(https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:shein\.com|onelink\.shein\.com)[^\s<>"')]+)/i;

export function extractSheinUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(SHEIN_URL_REGEX);
  if (match && match[1]) {
    let clean = match[1].trim();
    clean = clean.replace(/[.,;!?]+$/, '');
    return clean;
  }
  return null;
}

export interface SheinPageMetadata {
  title: string;
  description: string;
  image: string;
  shc?: string;
  groupId?: string;
  redirectUrl?: string;
  deeplink?: string;
}

// Fallback high-res, verified fashion product images (100% reliable, no 404s, CORS-friendly)
export const RELIABLE_FASHION_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80', // Two-piece knit set
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80', // Knit cardigan / sweater
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80', // Quilted handbag with chain
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80', // Elegant dress
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&auto=format&fit=crop&q=80', // Casual jacket
];

/**
 * Fetch and extract metadata from a SHEIN onelink or product link
 */
export async function scrapeSheinLinkMetadata(url: string): Promise<SheinPageMetadata> {
  const result: SheinPageMetadata = {
    title: 'SHEIN Shopping Cart Items',
    description: 'Shared items from SHEIN cart (Ready for checkout)',
    image: RELIABLE_FASHION_IMAGES[0],
  };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`Fetch returned status ${res.status} for ${url}`);
      return result;
    }

    const html = await res.text();

    // 1. Extract OpenGraph tags
    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim();
    }

    const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    if (descMatch && descMatch[1]) {
      result.description = descMatch[1].trim();
    }

    const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) {
      result.image = imgMatch[1].trim();
    }

    // 2. Extract onelink hidden inputs if present
    const urlInputMatch = html.match(/<input[^>]+id=["']url["'][^>]+value=["']([^"']+)["']/i);
    if (urlInputMatch && urlInputMatch[1]) {
      result.redirectUrl = urlInputMatch[1].replace(/&amp;/g, '&');
    }

    const deeplinkMatch = html.match(/<input[^>]+id=["']deeplink["'][^>]+value=["']([^"']+)["']/i);
    if (deeplinkMatch && deeplinkMatch[1]) {
      result.deeplink = deeplinkMatch[1];
      try {
        const decoded = decodeURIComponent(result.deeplink);
        const dataMatch = decoded.match(/data=({.*})/);
        if (dataMatch) {
          const parsed = JSON.parse(dataMatch[1]);
          if (parsed.shc) result.shc = parsed.shc;
          if (parsed.group_id) result.groupId = parsed.group_id;
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // Extract shc from URL if not yet found
    if (!result.shc) {
      const urlObj = new URL(url);
      result.shc = urlObj.searchParams.get('shc') || undefined;
    }

    // 3. If there is a redirect/jump URL, fetch it to get deeper shareInfo
    if (result.redirectUrl) {
      try {
        const jumpRes = await fetch(result.redirectUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        if (jumpRes.ok) {
          const jumpHtml = await jumpRes.text();
          const shareInfoMatch = jumpHtml.match(/var\s+shareInfo\s*=\s*({.*?});/);
          if (shareInfoMatch && shareInfoMatch[1]) {
            try {
              const info = JSON.parse(shareInfoMatch[1]);
              if (info.shareTitle) result.title = info.shareTitle;
              if (info.shareComment) result.description = info.shareComment;
              if (info.shareImg || info.img_url) result.image = info.shareImg || info.img_url;
              if (info.id) result.groupId = String(info.id);
            } catch (e) {
              // ignore json parse error
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching jump url:', err);
      }
    }
  } catch (err) {
    console.error('Failed to scrape SHEIN metadata:', err);
  }

  return result;
}

/**
 * Extracts goods from SHEIN cart link or context with reliable fallback images
 */
export async function extractSheinGoods(
  rawInput: string,
  dynamicFeePercent: number = 20,
  estimatedSubtotal?: number,
  estimatedItemsCount?: number
): Promise<ExtractedCartResult> {
  const extractedLink = extractSheinUrl(rawInput);
  if (!extractedLink) {
    throw new Error('No valid SHEIN URL found in your message. Please provide a SHEIN cart or item link.');
  }

  const meta = await scrapeSheinLinkMetadata(extractedLink);

  const subtotal = typeof estimatedSubtotal === 'number' && !isNaN(estimatedSubtotal) && estimatedSubtotal > 0
    ? Math.round(estimatedSubtotal)
    : 0;

  const count = typeof estimatedItemsCount === 'number' && !isNaN(estimatedItemsCount) && estimatedItemsCount > 0
    ? Math.round(estimatedItemsCount)
    : 1;

  // Real, genuine cart package representation based on customer's actual SHEIN link
  const cartTitle = meta.title && !meta.title.includes('I found some great items') && meta.title !== 'SHEIN Shopping Cart Items'
    ? meta.title
    : 'سلة مشتريات شي إن المجمعة (SHEIN Cart)';

  const items: GoodItem[] = [
    {
      id: `shein-cart-${Date.now()}`,
      name: cartTitle,
      image: meta.image || RELIABLE_FASHION_IMAGES[0],
      originalUrl: extractedLink,
      sku: meta.shc ? `SHC: ${meta.shc}` : (meta.groupId ? `GROUP: ${meta.groupId}` : 'SHEIN-CART'),
      color: 'حسب اختياراتك في السلة',
      size: count > 1 ? `${count} قطع مختلفة` : 'حسب اختياراتك في السلة',
      originalPrice: subtotal,
      currency: 'EGP',
      quantity: 1,
      subtotal: subtotal,
      status: 'available',
    },
  ];

  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const dynamicFeeAmount = itemsSubtotal > 0 ? Math.round(itemsSubtotal * (dynamicFeePercent / 100)) : 0;
  const totalCash = itemsSubtotal + dynamicFeeAmount;

  return {
    rawInput,
    extractedLink,
    title: cartTitle,
    description: meta.description || 'سلة مشترياتك المشتركة من تطبيق شي إن، جاهزة للتسعير والمراجعة والتوصيل.',
    coverImage: meta.image || RELIABLE_FASHION_IMAGES[0],
    shareCode: meta.shc || 'SHEIN-CART',
    groupId: meta.groupId || '',
    items,
    itemsSubtotal,
    dynamicFeePercent,
    dynamicFeeAmount,
    totalCash,
    currency: 'EGP',
  };
}
