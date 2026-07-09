import type { MessagePreset, StoryQuestion, TemplateId } from '@/lib/themes';

export type RecipientLocale = 'en' | 'hi';

type LocalizedMessagePreset = Pick<MessagePreset, 'title' | 'body'>;

type TemplateLocaleCopy = {
  label: string;
  defaultYesText: string;
  defaultNoText: string;
  storyQuestions: StoryQuestion[];
  messagePresets: LocalizedMessagePreset[];
  followUpReplies: string[];
};

type RecipientPageCopy = {
  privateCard: string;
  forLabel: string;
  fromLabel: string;
  languageLabel: string;
  ctaPrompt: string;
  noButtonWarning: string;
  successEmoji: string;
  successHeading: string;
  successSubtext: string;
  footerMadeWith: string;
  footerLink: string;
  footerSuffix: string;
  story: {
    compactEyebrow: string;
    promptsLabel: string;
    eyebrow: string;
    title: (recipientName: string) => string;
    progressLabel: string;
    questionAria: (index: number, eyebrow: string) => string;
    completeIcon: string;
    completeTitle: string;
    completeBody: string;
  };
  followUp: {
    heading: string;
    placeholder: string;
    send: string;
    sentTo: (creatorName: string) => string;
    sentReplies: string;
    creatorReplies: (creatorName: string) => string;
  };
};

export const RECIPIENT_COPY: Record<RecipientLocale, RecipientPageCopy> = {
  en: {
    privateCard: 'Private VibeCheck',
    forLabel: 'For',
    fromLabel: 'From',
    languageLabel: 'Translate page',
    ctaPrompt: 'Final answer time.',
    noButtonWarning: 'The playful no button may dodge you.',
    successEmoji: '💌',
    successHeading: 'Your answer has been sent.',
    successSubtext: 'Want to add a little more? Send a quick reply below.',
    footerMadeWith: 'Made with 💖 on ',
    footerLink: 'VibeCheck',
    footerSuffix: ' · Make one too →',
    story: {
      compactEyebrow: '5-step story',
      promptsLabel: 'prompts',
      eyebrow: 'A tiny story before the answer',
      title: (recipientName) => `Let ${recipientName} feel the moment first.`,
      progressLabel: 'Storyline progress',
      questionAria: (index, eyebrow) => `Story question ${index + 1}: ${eyebrow}`,
      completeIcon: '✨',
      completeTitle: 'The story is warm now.',
      completeBody: 'Time for the answer that actually matters.',
    },
    followUp: {
      heading: 'Want to send something back?',
      placeholder: 'Write a quick reply...',
      send: 'Send',
      sentTo: (creatorName) => `Reply sent to ${creatorName}.`,
      sentReplies: 'Sent replies',
      creatorReplies: (creatorName) => `${creatorName}'s Replies:`,
    },
  },
  hi: {
    privateCard: 'निजी VibeCheck',
    forLabel: 'के लिए',
    fromLabel: 'भेजा',
    languageLabel: 'पेज की भाषा',
    ctaPrompt: 'अब अंतिम जवाब।',
    noButtonWarning: 'मज़ेदार “नहीं” बटन थोड़ा बचकर भाग सकता है।',
    successEmoji: '💌',
    successHeading: 'आपका जवाब भेज दिया गया।',
    successSubtext: 'थोड़ा और कहना है? नीचे एक छोटा जवाब भेजें।',
    footerMadeWith: '💖 से बनाया गया ',
    footerLink: 'VibeCheck',
    footerSuffix: ' पर · अपना भी बनाएं →',
    story: {
      compactEyebrow: '5-स्टेप कहानी',
      promptsLabel: 'सवाल',
      eyebrow: 'जवाब से पहले एक छोटी कहानी',
      title: (recipientName) => `${recipientName} को पहले यह पल महसूस करने दें।`,
      progressLabel: 'कहानी की प्रगति',
      questionAria: (index, eyebrow) => `कहानी सवाल ${index + 1}: ${eyebrow}`,
      completeIcon: '✨',
      completeTitle: 'अब पल नरम और तैयार है।',
      completeBody: 'अब वह जवाब दें जो सच में मायने रखता है।',
    },
    followUp: {
      heading: 'कुछ वापस भेजना चाहेंगे?',
      placeholder: 'एक छोटा जवाब लिखें...',
      send: 'भेजें',
      sentTo: (creatorName) => `${creatorName} को आपका जवाब भेज दिया गया।`,
      sentReplies: 'भेजे गए जवाब',
      creatorReplies: (creatorName) => `${creatorName} के जवाब:`,
    },
  },
};

