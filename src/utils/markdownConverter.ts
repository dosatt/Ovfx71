import { Block, Space } from '../types';

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading1':
        return `# ${block.content}`;
      case 'heading2':
        return `## ${block.content}`;
      case 'heading3':
        return `### ${block.content}`;
      case 'bulletList':
        return `- ${block.content}`;
      case 'numberedList':
        return `1. ${block.content}`;
      case 'checkbox':
        return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
      case 'quote':
        return `> ${block.content}`;
      case 'divider':
        return block.metadata?.dividerVariant === 'stop' ? '___' : '---';
      case 'callout':
        return `> 💡 ${block.content}`;
      case 'code':
        return `\`\`\`${block.language || ''}\n${block.content}\n\`\`\``;
      case 'text':
      default:
        return block.content || '';
    }
  }).join('\n\n');
}

export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'code',
        content: codeLines.join('\n'),
        language
      });
      i++; // Skip closing ```
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'heading1',
        content: line.slice(2)
      });
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'heading2',
        content: line.slice(3)
      });
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'heading3',
        content: line.slice(4)
      });
    }
    // Checkbox
    else if (line.match(/^- \[(x| )\] /)) {
      const checked = line.includes('[x]');
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'checkbox',
        content: line.replace(/^- \[(x| )\] /, ''),
        checked
      });
    }
    // Bullet list
    else if (line.startsWith('- ')) {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'bulletList',
        content: line.slice(2)
      });
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'numberedList',
        content: line.replace(/^\d+\. /, '')
      });
    }
    // Quote/Callout
    else if (line.startsWith('> ')) {
      const content = line.slice(2);
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: content.startsWith('💡') ? 'callout' : 'quote',
        content: content.replace(/^💡 /, '')
      });
    }
    // Divider
    else if (line.trim() === '___') {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'divider',
        content: '',
        metadata: { dividerVariant: 'stop' }
      });
    }
    else if (line.trim() === '---') {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'divider',
        content: '',
        metadata: { dividerVariant: 'regular' }
      });
    }
    // Text
    else {
      blocks.push({
        id: `block_${Date.now()}_${blocks.length}`,
        type: 'text',
        content: line
      });
    }

    i++;
  }

  return blocks;
}

export function spaceToMarkdown(space: Space): string {
  // Create frontmatter
  const frontmatter = [
    '---',
    `id: ${space.id}`,
    `title: ${space.title}`,
    `type: ${space.type}`,
    space.icon ? `icon: ${space.icon}` : null,
    space.parentId ? `parentId: ${space.parentId}` : null,
    space.isFavorite ? `isFavorite: true` : null,
    `createdAt: ${space.createdAt}`,
    `updatedAt: ${space.updatedAt}`,
    '---'
  ].filter(Boolean).join('\n');

  // Convert content based on space type
  let content = '';
  if (space.type === 'page' && space.content?.blocks) {
    content = blocksToMarkdown(space.content.blocks);
  } else if (space.content) {
    // For other types, just stringify the content
    content = JSON.stringify(space.content, null, 2);
  }

  return `${frontmatter}\n\n${content}`;
}

export function markdownToSpace(markdown: string, originalSpace: Space): Partial<Space> | null {
  try {
    // Parse frontmatter
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatterLines = frontmatterMatch[1].split('\n');
    const updates: any = {};

    frontmatterLines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      if (key === 'title') updates.title = value;
      else if (key === 'icon') updates.icon = value;
      else if (key === 'isFavorite') updates.isFavorite = value === 'true';
    });

    // Parse content after frontmatter
    const contentStart = markdown.indexOf('---', 3) + 3;
    const contentMarkdown = markdown.slice(contentStart).trim();

    if (originalSpace.type === 'page') {
      const blocks = markdownToBlocks(contentMarkdown);
      updates.content = { blocks };
    }

    return updates;
  } catch (error) {
    console.error('Error in markdownToSpace:', error);
    return null;
  }
}