/**
 * Utility to convert links between storage and display formats
 * Storage format: [[space_id|Title]]
 * Display format: Title
 */

export interface LinkInfo {
  spaceId: string;
  title: string;
  startIndex: number;
  endIndex: number;
  storageStartIndex: number;
  storageEndIndex: number;
}

/**
 * Extracts all links from content in storage format
 * Supports both [[spaceId|title]] and [[spaceId:title]]
 */
export function extractLinks(storageContent: string): LinkInfo[] {
  // Pattern that supports both | and : as separator
  const linkPattern = /\[\[([^\]|:]+)[|:]([^\]]+)\]\]/g;
  const links: LinkInfo[] = [];
  let match;

  while ((match = linkPattern.exec(storageContent)) !== null) {
    links.push({
      spaceId: match[1],
      title: match[2],
      startIndex: 0, // Will be calculated later
      endIndex: 0,   // Will be calculated later
      storageStartIndex: match.index,
      storageEndIndex: match.index + match[0].length,
    });
  }

  return links;
}

/**
 * Converts from storage format to display format
 * [[space_id|Title]] or [[space_id:Title]] -> Title
 */
export function storageToDisplay(storageContent: string): { displayContent: string; links: LinkInfo[] } {
  const links = extractLinks(storageContent);
  let displayContent = storageContent;
  let offset = 0; // Offset due to replacements

  const updatedLinks: LinkInfo[] = [];

  links.forEach((link) => {
    // Rebuild the original text exactly as it appears in storage
    // Use substring to extract original text from storage position
    const originalStorageText = storageContent.substring(link.storageStartIndex, link.storageEndIndex);
    const displayText = link.title;

    // Calculate positions in display content
    const displayStartIndex = link.storageStartIndex - offset;
    const displayEndIndex = displayStartIndex + displayText.length;

    // Replace in display content
    displayContent = displayContent.substring(0, displayStartIndex) +
      displayText +
      displayContent.substring(link.storageEndIndex - offset);

    // Update offset for next replacements
    offset += (originalStorageText.length - displayText.length);

    updatedLinks.push({
      ...link,
      startIndex: displayStartIndex,
      endIndex: displayEndIndex,
    });
  });

  return { displayContent, links: updatedLinks };
}

/**
 * Converts from display format to storage format
 * Uses existing link map to rebuild the full format
 */
export function displayToStorage(
  displayContent: string,
  previousLinks: LinkInfo[]
): string {
  if (previousLinks.length === 0) {
    return displayContent;
  }

  let storageContent = displayContent;
  let offset = 0;

  // Sort links by startIndex (from first to last)
  const sortedLinks = [...previousLinks].sort((a, b) => a.startIndex - b.startIndex);

  sortedLinks.forEach((link) => {
    const currentStartIndex = link.startIndex + offset;

    // Find where the link text ends in the current display content
    // Just take the length of the original title
    const currentEndIndex = currentStartIndex + link.title.length;

    // Extract current text at that position
    const currentText = storageContent.substring(currentStartIndex, currentEndIndex);

    // If text is empty or position is out of range, link has been removed
    if (currentStartIndex >= storageContent.length || !currentText) {
      return;
    }

    // Rebuild link with original title (or current one if modified)
    const storageText = `[[${link.spaceId}|${currentText}]]`;

    // Replace
    storageContent = storageContent.substring(0, currentStartIndex) +
      storageText +
      storageContent.substring(currentEndIndex);

    // Update offset
    offset += (storageText.length - currentText.length);
  });

  return storageContent;
}

/**
 * Update links after a display content change
 * Tries to keep links synced with user changes
 */
export function updateLinksAfterEdit(
  oldDisplayContent: string,
  newDisplayContent: string,
  oldLinks: LinkInfo[]
): LinkInfo[] {
  if (oldLinks.length === 0) {
    return [];
  }

  // Calculate difference between old and new content
  const oldLength = oldDisplayContent.length;
  const newLength = newDisplayContent.length;
  const diff = newLength - oldLength;

  // Find where the change occurred
  let changeStart = 0;
  while (changeStart < Math.min(oldLength, newLength) &&
    oldDisplayContent[changeStart] === newDisplayContent[changeStart]) {
    changeStart++;
  }

  const updatedLinks: LinkInfo[] = [];

  oldLinks.forEach((link) => {
    // If link is before change, keep it unchanged
    if (link.endIndex <= changeStart) {
      updatedLinks.push({ ...link });
    }
    // If link is after change, shift it
    else if (link.startIndex >= changeStart) {
      updatedLinks.push({
        ...link,
        startIndex: link.startIndex + diff,
        endIndex: link.endIndex + diff,
      });
    }
    // If change is within the link, it might have been modified or removed
    else {
      // Try to find the link title in the new content near the original position
      const searchStart = Math.max(0, link.startIndex - 20);
      const searchEnd = Math.min(newDisplayContent.length, link.endIndex + 20);
      const searchArea = newDisplayContent.substring(searchStart, searchEnd);
      const titleIndex = searchArea.indexOf(link.title);

      if (titleIndex !== -1) {
        // Found! Update position
        const newStart = searchStart + titleIndex;
        updatedLinks.push({
          ...link,
          startIndex: newStart,
          endIndex: newStart + link.title.length,
        });
      }
      // Otherwise link has been removed, don't add it
    }
  });

  return updatedLinks;
}