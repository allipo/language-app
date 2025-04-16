// Helper function to calculate relative luminance
export const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Helper function to get contrasting text color
export const getContrastColor = (hexColor) => {
  // Define color arrays for light and dark backgrounds
  const lightColors = ['#ffffff', '#edc34e', '#edc785', '#f5f3a2', '#c5dae8'];
  
  // Always return a random light color
  return lightColors[Math.floor(Math.random() * lightColors.length)];
};

// Helper function to get random dark background color
export const getRandomDarkColor = () => {
  const darkColors = ['#16331e', '#062d3d', '#2a242b', '#3d060b', '#2c2c2c'];
  return darkColors[Math.floor(Math.random() * darkColors.length)];
}; 