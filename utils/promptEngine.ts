
import { CharacterDNA } from '../types';

interface Payload {
    textPrompt: string;
    referenceImage?: string;
}

export const constructGenerationPayload = (
    character: CharacterDNA,
    scenePrompt: string
): Payload => {

    // 1. Map Body Type to Adjectives
    const bodyMap: Record<string, string> = {
        'Ectomorph': 'slender, elegant frame',
        'Mesomorph': 'athletic, muscular build',
        'Endomorph': 'soft, curvy physique',
        'Athletic': 'toned, athletic build',
        'Curvy': 'voluptuous, curvy figure',
        'Slender': 'thin, delicate frame',
        'Stocky': 'broad, sturdy build'
    };

    const bodyDesc = bodyMap[character.bio.bodySomatotype] || character.bio.bodySomatotype;

    // 2. Construct Subject Definition
    const subjectDef = `A photorealistic shot of a ${character.bio.ageRange} ${character.bio.gender}, ${character.bio.ethnicity}, with a ${bodyDesc}. Distinctive features: ${character.bio.facialFeatures.join(', ')}.`;

    // 3. Determine Clothing (User preference overrides default if present in scenePrompt, but here we append default if strict)
    // Logic: If scenePrompt mentions "wearing", we might skip default accessories. 
    // For now, we'll append defaults as a fallback style description.
    const styleDef = `Wearing ${character.stylePreferences.clothingStyle.join(', ')}.`;

    // 4. Combine
    const textPrompt = `${subjectDef} ${styleDef} ${scenePrompt}. Cinematic lighting, 8k resolution, highly detailed based on the reference identity.`;

    return {
        textPrompt,
        referenceImage: character.anchorImage
    };
};
