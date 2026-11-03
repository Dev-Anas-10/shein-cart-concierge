import dns from 'dns';

/**
 * Common disposable / temporary email domain blacklist
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  'armyspy.com',
  'bccto.me',
  'boun.cr',
  'burnermail.io',
  'chacuo.net',
  'crazymailing.com',
  'cuvox.de',
  'dayrep.com',
  'disposablemail.com',
  'dispostable.com',
  'drdrb.net',
  'dropmail.me',
  'einrot.com',
  'emailfake.com',
  'fakemail.net',
  'fakemailgenerator.com',
  'fleckens.hu',
  'filzmail.com',
  'generator.email',
  'getairmail.com',
  'getnada.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.block',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'gustr.com',
  'harakirimail.com',
  'hmamail.com',
  'inboxkitten.com',
  'incognitomail.org',
  'instantemailaddress.com',
  'jetable.org',
  'jourrapide.com',
  'kasmail.com',
  'kurzepost.de',
  'maildrop.cc',
  'mailinator.com',
  'mailmetrash.com',
  'mailnesia.com',
  'mailnull.com',
  'meltmail.com',
  'mintemail.com',
  'mohmal.im',
  'mohmal.in',
  'mytrashmail.com',
  'mytemp.email',
  'mytempemail.com',
  'mytempmail.com',
  'nada.ltd',
  'netzidiot.de',
  'nobulk.com',
  'nomail.xl.cx',
  'notsharingmy.info',
  'nowmymail.com',
  'owlpic.com',
  'pokemail.net',
  'pookmail.com',
  'rhyta.com',
  'safetymail.info',
  'sharklasers.com',
  'shitmail.me',
  'shortmail.net',
  'slopsbox.com',
  'sneakemail.com',
  'sofort-mail.de',
  'sofortmail.de',
  'spam4.me',
  'spambox.us',
  'spamcon.org',
  'spamex.com',
  'spamfree24.org',
  'spamgourmet.com',
  'spaml.com',
  'superrito.com',
  'teleworm.us',
  'tempail.com',
  'tempinbox.com',
  'tempmail.com',
  'temp-mail.org',
  'temporarymail.com',
  'throwaway.email',
  'throwawaymail.com',
  'trash-mail.at',
  'trashmail.at',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'whyspam.me',
  'willhackforfood.biz',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'zoemail.org',
]);

/**
 * Dummy / test domains that should never be used in production
 */
const FAKE_TEST_DOMAINS = new Set([
  'test.com',
  'test.net',
  'test.org',
  'example.com',
  'example.net',
  'example.org',
  'fake.com',
  'fake.net',
  'asdf.com',
  '123.com',
  'sample.com',
  'dummy.com',
  'none.com',
  'noemail.com',
  'invalid.com',
  'domain.com',
  'site.com',
  'email.com',
]);

/**
 * Common keyboard mash patterns to catch senseless typing
 */
const KEYBOARD_MASH_PATTERNS = [
  'asdf',
  'sdfg',
  'dfgh',
  'fghj',
  'ghjk',
  'hjkl',
  'qwer',
  'wert',
  'erty',
  'rtyu',
  'tyui',
  'yuio',
  'uiop',
  'zxcv',
  'xcvb',
  'cvbn',
  'vbnm',
  '1234',
  '2345',
  '3456',
  '4567',
  'شسي',
  'سيب',
  'يبت',
  'بتث',
  'ضصث',
  'صثق',
  'ثقف',
  'قفغ',
];

/**
 * Validates that a user or recipient name is a legitimate, natural human name
 */
