/**
 * Calculate Euclidean distance between two face descriptors
 * @param {Array} desc1 - First descriptor array
 * @param {Array} desc2 - Second descriptor array
 * @returns {Number} - Euclidean distance
 */
export const euclideanDistance = (desc1, desc2) => {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) return 1;
    return Math.sqrt(desc1.reduce((acc, val, i) => acc + Math.pow(val - desc2[i], 2), 0));
};
