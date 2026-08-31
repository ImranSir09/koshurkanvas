import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const CURRENT_APP_VERSION = '1.0.1';
export const CURRENT_APP_VERSION_CODE = 2;

export const DEFAULT_GITHUB_REPO = 'emraanmugloo/kashur-kanvas';
const SKIPPED_VERSION_KEY = 'kashur_kanvas_skipped_update_version';

export interface AppReleaseInfo {
  versionName: string;
  versionCode?: number;
  releaseTitle: string;
  releaseNotes: string;
  publishedAt: string;
  apkDownloadUrl: string;
  releaseUrl: string;
  hasUpdate: boolean;
  isDraft?: boolean;
  isPrerelease?: boolean;
}

export async function getInstalledAppVersion(): Promise<{ versionName: string; versionCode: number }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo();
      const code = parseInt(info.build || '2', 10);
      return {
        versionName: info.version || CURRENT_APP_VERSION,
        versionCode: isNaN(code) ? CURRENT_APP_VERSION_CODE : code,
      };
    } catch (err) {
      console.warn('Unable to retrieve native app version:', err);
    }
  }
  return {
    versionName: CURRENT_APP_VERSION,
    versionCode: CURRENT_APP_VERSION_CODE,
  };
}

/**
 * Compare two semver string versions (e.g., "1.0.2" vs "1.0.1").
 * Returns true if candidateVersion is strictly newer than currentVersion.
 */
export function isVersionNewer(candidateVersion: string, currentVersion: string): boolean {
  const cleanCandidate = candidateVersion.replace(/^v/i, '').trim();
  const cleanCurrent = currentVersion.replace(/^v/i, '').trim();

  if (!cleanCandidate) return false;
  if (cleanCandidate === cleanCurrent) return false;

  const candidateParts = cleanCandidate.split('.').map((p) => parseInt(p, 10) || 0);
  const currentParts = cleanCurrent.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLength = Math.max(candidateParts.length, currentParts.length);
  for (let i = 0; i < maxLength; i++) {
    const candidateNum = candidateParts[i] || 0;
    const currentNum = currentParts[i] || 0;
    if (candidateNum > currentNum) return true;
    if (candidateNum < currentNum) return false;
  }
  return false;
}

export function getSkippedVersion(): string | null {
  try {
    return localStorage.getItem(SKIPPED_VERSION_KEY);
  } catch {
    return null;
  }
}

export function setSkippedVersion(versionName: string): void {
  try {
    localStorage.setItem(SKIPPED_VERSION_KEY, versionName);
  } catch {}
}

export function clearSkippedVersion(): void {
  try {
    localStorage.removeItem(SKIPPED_VERSION_KEY);
  } catch {}
}

/**
 * Check GitHub Releases API for the latest version.
 */
export async function checkForAppUpdate(
  customRepo?: string,
  ignoreSkipped = false
): Promise<AppReleaseInfo> {
  const installed = await getInstalledAppVersion();
  const targetRepo = customRepo || (import.meta as any).env?.VITE_GITHUB_REPO || DEFAULT_GITHUB_REPO;
  const apiUrl = `https://api.github.com/repos/${targetRepo}/releases/latest`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API HTTP ${response.status}`);
    }

    const data = await response.json();
    const tagName = data.tag_name || data.name || '';
    const latestVersion = tagName.replace(/^v/i, '').trim();
    const releaseTitle = data.name || `Release ${tagName}` || 'New Update';
    const releaseNotes = data.body || 'New features, performance enhancements, and bug fixes.';
    const publishedAt = data.published_at || new Date().toISOString();
    const releaseUrl = data.html_url || `https://github.com/${targetRepo}/releases/latest`;

    // Extract APK download URL from release assets
    let apkDownloadUrl = releaseUrl;
    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find(
        (asset: any) =>
          asset.name?.toLowerCase().endsWith('.apk') ||
          asset.content_type === 'application/vnd.android.package-archive'
      );
      if (apkAsset && apkAsset.browser_download_url) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    const isNewer = isVersionNewer(latestVersion, installed.versionName);
    const skipped = getSkippedVersion();
    const isSkipped = !ignoreSkipped && skipped === latestVersion;

    const hasUpdate = isNewer && !isSkipped;

    return {
      versionName: latestVersion || installed.versionName,
      releaseTitle,
      releaseNotes,
      publishedAt,
      apkDownloadUrl,
      releaseUrl,
      hasUpdate,
      isDraft: data.draft || false,
      isPrerelease: data.prerelease || false,
    };
  } catch (error) {
    console.warn('Update check failed:', error);
    return {
      versionName: installed.versionName,
      releaseTitle: '',
      releaseNotes: '',
      publishedAt: '',
      apkDownloadUrl: '',
      releaseUrl: `https://github.com/${targetRepo}/releases`,
      hasUpdate: false,
    };
  }
}
