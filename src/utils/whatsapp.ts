// WhatsApp utility functions

/**
 * Formats phone number for WhatsApp (removes spaces, dashes, etc.)
 */
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If starts with 0, replace with +90 (Turkey)
    if (cleaned.startsWith('0')) {
        cleaned = '+90' + cleaned.slice(1);
    }

    // If doesn't start with +, add +90
    if (!cleaned.startsWith('+')) {
        cleaned = '+90' + cleaned;
    }

    return cleaned;
}

/**
 * Creates WhatsApp deep link with pre-filled message
 */
export function createWhatsAppLink(phone: string, message: string): string {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Opens WhatsApp with pre-filled message
 */
export function openWhatsApp(phone: string, message: string): void {
    const link = createWhatsAppLink(phone, message);
    window.open(link, '_blank');
}