export function validateRealName(rawName?: string): {
  isValid: boolean;
  name: string;
  error?: string;
} {
  if (!rawName || typeof rawName !== 'string') {
    return {
      isValid: false,
      name: '',
      error: 'يرجى إدخال اسم المستلم.',
    };
  }

  const clean = rawName.trim().replace(/\s+/g, ' ');

  // Length limits
  if (clean.length < 3) {
    return {
      isValid: false,
      name: clean,
      error: 'الاسم قصير جداً، يرجى كتابة اسمك الحقيقي.',
    };
  }

  if (clean.length > 60) {
    return {
      isValid: false,
      name: clean,
      error: 'الاسم طويل جداً، يرجى كتابة الاسم بحد أقصى 60 حرفاً.',
    };
  }

  // Digits check: Human names do not contain numbers
  if (/\d/.test(clean)) {
    return {
      isValid: false,
      name: clean,
      error: 'الاسم يجب ألا يحتوي على أرقام. يرجى كتابة حروف فقط.',
    };
  }

  // Allowed characters: Arabic letters, Latin letters, spaces, hyphens, and apostrophes
  const allowedCharsRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-']+$/;
  if (!allowedCharsRegex.test(clean)) {
    return {
      isValid: false,
      name: clean,
      error: 'الاسم يحتوي على رموز غير صالحة. يرجى استخدام حروف عربية أو إنجليزية فقط.',
    };
  }

  // Run of repeated characters: 3+ identical consecutive letters (e.g. "aaaa" or "محمدددد")
  if (/(.)\1{2,}/iu.test(clean)) {
    return {
      isValid: false,
      name: clean,
      error: 'الاسم يحتوي على حروف مكررة بشكل غير طبيعي. يرجى كتابة اسم صحيح.',
    };
  }

  // Keyboard mash check (case-insensitive)
  const lowerClean = clean.toLowerCase();
  for (const mash of KEYBOARD_MASH_PATTERNS) {
    if (lowerClean.includes(mash)) {
      return {
        isValid: false,
        name: clean,
        error: 'الاسم المدخل يبدو عشوائياً، يرجى كتابة اسمك الحقيقي.',
      };
    }
  }

  // Words breakdown
  const words = clean.split(' ').filter((w) => w.length > 0);

  // E-commerce & courier requirement: at least 2 words (First Name + Last Name)
  if (words.length < 2) {
    return {
      isValid: false,
      name: clean,
      error: 'يرجى كتابة الاسم ثنائياً بالكامل (الاسم الأول واسم العائلة) لاستكمال بوليصة الشحن.',
    };
  }

  // Each word should be at least 2 characters (e.g. avoid single-letter gibberish like "a b")
  for (const word of words) {
    if (word.length < 2) {
      return {
        isValid: false,
        name: clean,
        error: 'يرجى كتابة كل جزء من الاسم بطريقة صحيحة (أكثر من حرف واحد).',
      };
    }

    // English vowel check: English words with 3+ characters MUST contain at least one vowel
    if (/^[a-zA-Z]+$/.test(word) && word.length >= 3) {
      if (!/[aeiouyAEIOUY]/.test(word)) {
        return {
          isValid: false,
          name: clean,
          error: 'الاسم باللغة الإنجليزية يبدو عشوائياً وبلا حروف علة. يرجى كتابة اسم حقيقي.',
        };
      }
    }
  }

  return {
    isValid: true,
    name: clean,
  };
}

/**
 * Checks DNS MX records to confirm the domain actually has an active mail server
 */
export async function hasActiveMailServer(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 1500ms safety timeout: fail-open so slow DNS never blocks valid users
    const timer = setTimeout(() => resolve(true), 1500);

    dns.resolveMx(domain, (err, addresses) => {
      clearTimeout(timer);
      if (err) {
        // ENOTFOUND or ENODATA indicates non-existent domain or no mail exchanger
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
          resolve(false);
        } else {
          // Network hiccup or timeout: fail-open to never penalize real customers
          resolve(true);
        }
        return;
      }
      resolve(Array.isArray(addresses) && addresses.length > 0);
    });
  });
}

/**
 * Validates that an email is legitimate, correctly formatted, not disposable, and from an active domain
 */
export async function validateRealEmail(
  rawEmail?: string,
  options: { checkMx?: boolean } = { checkMx: true }
): Promise<{
  isValid: boolean;
  email: string;
  error?: string;
}> {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      email: '',
      error: 'البريد الإلكتروني مطلوب.',
    };
  }

  const clean = rawEmail.trim().toLowerCase();

  // Basic length constraints
  if (clean.length < 5 || clean.length > 254) {
    return {
      isValid: false,
      email: clean,
      error: 'طول البريد الإلكتروني غير صحيح.',
    };
  }

  // Standard strict email syntax regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return {
      isValid: false,
      email: clean,
      error: 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@example.com).',
    };
  }

  const [localPart, domain] = clean.split('@');
  if (!localPart || !domain) {
    return {
      isValid: false,
      email: clean,
      error: 'صيغة البريد الإلكتروني غير مكتملة.',
    };
  }

  // TLD check (must have at least 2 characters, e.g. .com, .eg, .net)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      email: clean,
      error: 'امتداد البريد الإلكتروني غير صحيح.',
    };
  }

  // Disposable / temporary burner email check
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      email: clean,
      error: 'عفواً، لا نقبل البريد الإلكتروني المؤقت أو الوهمي لضمان متابعة حالة شحنتك والفواتير.',
    };
  }

  // Fake / dummy domain check
  if (FAKE_TEST_DOMAINS.has(domain)) {
    return {
      isValid: false,
      email: clean,
      error: 'يرجى إدخال بريد إلكتروني حقيقي ومفعل (مثل Gmail أو Outlook أو iCloud).',
    };
  }

  // Repeated characters in local-part (e.g. "aaaaaaa@gmail.com")
  if (/(.)\1{4,}/.test(localPart)) {
    return {
      isValid: false,
      email: clean,
      error: 'اسم البريد الإلكتروني يحتوي على حروف مكررة بشكل غير طبيعي.',
    };
  }

  // Keyboard mash in local-part
  for (const mash of ['asdfgh', 'qwerty', 'zxcvbn', '123456']) {
    if (localPart.includes(mash)) {
      return {
        isValid: false,
        email: clean,
        error: 'البريد الإلكتروني المدخل يبدو عشوائياً. يرجى استخدام بريدك الحقيقي.',
      };
    }
  }

  // DNS MX check if requested (server-side only)
  if (options.checkMx) {
    const hasMx = await hasActiveMailServer(domain);
    if (!hasMx) {
      return {
        isValid: false,
        email: clean,
        error: `النطاق (@${domain}) غير قادر على استقبال رسائل البريد الإلكتروني. يرجى التأكد من كتابة الدومين بشكل صحيح.`,
      };
    }
  }

  return {
    isValid: true,
    email: clean,
  };
}
