// Fallback training shown when a campaign has no landing page or no training module
// attached — so a recipient who clicks always gets a teachable moment.
import type { Locale } from '@prisma/client';
import type { QuizQuestion } from './quiz.js';

type DefaultTraining = { title: string; content: string; quiz: QuizQuestion[] };

export const DEFAULT_TRAINING: Record<Locale, DefaultTraining> = {
  en: {
    title: 'This was a phishing simulation',
    content:
      'No harm done — this was a safe test run by your organisation. Real phishing emails try to rush you into clicking. Check the sender address, hover over links before clicking, and be wary of urgency and unexpected attachments. When in doubt, report it instead of clicking.',
    quiz: [
      {
        question: 'What is the safest first step with an unexpected email?',
        options: [
          'Click the link to check',
          'Reply with your password',
          'Check the sender address and report if unsure',
        ],
        answer: 2,
      },
      {
        question: 'A link looks fine but the address bar shows a different domain. You should:',
        options: [
          'Trust the link text',
          'Not enter any details and leave',
          'Enter your credentials quickly',
        ],
        answer: 1,
      },
      {
        question: 'Urgency ("act now or your account is locked") usually means:',
        options: [
          'It is probably legitimate',
          'It is a common phishing tactic',
          'You should pay immediately',
        ],
        answer: 1,
      },
    ],
  },
  tr: {
    title: 'Bu bir oltalama simülasyonuydu',
    content:
      'Zararı yok — bu, kurumunuzun yaptığı güvenli bir testti. Gerçek oltalama e-postaları sizi aceleyle tıklatmaya çalışır. Gönderen adresini kontrol edin, tıklamadan önce bağlantının üzerine gelin ve aciliyet ile beklenmeyen eklere karşı dikkatli olun. Emin değilseniz tıklamak yerine bildirin.',
    quiz: [
      {
        question: 'Beklenmeyen bir e-postada en güvenli ilk adım nedir?',
        options: [
          'Kontrol için bağlantıya tıklamak',
          'Şifrenizle yanıt vermek',
          'Gönderen adresini kontrol edip emin değilseniz bildirmek',
        ],
        answer: 2,
      },
      {
        question:
          'Bağlantı normal görünüyor ama adres çubuğunda farklı bir alan adı var. Ne yapmalısınız?',
        options: [
          'Bağlantı metnine güvenmek',
          'Hiçbir bilgi girmeden çıkmak',
          'Bilgilerinizi hızlıca girmek',
        ],
        answer: 1,
      },
      {
        question:
          'Aciliyet ("hemen harekete geçin yoksa hesabınız kilitlenecek") genellikle neyi gösterir?',
        options: [
          'Muhtemelen gerçektir',
          'Yaygın bir oltalama taktiğidir',
          'Hemen ödeme yapmalısınız',
        ],
        answer: 1,
      },
    ],
  },
};
