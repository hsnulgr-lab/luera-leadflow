// Sector-specific message templates for personalized WhatsApp outreach

export interface SectorTemplate {
    id: string;
    sectorId: string;
    sectorName: string;
    sectorEmoji: string;
    firstContact: {
        greeting: string;
        hook: string;
        valueProps: string[];
        cta: string;
    };
    personalization: {
        highRating: string;
        lowRating: string;
        noWebsite: string;
        hasWebsite: string;
        hasEmail: string;
        noEmail: string;
    };
}

export interface Lead {
    id: string;
    name: string;
    company: string;
    phone: string;
    email?: string;
    website?: string;
    rating?: number;
    category?: string;
}

// Pre-defined sector templates
export const sectorTemplates: SectorTemplate[] = [
    {
        id: "veteriner",
        sectorId: "veteriner",
        sectorName: "Veteriner Klinikler",
        sectorEmoji: "🐾",
        firstContact: {
            greeting: "Merhaba {{company}} 🐾",
            hook: "Dijital pazarlama ile hasta potansiyelinizi artırmak ister misiniz?",
            valueProps: [
                "Google'dan ayda 50+ yeni hasta kazanın",
                "Online randevu sistemi ile %30 verimlilik artışı",
                "Sadık müşteri kitlesi oluşturun"
            ],
            cta: "Size özel hazırladığımız ücretsiz analiz raporunu görmek ister misiniz?"
        },
        personalization: {
            highRating: "Google'da {{rating}} puan ile harika gidiyorsunuz! Bu başarıyı daha fazla hastaya ulaştıralım.",
            lowRating: "Google puanınızı yükseltmenize yardımcı olabiliriz.",
            noWebsite: "Henüz web siteniz yok - bu büyük bir fırsat! Online varlığınızı oluşturalım.",
            hasWebsite: "{{website}} sitenizi inceledim, potansiyeli değerlendirelim.",
            hasEmail: "",
            noEmail: ""
        }
    },
    {
        id: "dis-klinigi",
        sectorId: "dis-klinigi",
        sectorName: "Diş Klinikleri",
        sectorEmoji: "🦷",
        firstContact: {
            greeting: "Merhaba {{company}} 🦷",
            hook: "Dijital pazarlama ile yeni hasta akışınızı artırmak ister misiniz?",
            valueProps: [
                "Google aramalarda üst sıralarda yer alın",
                "Sosyal medyada güçlü bir marka oluşturun",
                "Online randevu ile hasta deneyimini iyileştirin"
            ],
            cta: "Kliniğiniz için hazırladığımız ücretsiz dijital analiz raporunu görmek ister misiniz?"
        },
        personalization: {
            highRating: "{{rating}} puanla harika bir itibarınız var! Bunu daha fazla hastaya ulaştıralım.",
            lowRating: "Google yorumlarınızı iyileştirmenize yardımcı olabiliriz.",
            noWebsite: "Profesyonel bir web sitesi ile online varlığınızı güçlendirelim.",
            hasWebsite: "{{website}} sitenizdeki fırsatları değerlendirelim.",
            hasEmail: "",
            noEmail: ""
        }
    },
    {
        id: "fitness",
        sectorId: "fitness",
        sectorName: "Fitness & Spor Salonları",
        sectorEmoji: "🏋️",
        firstContact: {
            greeting: "Merhaba {{company}} 🏋️",
            hook: "Üyelik sayınızı dijital pazarlama ile artırmak ister misiniz?",
            valueProps: [
                "Sosyal medyada aktif bir topluluk oluşturun",
                "Online kayıt ve ödeme sistemi ile kolaylık sağlayın",
                "Google'da yerel aramalarda öne çıkın"
            ],
            cta: "Salonunuz için hazırladığımız büyüme stratejisini görmek ister misiniz?"
        },
        personalization: {
            highRating: "{{rating}} puanla harika gidiyorsunuz! Bu memnuniyeti daha fazla üyeye ulaştıralım.",
            lowRating: "Üye memnuniyetini artırmanıza yardımcı olabiliriz.",
            noWebsite: "Online varlığınızı güçlendirerek yeni üyeler kazanalım.",
            hasWebsite: "{{website}} sitenizdeki potansiyeli değerlendirelim.",
            hasEmail: "",
            noEmail: ""
        }
    },
    {
        id: "restoran",
        sectorId: "restoran",
        sectorName: "Restoran & Kafe",
        sectorEmoji: "🍽️",
        firstContact: {
            greeting: "Merhaba {{company}} 🍽️",
            hook: "Müşteri sayınızı dijital pazarlama ile artırmak ister misiniz?",
            valueProps: [
                "Google Haritalar'da öne çıkın",
                "Sosyal medyada iştah açan içerikler oluşturun",
                "Online sipariş ve rezervasyon sistemi kurun"
            ],
            cta: "Restoranınız için hazırladığımız dijital büyüme planını görmek ister misiniz?"
        },
        personalization: {
            highRating: "{{rating}} puanla harika yorumlarınız var! Bu başarıyı daha fazla müşteriye ulaştıralım.",
            lowRating: "Müşteri deneyimini ve yorumlarınızı iyileştirmenize yardımcı olabiliriz.",
            noWebsite: "Online sipariş sistemi ile gelirinizi artıralım.",
            hasWebsite: "{{website}} sitenizdeki potansiyeli değerlendirelim.",
            hasEmail: "",
            noEmail: ""
        }
    },
    {
        id: "emlak",
        sectorId: "emlak",
        sectorName: "Emlak Ofisleri",
        sectorEmoji: "🏠",
        firstContact: {
            greeting: "Merhaba {{company}} 🏠",
            hook: "Portföyünüzü dijital pazarlama ile daha fazla alıcıya ulaştırmak ister misiniz?",
            valueProps: [
                "Emlak portallarında üst sıralarda yer alın",
                "Sosyal medyada etkili gayrimenkul pazarlaması yapın",
                "Lead yönetim sistemi ile müşteri takibi yapın"
            ],
            cta: "Ofisiniz için hazırladığımız dijital pazarlama stratejisini görmek ister misiniz?"
        },
        personalization: {
            highRating: "{{rating}} puanla güçlü bir itibarınız var! Bunu daha fazla müşteriye ulaştıralım.",
            lowRating: "Müşteri memnuniyetini artırmanıza yardımcı olabiliriz.",
            noWebsite: "Profesyonel bir web sitesi ile portföyünüzü sergileyin.",
            hasWebsite: "{{website}} sitenizdeki potansiyeli değerlendirelim.",
            hasEmail: "",
            noEmail: ""
        }
    },
    {
        id: "guzellik",
        sectorId: "guzellik",
        sectorName: "Güzellik & Kuaför",
        sectorEmoji: "💅",
        firstContact: {
            greeting: "Merhaba {{company}} 💅",
            hook: "Müşteri sayınızı dijital pazarlama ile artırmak ister misiniz?",
            valueProps: [
                "Instagram'da etkili bir marka oluşturun",
                "Online randevu sistemi ile müşteri deneyimini iyileştirin",
                "Google'da yerel aramalarda öne çıkın"
            ],
            cta: "Salonunuz için hazırladığımız sosyal medya stratejisini görmek ister misiniz?"
        },
        personalization: {
            highRating: "{{rating}} puanla harika yorumlarınız var! Bu başarıyı daha fazla müşteriye ulaştıralım.",
            lowRating: "Müşteri memnuniyetini artırmanıza yardımcı olabiliriz.",
            noWebsite: "Online randevu sistemi ile müşteri kazanın.",
            hasWebsite: "{{website}} sitenizdeki potansiyeli değerlendirelim.",
            hasEmail: "",
            noEmail: ""
        }
    }
];

