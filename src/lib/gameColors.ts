// Jewel tone color palette for the game
export const GAME_COLORS: Record<number, { bg: string; dark: string; name: string }> = {
  1: { bg: 'hsl(160, 84%, 39%)', dark: 'hsl(160, 84%, 25%)', name: 'Emerald' },
  2: { bg: 'hsl(217, 91%, 50%)', dark: 'hsl(217, 91%, 32%)', name: 'Sapphire' },
  3: { bg: 'hsl(0, 72%, 51%)', dark: 'hsl(0, 72%, 33%)', name: 'Ruby' },
  4: { bg: 'hsl(270, 60%, 50%)', dark: 'hsl(270, 60%, 32%)', name: 'Amethyst' },
  5: { bg: 'hsl(38, 92%, 50%)', dark: 'hsl(38, 92%, 32%)', name: 'Topaz' },
  6: { bg: 'hsl(330, 81%, 55%)', dark: 'hsl(330, 81%, 35%)', name: 'Rose' },
  7: { bg: 'hsl(180, 70%, 45%)', dark: 'hsl(180, 70%, 28%)', name: 'Teal' },
  8: { bg: 'hsl(45, 93%, 67%)', dark: 'hsl(45, 93%, 47%)', name: 'Gold' },
  9: { bg: 'hsl(280, 100%, 65%)', dark: 'hsl(280, 100%, 42%)', name: 'Orchid' },
};

export function getColorStyle(colorNum: number): { bg: string; dark: string } {
  return GAME_COLORS[colorNum] || { bg: 'hsl(0, 0%, 20%)', dark: 'hsl(0, 0%, 10%)' };
}
