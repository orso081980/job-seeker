const STACK_SIGNATURES = [
  { name: "WordPress", test: (html) => /wp-content|wp-includes|wp-json/i.test(html) },
  { name: "WooCommerce", test: (html) => /woocommerce/i.test(html) },
  {
    name: "Shopify",
    test: (html, headers) => /cdn\.shopify\.com|Shopify\.theme/i.test(html) || headers.has("x-shopid"),
  },
  { name: "Wix", test: (html) => /static\.wixstatic\.com|wix\.com/i.test(html) },
  { name: "Squarespace", test: (html) => /squarespace\.com|static1\.squarespace\.com/i.test(html) },
  { name: "Webflow", test: (html) => /webflow\.com|js\.webflow\.com/i.test(html) },
  { name: "Next.js", test: (html) => /__NEXT_DATA__|\/_next\/static/i.test(html) },
  { name: "Nuxt", test: (html) => /__NUXT__|\/_nuxt\//i.test(html) },
  { name: "Gatsby", test: (html) => /window\.___gatsby|\/page-data\//i.test(html) },
  { name: "React", test: (html) => /data-reactroot|react-dom/i.test(html) },
  { name: "Vue.js", test: (html) => /data-v-|__vue__|vue(\.runtime)?\.js/i.test(html) },
  { name: "Angular", test: (html) => /ng-version/i.test(html) },
  { name: "jQuery", test: (html) => /jquery(\.min)?\.js/i.test(html) },
  { name: "Bootstrap", test: (html) => /bootstrap(\.min)?\.(css|js)/i.test(html) },
  { name: "Tailwind CSS", test: (html) => /tailwind(\.min)?\.css|tailwindcss/i.test(html) },
  { name: "Elementor", test: (html) => /elementor/i.test(html) },
  { name: "Drupal", test: (html) => /Drupal\.settings|\/sites\/default\/files/i.test(html) },
  { name: "Magento", test: (html) => /Mage\.Cookies|\/skin\/frontend\//i.test(html) },
  { name: "Joomla", test: (html) => /\/media\/jui\/|Joomla!/i.test(html) },
  { name: "HubSpot", test: (html) => /js\.hs-scripts\.com|hs-analytics/i.test(html) },
  { name: "Google Tag Manager", test: (html) => /googletagmanager\.com\/gtm\.js/i.test(html) },
  { name: "Google Analytics", test: (html) => /google-analytics\.com\/analytics\.js|gtag\(/i.test(html) },
  { name: "Google Fonts", test: (html) => /fonts\.googleapis\.com/i.test(html) },
  { name: "Font Awesome", test: (html) => /font-?awesome/i.test(html) },
  { name: "Stripe", test: (html) => /js\.stripe\.com/i.test(html) },
  { name: "Mailchimp", test: (html) => /list-manage\.com/i.test(html) },
  {
    name: "Cloudflare",
    test: (_html, headers) => /cloudflare/i.test(headers.get("server") ?? "") || headers.has("cf-ray"),
  },
  {
    name: "Vercel",
    test: (_html, headers) => headers.has("x-vercel-id") || /vercel/i.test(headers.get("server") ?? ""),
  },
  { name: "Netlify", test: (_html, headers) => /netlify/i.test(headers.get("server") ?? "") },
  {
    name: "AWS CloudFront",
    test: (_html, headers) => headers.has("x-amz-cf-id") || /cloudfront/i.test(headers.get("via") ?? ""),
  },
  { name: "PHP", test: (_html, headers) => /php/i.test(headers.get("x-powered-by") ?? "") },
  {
    name: "ASP.NET",
    test: (_html, headers) => /asp\.net/i.test(headers.get("x-powered-by") ?? "") || headers.has("x-aspnet-version"),
  },
  { name: "Nginx", test: (_html, headers) => /nginx/i.test(headers.get("server") ?? "") },
  { name: "Apache", test: (_html, headers) => /apache/i.test(headers.get("server") ?? "") },
];

export async function detectStack(url) {
  const target = new URL(url);
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("unsupported protocol");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(target, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StackDetectorBot/1.0)" },
    });
    const html = await response.text();
    return STACK_SIGNATURES.filter((sig) => sig.test(html, response.headers)).map((s) => s.name);
  } finally {
    clearTimeout(timeout);
  }
}
