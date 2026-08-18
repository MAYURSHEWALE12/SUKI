const Product = require('../models/Product');

const FEED_CACHE_TTL_MS = 5 * 60 * 1000;

let cache = { at: 0, xml: null };

const SITE_URL = () => process.env.SITE_URL || process.env.FRONTEND_URL || 'https://sukiethnic.com';

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsolute(src) {
  if (!src) return '';
  return src.startsWith('http') ? src : `${SITE_URL()}${src}`;
}

function formatPrice(amount) {
  return `INR ${Number(amount).toFixed(2)}`;
}

function availabilityFor(product) {
  return product.countInStock > 0 ? 'in_stock' : 'out_of_stock';
}

async function buildFeedXml() {
  const products = await Product.find({}).lean();

  const items = products.map((p) => {
    const imageLinks = [toAbsolute(p.image), toAbsolute(p.hoverImage), ...(p.images || []).map(toAbsolute)]
      .filter(Boolean);

    const salePrice = p.originalPrice && p.originalPrice > p.price
      ? `<g:sale_price>${formatPrice(p.price)}</g:sale_price>`
      : '';

    return `    <item>
      <g:id>${escapeXml(p._id.toString())}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description || p.shortDescription || p.name)}</g:description>
      <g:link>${escapeXml(`${SITE_URL()}/product/${p._id}`)}</g:link>
      <g:image_link>${escapeXml(imageLinks[0] || '')}</g:image_link>
      ${imageLinks.slice(1).map((url) => `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${availabilityFor(p)}</g:availability>
      <g:price>${formatPrice(p.price)}</g:price>
      ${salePrice}
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.brand || 'Suki Ethnic')}</g:brand>
      <g:google_product_category>Clothing &amp; Accessories</g:google_product_category>
      <g:identifier_exists>FALSE</g:identifier_exists>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Suki Ethnic Products</title>
    <link>${escapeXml(SITE_URL())}</link>
    <description>Google Shopping feed for Suki Ethnic</description>
${items.join('\n')}
  </channel>
</rss>`;
}

// @desc    Google Merchant Center product feed
// @route   GET /api/feed/products.xml
// @access  Public
exports.getProductFeed = async (req, res) => {
  try {
    if (cache.xml && Date.now() - cache.at < FEED_CACHE_TTL_MS) {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      return res.send(cache.xml);
    }

    const xml = await buildFeedXml();
    cache = { at: Date.now(), xml };

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};