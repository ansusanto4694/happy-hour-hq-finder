/**
 * Bot Detection Utility
 * Identifies automated bots, crawlers, and scrapers from human users
 */

export type BotType = 
  | 'search_engine'
  | 'seo_tool'
  | 'social_media'
  | 'monitoring'
  | 'malicious'
  | 'unknown';

export interface BotDetectionResult {
  isBot: boolean;
  botType: BotType | null;
  botName: string | null;
}

// Search engine bots (good for SEO)
const searchEngineBots = [
  'Googlebot',
  'Bingbot',
  'Slurp', // Yahoo
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
];

// SEO and web analysis tools
const seoToolBots = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'Rogerbot',
  'SEOkicks',
  'SeznamBot',
  'LinkpadBot',
  'MegaIndex',
  'BLEXBot',
  'DataForSeoBot',
];

// Social media crawlers
const socialMediaBots = [
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Pinterestbot',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Discordbot',
];

// Monitoring and uptime services
const monitoringBots = [
  'UptimeRobot',
  'Pingdom',
  'StatusCake',
  'Site24x7',
  'Netcraft',
  'GTmetrix',
  'WebPageTest',
];

// Potentially malicious or unwanted scrapers
const maliciousBots = [
  'scrapy',
  'curl',
  'wget',
  'python-requests',
  'Go-http-client',
  'libwww-perl',
  'Apache-HttpClient',
  'okhttp',
  'axios',
  'node-fetch',
];

// Headless browser indicators
const headlessBrowserPatterns = [
  'HeadlessChrome',
  'PhantomJS',
  'Puppeteer',
  'Selenium',
  'webdriver',
  'Playwright',
];

/**
 * Detect if the current session is from a bot
 */
export const detectBot = (): BotDetectionResult => {
  const userAgent = navigator.userAgent;
  
  // Check if user agent exists (basic sanity check)
  if (!userAgent || userAgent.trim() === '') {
    return {
      isBot: true,
      botType: 'unknown',
      botName: 'No User Agent',
    };
  }

  // Check for search engine bots
  for (const botName of searchEngineBots) {
    if (userAgent.includes(botName)) {
      return {
        isBot: true,
        botType: 'search_engine',
        botName,
      };
    }
  }

  // Check for SEO tool bots
  for (const botName of seoToolBots) {
    if (userAgent.includes(botName)) {
      return {
        isBot: true,
        botType: 'seo_tool',
        botName,
      };
    }
  }

  // Check for social media bots
  for (const botName of socialMediaBots) {
    if (userAgent.includes(botName)) {
      return {
        isBot: true,
        botType: 'social_media',
        botName,
      };
    }
  }

  // Check for monitoring bots
  for (const botName of monitoringBots) {
    if (userAgent.includes(botName)) {
      return {
        isBot: true,
        botType: 'monitoring',
        botName,
      };
    }
  }

  // Check for malicious/scraper bots
  for (const botName of maliciousBots) {
    if (userAgent.toLowerCase().includes(botName.toLowerCase())) {
      return {
        isBot: true,
        botType: 'malicious',
        botName,
      };
    }
  }

  // Check for headless browsers
  for (const pattern of headlessBrowserPatterns) {
    if (userAgent.includes(pattern)) {
      return {
        isBot: true,
        botType: 'malicious',
        botName: pattern,
      };
    }
  }

  // Check for generic bot indicators in user agent
  const botIndicators = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'crawling',
  ];

  for (const indicator of botIndicators) {
    if (userAgent.toLowerCase().includes(indicator)) {
      return {
        isBot: true,
        botType: 'unknown',
        botName: `Generic Bot (${indicator})`,
      };
    }
  }

  // Additional checks for bot-like behavior
  
  // Check for webdriver (automation tools)
  if ('webdriver' in navigator && (navigator as any).webdriver) {
    return {
      isBot: true,
      botType: 'malicious',
      botName: 'WebDriver Detection',
    };
  }

  // Check for missing/suspicious viewport
  if (window.innerWidth === 0 || window.innerHeight === 0) {
    return {
      isBot: true,
      botType: 'unknown',
      botName: 'No Viewport',
    };
  }

  // If all checks pass, likely a human user
  return {
    isBot: false,
    botType: null,
    botName: null,
  };
};

/**
 * Get a human-readable description of the bot type
 */
export const getBotTypeDescription = (botType: BotType | null): string => {
  switch (botType) {
    case 'search_engine':
      return 'Search Engine Crawler';
    case 'seo_tool':
      return 'SEO Analysis Tool';
    case 'social_media':
      return 'Social Media Bot';
    case 'monitoring':
      return 'Uptime Monitoring Service';
    case 'malicious':
      return 'Scraper/Malicious Bot';
    case 'unknown':
      return 'Unknown Bot';
    default:
      return 'Human User';
  }
};
