/**
 * Utility per convertire i link tra formato storage e formato display
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
 * Estrae tutti i link dal contenuto in formato storage
 * Supporta sia [[spaceId|title]] che [[spaceId:title]]
 */
export function extractLinks(storageContent: string): LinkInfo[] {
  // Pattern che supporta sia | che : come separatore
  const linkPattern = /\[\[([^\]|:]+)[|:]([^\]]+)\]\]/g;
  const links: LinkInfo[] = [];
  let match;
  
  while ((match = linkPattern.exec(storageContent)) !== null) {
    links.push({
      spaceId: match[1],
      title: match[2],
      startIndex: 0, // Verrà calcolato dopo
      endIndex: 0,   // Verrà calcolato dopo
      storageStartIndex: match.index,
      storageEndIndex: match.index + match[0].length,
    });
  }
  
  return links;
}

/**
 * Converte dal formato storage al formato display
 * [[space_id|Title]] o [[space_id:Title]] -> Title
 */
export function storageToDisplay(storageContent: string): { displayContent: string; links: LinkInfo[] } {
  const links = extractLinks(storageContent);
  let displayContent = storageContent;
  let offset = 0; // Offset dovuto alle sostituzioni
  
  const updatedLinks: LinkInfo[] = [];
  
  links.forEach((link) => {
    // Ricostruisci il testo originale esattamente come appare nello storage
    // Usa substring per estrarre il testo originale dalla posizione storage
    const originalStorageText = storageContent.substring(link.storageStartIndex, link.storageEndIndex);
    const displayText = link.title;
    
    // Calcola le posizioni nel display content
    const displayStartIndex = link.storageStartIndex - offset;
    const displayEndIndex = displayStartIndex + displayText.length;
    
    // Sostituisci nel display content
    displayContent = displayContent.substring(0, displayStartIndex) + 
                     displayText + 
                     displayContent.substring(link.storageEndIndex - offset);
    
    // Aggiorna l'offset per le prossime sostituzioni
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
 * Converte dal formato display al formato storage
 * Utilizza la mappa dei link esistenti per ricostruire il formato completo
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
  
  // Ordina i link per startIndex (dal primo all'ultimo)
  const sortedLinks = [...previousLinks].sort((a, b) => a.startIndex - b.startIndex);
  
  sortedLinks.forEach((link) => {
    const currentStartIndex = link.startIndex + offset;
    
    // Trova dove finisce il testo del link nel contenuto display attuale
    // Prendi semplicemente la lunghezza del titolo originale
    const currentEndIndex = currentStartIndex + link.title.length;
    
    // Estrai il testo attuale in quella posizione
    const currentText = storageContent.substring(currentStartIndex, currentEndIndex);
    
    // Se il testo è vuoto o la posizione è fuori range, il link è stato rimosso
    if (currentStartIndex >= storageContent.length || !currentText) {
      return;
    }
    
    // Ricostruisci il link con il titolo originale (o quello attuale se modificato)
    const storageText = `[[${link.spaceId}|${currentText}]]`;
    
    // Sostituisci
    storageContent = storageContent.substring(0, currentStartIndex) + 
                     storageText + 
                     storageContent.substring(currentEndIndex);
    
    // Aggiorna l'offset
    offset += (storageText.length - currentText.length);
  });
  
  return storageContent;
}

/**
 * Aggiorna i link dopo una modifica del contenuto display
 * Cerca di mantenere i link sincronizzati con le modifiche dell'utente
 */
export function updateLinksAfterEdit(
  oldDisplayContent: string,
  newDisplayContent: string,
  oldLinks: LinkInfo[]
): LinkInfo[] {
  if (oldLinks.length === 0) {
    return [];
  }

  // Calcola la differenza tra vecchio e nuovo contenuto
  const oldLength = oldDisplayContent.length;
  const newLength = newDisplayContent.length;
  const diff = newLength - oldLength;
  
  // Trova dove è avvenuto il cambiamento
  let changeStart = 0;
  while (changeStart < Math.min(oldLength, newLength) && 
         oldDisplayContent[changeStart] === newDisplayContent[changeStart]) {
    changeStart++;
  }
  
  const updatedLinks: LinkInfo[] = [];
  
  oldLinks.forEach((link) => {
    // Se il link è prima del cambiamento, mantienilo invariato
    if (link.endIndex <= changeStart) {
      updatedLinks.push({...link});
    }
    // Se il link è dopo il cambiamento, shiftalo
    else if (link.startIndex >= changeStart) {
      updatedLinks.push({
        ...link,
        startIndex: link.startIndex + diff,
        endIndex: link.endIndex + diff,
      });
    }
    // Se il cambiamento è all'interno del link, il link potrebbe essere stato modificato o rimosso
    else {
      // Prova a trovare il titolo del link nel nuovo contenuto vicino alla posizione originale
      const searchStart = Math.max(0, link.startIndex - 20);
      const searchEnd = Math.min(newDisplayContent.length, link.endIndex + 20);
      const searchArea = newDisplayContent.substring(searchStart, searchEnd);
      const titleIndex = searchArea.indexOf(link.title);
      
      if (titleIndex !== -1) {
        // Trovato! Aggiorna la posizione
        const newStart = searchStart + titleIndex;
        updatedLinks.push({
          ...link,
          startIndex: newStart,
          endIndex: newStart + link.title.length,
        });
      }
      // Altrimenti il link è stato rimosso, non aggiungerlo
    }
  });
  
  return updatedLinks;
}