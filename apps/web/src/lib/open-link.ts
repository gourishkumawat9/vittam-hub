import { externalHref } from "@/lib/safe-url";

/**
 * Opens a link that has to be fetched first (a signed link to a private file
 * lasts minutes, so it is asked for on the click). The tab is opened straight
 * away and pointed at the file once the link arrives: a browser blocks a tab
 * opened after waiting, as a pop-up. Anything but an http(s) link is dropped.
 * Returns false when nothing could be opened, so the caller can say so.
 */
export async function openFetchedLink(fetchUrl: () => Promise<string>): Promise<boolean> {
  const tab = window.open("", "_blank");
  try {
    const safe = externalHref(await fetchUrl());
    if (!safe) {
      tab?.close();
      return false;
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = safe;
    } else {
      // Pop-ups blocked outright: open it here instead of doing nothing.
      window.location.assign(safe);
    }
    return true;
  } catch {
    tab?.close();
    return false;
  }
}