const HINDI_TEMPLATE_COPY = {
  shoot_shot: {
    label: 'लव लेटर 💘',
    defaultYesText: 'हाँ 💖',
    defaultNoText: 'नहीं 💔',
    storyQuestions: [
      { id: 'noticed', eyebrow: 'पहली नजर', question: 'क्या यह सिर्फ आपके लिए बना हुआ लगा?', options: ['हां, बहुत', 'मैं सुन रहा/रही हूं'] },
      { id: 'signal', eyebrow: 'इशारा', question: 'जवाब देने से पहले उन्हें क्या जानना चाहिए?', options: ['यह हिम्मत वाली बात है', 'यह प्यारा है', 'इसने मुझे चौंका दिया'] },
      { id: 'pace', eyebrow: 'आपकी रफ्तार', question: 'यह बात कितनी धीरे या जल्दी आगे बढ़े?', options: ['धीरे और सच्चा', 'पहले बात करते हैं', 'मैं तैयार हूं'] },
      { id: 'feeling', eyebrow: 'अहसास', question: 'अभी कौन सा भाव सबसे ज्यादा है?', options: ['बटरफ्लाइज', 'जिज्ञासा', 'हल्की मुस्कान'] },
      { id: 'reply', eyebrow: 'फाइनल चेक', question: 'उन्हें जवाब देने के लिए तैयार हैं?', options: ['हां, दिखाओ', 'एक सेकंड और'] },
    ],
    messagePresets: [
      {
        title: 'यह बात सिर्फ आपके लिए है',
        body: 'मैं चाहता/चाहती था कि यह एक टेक्स्ट से ज्यादा खास लगे।\nएक स्टोरी से ज्यादा सच्चा।\nऔर भूलना थोड़ा मुश्किल।\nतो यह रहा, सिर्फ आपके लिए।',
      },
      {
        title: 'मुझे यह ठीक से कहना था',
        body: 'मैं सामान्य मैसेज भेजने की कोशिश करता/करती रहा, पर वह काफी नहीं लगा।\nआप मेरे लिए एक छोटे टेक्स्ट से कहीं ज्यादा मायने रखते हैं।\nइसलिए मैंने यह बनाया।',
      },
      {
        title: 'कोई खेल नहीं, बस सच',
        body: 'मैं यह बात काफी समय से कहना चाह रहा/रही था।\nआप हर चीज को बेहतर बना देते हैं।\nक्या आप हमें एक सच्चा मौका देंगे?',
      },
    ],
    followUpReplies: [
      'ठीक है, मैं सुन रहा/रही हूं।',
      'यह सच में प्यारा था।',
      'पहले खाना, फिर बात।',
      'ठीक है, आपने मना लिया।',
    ],
  },
  maan_jao: {
    label: 'सॉरी कार्ड 🥺',
    defaultYesText: 'माफ किया',
    defaultNoText: 'अभी नहीं',
    storyQuestions: [
      { id: 'readiness', eyebrow: 'शुरू करने से पहले', question: 'क्या आप उन्हें सुनने के लिए तैयार हैं?', options: ['ठीक है, सुनूंगा/सुनूंगी', 'ध्यान से'] },
      { id: 'hurt', eyebrow: 'सच्ची बात', question: 'क्या माफी ने समझा कि आपको किस बात से चोट लगी?', options: ['हां, ज्यादातर', 'थोड़ी और परवाह चाहिए'] },
      { id: 'effort', eyebrow: 'मेहनत', question: 'क्या यह एक साधारण टेक्स्ट से ज्यादा सोच-समझकर बना लगा?', options: ['बिल्कुल', 'थोड़ा'] },
      { id: 'next_step', eyebrow: 'अब आगे', question: 'क्या चीजें हल्की करने में मदद करेगी?', options: ['एक सच्ची बात', 'बेहतर हरकतें', 'थोड़ा समय'] },
      { id: 'answer', eyebrow: 'फाइनल चेक', question: 'क्या आप अभी जवाब देना चाहते हैं?', options: ['मैं जवाब दे सकता/सकती हूं', 'मुझे तय करने दें'] },
    ],
    messagePresets: [
      {
        title: 'मुझसे गलती हुई',
        body: 'मुझसे गलती हुई, और मैं इसे बहानों से नहीं छिपाना चाहता/चाहती।\nमेरी बात से आपको चोट लगी, और आप इसके हकदार नहीं थे।\nमैं बार-बार सोचता/सोचती हूं कि मुझे बेहतर शब्द चुनने चाहिए थे।\nमैं सच में माफी चाहता/चाहती हूं। मुझे एक और मौका दें।',
      },
      {
        title: 'कोई बहाना नहीं',
        body: 'कोई बहाना नहीं, बस अपनी गलती मान रहा/रही हूं।\nमाफी सब मिटा नहीं सकती, लेकिन मैं समझता/समझती हूं कि बात आप तक कैसे पहुंची।\nक्या हम फिर से शुरू कर सकते हैं?',
      },
      {
        title: 'ठीक है, मैंने गड़बड़ की',
        body: 'ठीक है, मैंने सच में गड़बड़ की।\nइस पर मजाक नहीं बनाऊंगा/बनाऊंगी।\nबस इतना कहना है कि मुझे अफसोस है, मैं सच में मानता/मानती हूं, और मुझे हमारे बीच की आसान सी बात याद आती है।',
      },
    ],
    followUpReplies: [
      'यह कहने के लिए शुक्रिया।',
      'मुझे यह सुनना जरूरी था।',
      'चलो बात करके रीसेट करते हैं।',
      'ठीक है। माफ किया।',
    ],
  },
  birthday_roast: {
    label: 'हैप्पी बर्थडे 🎂',
    defaultYesText: 'अरे, शुक्रिया',
    defaultNoText: 'फिर भी पागल',
    storyQuestions: [
      { id: 'birthday_mood', eyebrow: 'बर्थडे मूड', question: 'क्या यह सच में बर्थडे वाला पल लग रहा है?', options: ['हां, प्यारा', 'काफी एक्स्ट्रा'] },
      { id: 'memory', eyebrow: 'मेमोरी चेक', question: 'आपके बारे में उन्हें क्या याद रखना चाहिए?', options: ['मेरी मस्ती', 'मेरा प्यार', 'केक'] },
      { id: 'wish', eyebrow: 'आपकी विश', question: 'इस साल के लिए आप कैसी ऊर्जा चुन रहे हैं?', options: ['नरम जीत', 'बड़ा ग्लो-अप', 'शांति और केक'] },
      { id: 'reaction', eyebrow: 'रिएक्शन', question: 'अभी कितनी मुस्कान आ रही है?', options: ['बहुत', 'छिपाने की कोशिश', 'पकड़े गए'] },
      { id: 'answer', eyebrow: 'फाइनल चेक', question: 'बर्थडे वाला प्यार स्वीकार करने के लिए तैयार हैं?', options: ['हां, जाहिर है', 'मुझे और ब्लश कराओ'] },
    ],
    messagePresets: [
      {
        title: 'अब भी आइकॉनिक',
        body: 'एक और साल निकल गया, और आप अब भी इतने आइकॉनिक हैं।\nआपका बर्थडे आपकी तरह एक्स्ट्रा हो, पहले केक, बाद में adulting।\nऔर ज्यादा कहानियों, ज्यादा मस्ती, और आपको सेलिब्रेट करने की और वजहों के नाम।',
      },
      {
        title: 'जैसे आप हैं',
        body: 'आपके दिन पर बस यह कहना है कि आप बहुत प्यार के लायक हैं, किसी काम की वजह से नहीं, बल्कि जैसे आप हैं वैसे ही।\nएक और साल आपके अपने अंदाज में जीने के नाम।\nहैप्पी बर्थडे।',
      },
      {
        title: 'मजाक अलग',
        body: 'एक सेकंड के लिए मजाक अलग, आप सच में इस दुनिया की अच्छी चीजों में से एक हैं, और आज आपको सेलिब्रेट करने का दिन है।\nहैप्पी बर्थडे।\nयह साल आपको वह सब दे जिसके आप हकदार हैं।',
      },
    ],
    followUpReplies: [
      'इसने मेरा दिन बना दिया।',
      'Aww, शुक्रिया।',
      'ठीक है, यह सच में खास लगा।',
      'सबसे अच्छा बर्थडे कार्ड।',
    ],
  },
  bestie_check: {
    label: 'बेस्टी कार्ड ✨',
    defaultYesText: 'लव यू बेस्टी',
    defaultNoText: 'उफ, क्रिंज',
    storyQuestions: [
      { id: 'vibe', eyebrow: 'वाइब चेक', question: 'क्या यह इंसान आधिकारिक तौर पर आपका chaos partner है?', options: ['दुर्भाग्य से हां', 'सर्टिफाइड'] },
      { id: 'memory', eyebrow: 'सबूत', question: 'यह दोस्ती इतनी खतरनाक क्यों है?', options: ['इनसाइड जोक्स', 'लेट नाइट कॉल्स', 'बुरे आइडिया'] },
      { id: 'softness', eyebrow: 'सॉफ्ट कॉर्नर', question: 'कितना sentimental होना allowed है?', options: ['थोड़ा', 'पूरी तरह emotional'] },
      { id: 'reply_style', eyebrow: 'रिप्लाई एनर्जी', question: 'किस तरह का जवाब सही लगेगा?', options: ['स्वीट', 'थोड़ा roast', 'दोनों'] },
      { id: 'answer', eyebrow: 'फाइनल चेक', question: 'मानने को तैयार हैं कि आप उनसे प्यार करते हैं?', options: ['ठीक है, हां', 'कभी नहीं बचेंगे'] },
    ],
    messagePresets: [
      {
        title: 'सबसे अच्छी चीजों में से एक',
        body: 'मैं यह काफी नहीं कहता/कहती, पर आप मेरी जिंदगी की सबसे अच्छी चीजों में से एक हैं।\nहर late-night call, हर अजीब प्लान, और आपके बिल्कुल आप होने के लिए शुक्रिया।\nमैं हमेशा आपके साथ हूं।',
      },
      {
        title: 'ऑफिशियल नोटिस',
        body: 'ऑफिशियल नोटिस: आपको मेरा Chief Chaos Partner और Emotional Support Human नियुक्त किया जाता है, तुरंत प्रभाव से।\nNo refunds, no returns।\nलव यू, बेस्टी।',
      },
      {
        title: 'मेरा अपना इंसान',
        body: 'कुछ लोग आते-जाते हैं, पर आप हमेशा जैसे लगते हैं।\nहर चीज में मेरा अपना इंसान बनने के लिए शुक्रिया।\nबस एक छोटी याद दिलानी थी कि मैं आपसे प्यार करता/करती हूं, हमेशा।',
      },
    ],
    followUpReplies: [
      'लव यू टू, बेस्टी।',
      'कोई रिफंड नहीं, हम फंसे हैं।',
      'आप भी मेरे अपने इंसान हैं।',
      'यह खतरनाक रूप से प्यारा था।',
    ],
  },
  netflix_chill: {
    label: 'मूवी नाइट 🍿',
    defaultYesText: 'स्नैक्स मेरी तरफ 🍿',
    defaultNoText: 'मैं सो रहा/रही हूं 😴',
    storyQuestions: [
      { id: 'plan', eyebrow: 'प्लान', question: 'एक धीमी मूवी नाइट अच्छी लगेगी?', options: ['बहुत अच्छी', 'स्नैक्स पर निर्भर'] },
      { id: 'snacks', eyebrow: 'पहले स्नैक्स', question: 'क्या non-negotiable है?', options: ['पॉपकॉर्न', 'डेजर्ट', 'कोल्ड ड्रिंक्स'] },
      { id: 'genre', eyebrow: 'मूवी रूल', question: 'उन्हें क्या नहीं चुनना चाहिए?', options: ['हॉरर', 'बोरिंग ड्रामा', 'कुछ भी sad'] },
      { id: 'company', eyebrow: 'असल वजह', question: 'यह मूवी के लिए है या साथ के लिए?', options: ['साथ के लिए', 'दोनों, obviously'] },
      { id: 'answer', eyebrow: 'फाइनल चेक', question: 'इनवाइट स्वीकार करने के लिए तैयार हैं?', options: ['मैं तैयार हूं', 'मुझे convince करो'] },
    ],
    messagePresets: [
      {
        title: 'इस वीकेंड कोई प्लान?',
        body: 'मैंने जान-बूझकर schedule खाली रखा है।\nस्नैक्स भी रख लिए हैं।\nमेरे साथ कुछ देखने आओगे/आओगी?',
      },
      {
        title: 'सच बोलूं',
        body: 'यह आधा Netflix invite है, आधा confession।\nमुझे आपके साथ रहना उतना पसंद है जितना शायद मानना नहीं चाहिए।\nमेरे साथ कुछ देखोगे/देखोगी?',
      },
      {
        title: 'काउच, blanket, good vibes?',
        body: 'यह हफ्ता भारी था।\nहम दोनों को एक slow night चाहिए।\nआ जाओ, खाना और playlist मेरी तरफ।',
      },
    ],
    followUpReplies: [
      'स्नैक्स मैं लाऊंगा/लाऊंगी, मूवी आप चुनो।',
      'डील, बस horror नहीं।',
      'मैं सच में इसी का इंतजार कर रहा/रही था।',
      'ठीक है, chill करते हैं।',
    ],
  },
} satisfies Record<TemplateId, TemplateLocaleCopy>;