// Generate personalized message for a lead based on sector template
export const generatePersonalizedMessage = (lead: Lead, template: SectorTemplate): string => {
    const parts: string[] = [];

    // Greeting
    let greeting = template.firstContact.greeting
        .replace("{{company}}", lead.company || lead.name);
    parts.push(greeting);

    // Personalization based on lead data
    if (lead.rating && lead.rating >= 4.0) {
        parts.push(template.personalization.highRating
            .replace("{{rating}}", lead.rating.toString()));
    } else if (lead.rating && lead.rating < 4.0) {
        parts.push(template.personalization.lowRating);
    }

    if (lead.website) {
        parts.push(template.personalization.hasWebsite
            .replace("{{website}}", lead.website));
    } else {
        parts.push(template.personalization.noWebsite);
    }

    // Hook
    parts.push(template.firstContact.hook);

    // Value props (pick 2 random ones)
    const shuffledProps = template.firstContact.valueProps
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
    parts.push("✨ " + shuffledProps.join("\n✨ "));

    // CTA
    parts.push(template.firstContact.cta);

    return parts.filter(p => p.trim()).join("\n\n");
};

// Detect sector from lead category
export const detectSector = (category: string): SectorTemplate | null => {
    const lowerCategory = category.toLowerCase();

    const sectorKeywords: Record<string, string[]> = {
        "veteriner": ["veteriner", "pet", "hayvan", "klinik"],
        "dis-klinigi": ["diş", "dental", "ağız", "ortodonti"],
        "fitness": ["fitness", "spor", "gym", "pilates", "yoga"],
        "restoran": ["restoran", "restaurant", "kafe", "cafe", "yemek", "mutfak"],
        "emlak": ["emlak", "gayrimenkul", "real estate", "konut"],
        "guzellik": ["güzellik", "kuaför", "berber", "saç", "tırnak", "manikür", "estetik"]
    };

    for (const [sectorId, keywords] of Object.entries(sectorKeywords)) {
        if (keywords.some(keyword => lowerCategory.includes(keyword))) {
            return sectorTemplates.find(t => t.sectorId === sectorId) || null;
        }
    }

    return null;
};

// Get template by sector ID
export const getTemplateById = (sectorId: string): SectorTemplate | undefined => {
    return sectorTemplates.find(t => t.sectorId === sectorId);
};

// Get all available sectors
export const getAllSectors = (): { id: string; name: string; emoji: string }[] => {
    return sectorTemplates.map(t => ({
        id: t.sectorId,
        name: t.sectorName,
        emoji: t.sectorEmoji
    }));
};
