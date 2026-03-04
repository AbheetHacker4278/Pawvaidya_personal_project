/**
 * Extracts all URLs from a given text.
 * @param {string} text - The text to search for URLs.
 * @returns {string[]} - An array of found URLs.
 */
export const extractLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
};

/**
 * Returns the source name of a given URL.
 * @param {string} url - The URL to analyze.
 * @returns {string} - The source name (e.g., 'YouTube', 'LinkedIn') or 'External Link'.
 */
export const getLinkSource = (url) => {
    try {
        const hostname = new URL(url).hostname;
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
        if (hostname.includes('linkedin.com')) return 'LinkedIn';
        if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'Facebook';
        if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'X (Twitter)';
        if (hostname.includes('instagram.com')) return 'Instagram';
        if (hostname.includes('github.com')) return 'GitHub';
        if (hostname.includes('zoom.us')) return 'Zoom';
        if (hostname.includes('meet.google.com')) return 'Google Meet';

        // Remove www. and return the domain name capitalized
        const domain = hostname.replace('www.', '').split('.')[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (error) {
        return 'Link';
    }
};

/**
 * Helper to get a color class for a specific source
 */
export const getSourceColor = (source) => {
    switch (source) {
        case 'YouTube': return 'text-red-600 bg-red-50 border-red-200';
        case 'LinkedIn': return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'Facebook': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'X (Twitter)': return 'text-black bg-gray-50 border-gray-200';
        case 'Instagram': return 'text-pink-600 bg-pink-50 border-pink-200';
        case 'GitHub': return 'text-gray-800 bg-gray-50 border-gray-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};
