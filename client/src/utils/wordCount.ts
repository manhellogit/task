export const calculateWordCount = (text: string): number => {
  // Remove extra whitespace and split by spaces, newlines, tabs
  const words = text.trim().split(/\s+/);
  // Filter out empty strings
  return words.filter(word => word.length > 0).length;
};