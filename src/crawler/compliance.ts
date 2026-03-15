import robotsParser from 'robots-parser';
import axios from 'axios';
import logger from '../logger';

const robotsCache = new Map<string, ReturnType<typeof robotsParser>>();

export async function isAllowed(url: string, userAgent = '*'): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    if (!robotsCache.has(robotsUrl)) {
      const response = await axios.get(robotsUrl, { timeout: 10000 });
      const parser = robotsParser(robotsUrl, response.data);
      robotsCache.set(robotsUrl, parser);
    }

    const parser = robotsCache.get(robotsUrl)!;
    return parser.isAllowed(url, userAgent) ?? true;
  } catch (error) {
    logger.warn(`Could not fetch robots.txt for ${url}, allowing by default`);
    return true;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ALLOWED_DOMAINS = [
  'hdsb.ca',
  'www.hdsb.ca',
  'hcdsb.org',
  'www.hcdsb.org',
  'data.ontario.ca',
  'ontario.ca',
  'www.ontario.ca',
];

export function isDomainAllowed(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
