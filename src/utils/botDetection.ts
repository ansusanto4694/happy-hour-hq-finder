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
  | 'suspicious'
  | 'unknown';

export interface BotDetectionResult {
  isBot: boolean;
  botType: BotType | null;
  botName: string | null;
}

// Current Chrome major version (as of March 2026)
const CURRENT_CHROME_VERSION = 134;
const OUTDATED_THRESHOLD = 3; // Flag if 3+ versions behind

// Search engine bots (good for SEO)
const searchEngineBots = [
  'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot',
  'Baiduspider', 'YandexBot', 'Sogou', 'Exabot',
];

// SEO and web analysis tools
const seoToolBots = [
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot',
  'Rogerbot', 'SEOkicks', 'SeznamBot', 'LinkpadBot',
  'MegaIndex', 'BLEXBot', 'DataForSeoBot',
];

// Social media crawlers
const socialMediaBots = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot',
  'Pinterestbot', 'Slackbot', 'TelegramBot', 'WhatsApp', 'Discordbot',
];

// Monitoring and uptime services
const monitoringBots = [
  'UptimeRobot', 'Pingdom', 'StatusCake', 'Site24x7',
  'Netcraft', 'GTmetrix', 'WebPageTest',
];

// Potentially malicious or unwanted scrapers
const maliciousBots = [
  'scrapy', 'curl', 'wget', 'python-requests',
  'Go-http-client', 'libwww-perl', 'Apache-HttpClient',
  'okhttp', 'axios', 'node-fetch',
];

// Headless browser indicators
const headlessBrowserPatterns = [
  'HeadlessChrome', 'PhantomJS', 'Puppeteer',
  'Selenium', 'webdriver', 'Playwright',
];

/**
 * Extract Chrome major version from user agent string
 */
const getChromeVersion = (userAgent: string): number | null => {
  const match = userAgent.match(/Chrome\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Check if user agent is Linux x86_64 desktop (suspicious for a NYC happy hour site)
 */
const isLinuxDesktop = (userAgent: string): boolean => {
  return userAgent.includes('X11; Linux x86_64') && !userAgent.includes('Android');
};

/**
 * Check if Chrome version is outdated (3+ major versions behind current)
 */
const isOutdatedChrome = (userAgent: string): boolean => {
  const version = getChromeVersion(userAgent);
  if (version === null) return false;
  return version <= (CURRENT_CHROME_VERSION - OUTDATED_THRESHOLD);
};

/**
 * Detect if the current session is from a bot
 */
export const detectBot = (): BotDetectionResult => {
  const userAgent = navigator.userAgent;
  
  if (!userAgent || userAgent.trim() === '') {
    return { isBot: true, botType: 'unknown', botName: 'No User Agent' };
  }

  // Check known bot lists
  for (const botName of searchEngineBots) {
    if (userAgent.includes(botName)) {
      return { isBot: true, botType: 'search_engine', botName };
    }
  }
  for (const botName of seoToolBots) {
    if (userAgent.includes(botName)) {
      return { isBot: true, botType: 'seo_tool', botName };
    }
  }
  for (const botName of socialMediaBots) {
    if (userAgent.includes(botName)) {
      return { isBot: true, botType: 'social_media', botName };
    }
  }
  for (const botName of monitoringBots) {
    if (userAgent.includes(botName)) {
      return { isBot: true, botType: 'monitoring', botName };
    }
  }
  for (const botName of maliciousBots) {
    if (userAgent.toLowerCase().includes(botName.toLowerCase())) {
      return { isBot: true, botType: 'malicious', botName };
    }
  }
  for (const pattern of headlessBrowserPatterns) {
    if (userAgent.includes(pattern)) {
      return { isBot: true, botType: 'malicious', botName: pattern };
    }
  }

  // Generic bot indicators
  const botIndicators = ['bot', 'crawler', 'spider', 'scraper', 'crawling'];
  for (const indicator of botIndicators) {
    if (userAgent.toLowerCase().includes(indicator)) {
      return { isBot: true, botType: 'unknown', botName: `Generic Bot (${indicator})` };
    }
  }

  // --- Sophisticated bot heuristics ---

  // Linux x86_64 desktop with outdated Chrome = almost certainly a scraper/bot
  if (isLinuxDesktop(userAgent) && isOutdatedChrome(userAgent)) {
    const version = getChromeVersion(userAgent);
    return {
      isBot: true,
      botType: 'suspicious',
      botName: `Linux Desktop + Outdated Chrome/${version}`,
    };
  }

  // Linux x86_64 desktop alone is suspicious for a NYC restaurant site
  if (isLinuxDesktop(userAgent)) {
    return {
      isBot: true,
      botType: 'suspicious',
      botName: 'Linux Desktop (X11)',
    };
  }

  // Outdated Chrome on any platform (3+ versions behind)
  if (isOutdatedChrome(userAgent)) {
    const version = getChromeVersion(userAgent);
    return {
      isBot: true,
      botType: 'suspicious',
      botName: `Outdated Chrome/${version}`,
    };
  }

  // WebDriver detection
  if ('webdriver' in navigator && (navigator as any).webdriver) {
    return { isBot: true, botType: 'malicious', botName: 'WebDriver Detection' };
  }

  // No viewport
  if (window.innerWidth === 0 || window.innerHeight === 0) {
    return { isBot: true, botType: 'unknown', botName: 'No Viewport' };
  }

  return { isBot: false, botType: null, botName: null };
};

/**
 * Get a human-readable description of the bot type
 */
export const getBotTypeDescription = (botType: BotType | null): string => {
  switch (botType) {
    case 'search_engine': return 'Search Engine Crawler';
    case 'seo_tool': return 'SEO Analysis Tool';
    case 'social_media': return 'Social Media Bot';
    case 'monitoring': return 'Uptime Monitoring Service';
    case 'malicious': return 'Scraper/Malicious Bot';
    case 'suspicious': return 'Suspicious Traffic (Linux/Outdated Browser)';
    case 'unknown': return 'Unknown Bot';
    default: return 'Human User';
  }
};
