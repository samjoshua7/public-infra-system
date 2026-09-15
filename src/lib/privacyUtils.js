/**
 * Privacy Lock utilities for Civic Voice.
 * Protects citizen whistleblowers and reporters from harassment by masking identities.
 */

const ADJECTIVES = [
  'Long', 'Swift', 'Silent', 'Clever', 'Cosmic', 'Brave', 'Mighty',
  'Happy', 'Hyper', 'Quiet', 'Neon', 'Lucky', 'Golden', 'Shadow',
  'Silver', 'Wild', 'Chill', 'Mystic', 'Noble', 'Turbo'
];

const ANIMALS = [
  'Giraffe', 'Otter', 'Falcon', 'Penguin', 'Badger', 'Koala', 'Moose',
  'Fox', 'Panda', 'Cheetah', 'Owl', 'Tiger', 'Dolphin', 'Wolf',
  'Hawk', 'Beaver', 'Rabbit', 'Eagle', 'Leopard', 'Panther'
];

/**
 * Generate a client-side dummy name fallback.
 */
export const generateLocalDummyName = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const anim = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${anim}${num}`;
};

/**
 * Compute display properties for a report's author based on Privacy Lock settings.
 *
 * Rules:
 * - A report is considered locked if `report.privacy_lock === true` OR `reporter.privacy_lock === true`.
 * - If locked AND viewer is NOT the author:
 *   - Display Name: Dummy alias (e.g. "LongGiraffe421")
 *   - Email: Hidden (null)
 *   - Profile Link: Disabled (no navigation to profile)
 *   - Avatar: Privacy shield / dummy initial
 * - If locked AND viewer IS the author:
 *   - Display Name: Real Name
 *   - Indicator: "🔒 You (Shown as LongGiraffe421 to others)"
 *   - Profile Link: Enabled for own profile
 * - If unlocked:
 *   - Standard real name and profile link
 */
export const getPrivacyDisplay = ({
  reporterId = null,
  realName = null,
  anonymousName = null,
  isPostLocked = false,
  isAccountLocked = false,
  currentUserId = null,
}) => {
  const isLocked = Boolean(isPostLocked || isAccountLocked);
  const isAuthor = Boolean(currentUserId && reporterId && currentUserId === reporterId);
  const dummyName = anonymousName || 'LongGiraffe';

  if (!isLocked) {
    const name = realName || 'Citizen';
    return {
      displayName: name,
      secondaryText: null,
      isLocked: false,
      isAuthor,
      dummyName,
      showProfileLink: Boolean(reporterId),
      avatarChar: name.charAt(0).toUpperCase(),
      avatarBg: 'primary.main',
    };
  }

  // --- PRIVACY LOCK IS ACTIVE ---
  if (isAuthor) {
    const name = realName || 'Citizen';
    return {
      displayName: name,
      secondaryText: `🔒 Visible only to you (Shown as ${dummyName})`,
      isLocked: true,
      isAuthor: true,
      dummyName,
      showProfileLink: true,
      avatarChar: name.charAt(0).toUpperCase(),
      avatarBg: 'warning.main',
    };
  }

  // Viewing as anyone else (another citizen, official, or admin)
  return {
    displayName: dummyName,
    secondaryText: '🔒 Anonymous Report',
    isLocked: true,
    isAuthor: false,
    dummyName,
    showProfileLink: false, // Disallow visiting the protected user's profile
    avatarChar: dummyName.charAt(0).toUpperCase(),
    avatarBg: '#64748b', // Slate / anonymous shield color
  };
};
