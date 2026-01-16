
export enum RelationshipType {
  ROMANTIC = 'Romantic',
  FRIENDSHIP = 'Friendship',
  FAMILIAL = 'Familial',
  PROFESSIONAL = 'Professional',
  OTHER = 'Other',
}

export enum Tone {
  WITTY = 'Witty',
  DRAMATIC = 'Dramatic',
  POETIC = 'Poetic',
  BLUNT_BUT_KIND = 'Blunt but Kind',
  COUNTRY_SONG = 'Country Song Style',
  HUMOROUS = 'Humorous',
  SARCASTIC = 'Sarcastic',
  FORMAL = 'Formal',
  EMPATHETIC = 'Empathetic',
  PASSIVE_AGGRESSIVE = 'Passive-Aggressive',
  SHAKESPEAREAN = 'Shakespearean',
}

export interface BreakupFormData {
  recipientName: string;
  userName: string;
  relationshipType: RelationshipType;
  reason: string;
  tone: Tone;
}
