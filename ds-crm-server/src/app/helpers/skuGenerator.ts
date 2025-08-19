const generateSKU = (productName: string, productId: string): string => {
  const prefix = "DS";

  const namePart = productName
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .slice(0, 4) // Shorten name part
    .toUpperCase();

  const idPart = productId.slice(-4).toUpperCase(); // Last 4 characters of ID

  const timePart = Date.now().toString(36).slice(-5).toUpperCase(); // Timestamp-based unique part

  return `${prefix}-${namePart}-${idPart}`;
};

export default generateSKU;