export function formatPersonName(value: string | null | undefined, fallback: string) {
  const cleanValue = value?.trim().replace(/\s+/g, ' ');
  if (!cleanValue) return fallback;

  return cleanValue
    .split(' ')
    .map((part) => {
      if (part.length <= 2 && part === part.toUpperCase()) return part;
      return `${part.charAt(0).toLocaleUpperCase()}${part.slice(1).toLocaleLowerCase()}`;
    })
    .join(' ');
}

export function getTemplateLocaleCopy(templateType: string, locale: RecipientLocale) {
  if (locale !== 'hi') return undefined;
  return HINDI_TEMPLATE_COPY[templateType as TemplateId];
}

export function getLocalizedStoryQuestions(
  templateType: string,
  locale: RecipientLocale,
  fallback: StoryQuestion[],
) {
  return getTemplateLocaleCopy(templateType, locale)?.storyQuestions || fallback;
}

export function getLocalizedFollowUpPresets(
  templateType: string,
  locale: RecipientLocale,
  fallback: string[],
) {
  return getTemplateLocaleCopy(templateType, locale)?.followUpReplies || fallback;
}

export function getLocalizedActionLabels(templateType: string, locale: RecipientLocale) {
  const templateCopy = getTemplateLocaleCopy(templateType, locale);
  if (!templateCopy) return undefined;

  return {
    yesText: templateCopy.defaultYesText,
    noText: templateCopy.defaultNoText,
  };
}
