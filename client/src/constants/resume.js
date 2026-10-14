export const TEMPLATES = [
  { id: 'classic', name: 'Classic', description: 'Centered header, uppercase headings, Arial. The safest choice.' },
  { id: 'modern', name: 'Modern', description: 'Left-aligned header with a coloured name and section bars.' },
  { id: 'compact', name: 'Compact', description: 'Serif type and tighter spacing to fit more on one page.' },
]

export const ACCENT_OPTIONS = [
  { id: 'teal', label: 'Teal', color: '#1F6573' },
  { id: 'navy', label: 'Navy', color: '#1B3A6B' },
  { id: 'plum', label: 'Plum', color: '#5B3A70' },
  { id: 'forest', label: 'Forest', color: '#2E6B4F' },
  { id: 'charcoal', label: 'Charcoal', color: '#2B2B2B' },
]

export const ACCENTS = Object.fromEntries(ACCENT_OPTIONS.map((a) => [a.id, a.color]))