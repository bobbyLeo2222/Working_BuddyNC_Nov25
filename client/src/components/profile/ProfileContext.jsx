import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_AVATAR_ID } from '../../data/avatarCatalog.js';
import ProfileContext from './ProfileContext.js';

const STORAGE_KEY = 'buddy_profile_store_v1';
const LEGACY_STORAGE_KEY = 'buddy_profile_v1';
const GUEST_SCOPE = 'guest';

const LEGACY_GAME_ALIASES = {
  'memory-match': 'sequence-recall',
};

const defaultProfile = {
  walletTokens: 0,
  unlockedGames: [],
  ownedAvatars: [DEFAULT_AVATAR_ID],
  ownedAccessories: [],
  equippedAvatarId: DEFAULT_AVATAR_ID,
  equippedAccessoryId: null,
};

const normaliseStringId = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normaliseStringList = (value) => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map(normaliseStringId)
        .filter(Boolean)
    )
  );
};

const mergeProfile = (existing) => {
  const incoming = existing && typeof existing === 'object' ? existing : {};
  const walletTokens = Number.isFinite(incoming.walletTokens) ? incoming.walletTokens : defaultProfile.walletTokens;
  const unlockedGames = Array.isArray(incoming.unlockedGames)
    ? Array.from(
        new Set(
          incoming.unlockedGames
            .map((gameId) => {
              if (typeof gameId !== 'string') return null;
              return LEGACY_GAME_ALIASES[gameId] ?? gameId;
            })
            .filter(Boolean)
        )
      )
    : [];
  const ownedAvatars = (() => {
    const normalised = normaliseStringList(incoming.ownedAvatars);
    if (normalised.length === 0) {
      return [...defaultProfile.ownedAvatars];
    }
    if (!normalised.includes(DEFAULT_AVATAR_ID)) {
      return [DEFAULT_AVATAR_ID, ...normalised];
    }
    return normalised;
  })();
  const ownedAccessories = normaliseStringList(incoming.ownedAccessories);
  const equippedAvatarId = (() => {
    const candidate = normaliseStringId(incoming.equippedAvatarId);
    if (candidate && ownedAvatars.includes(candidate)) {
      return candidate;
    }
    return ownedAvatars[0] ?? DEFAULT_AVATAR_ID;
  })();
  const equippedAccessoryId = (() => {
    const candidate = normaliseStringId(incoming.equippedAccessoryId);
    if (candidate && ownedAccessories.includes(candidate)) {
      return candidate;
    }
    return null;
  })();
  return {
    walletTokens,
    unlockedGames,
    ownedAvatars,
    ownedAccessories,
    equippedAvatarId,
    equippedAccessoryId,
  };
};

const createDefaultProfile = () => mergeProfile();

const getScopeKey = (scope) => {
  if (typeof scope === 'string' && scope.trim()) {
    return scope.trim();
  }
  return GUEST_SCOPE;
};

const readStore = () => {
  if (typeof window === 'undefined') {
    return { profiles: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (parsed.profiles && typeof parsed.profiles === 'object' && !Array.isArray(parsed.profiles)) {
          const entries = Object.entries(parsed.profiles)
            .filter(([key]) => typeof key === 'string')
            .map(([key, value]) => [key, mergeProfile(value)]);
          return { profiles: Object.fromEntries(entries) };
        }
        if ('walletTokens' in parsed || 'unlockedGames' in parsed) {
          const profile = mergeProfile(parsed);
          const store = { profiles: { [GUEST_SCOPE]: profile } };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
          return store;
        }
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyProfile = mergeProfile(JSON.parse(legacyRaw));
      const store = { profiles: { [GUEST_SCOPE]: legacyProfile } };
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return store;
    }
  } catch (error) {
    console.warn('Failed to read profile store; falling back to defaults', error);
  }

  return { profiles: {} };
};

const writeStore = (store) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload = {
      profiles: Object.fromEntries(
        Object.entries(store.profiles || {}).filter(([key]) => typeof key === 'string')
      ),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist profile store', error);
  }
};

const restoreProfile = (scope) => {
  const store = readStore();
  const key = getScopeKey(scope);
  const stored = store.profiles?.[key];
  if (stored) {
    return mergeProfile(stored);
  }
  return createDefaultProfile();
};

const persistProfile = (scope, profile) => {
  if (typeof window === 'undefined') {
    return;
  }
  const store = readStore();
  const key = getScopeKey(scope);
  store.profiles[key] = mergeProfile(profile);
  writeStore(store);
};

const clearProfile = (scope) => {
  if (typeof window === 'undefined') {
    return;
  }
  const store = readStore();
  const key = getScopeKey(scope);
  if (store.profiles[key]) {
    delete store.profiles[key];
    writeStore(store);
  }
};

export const ProfileProvider = ({ children, scope }) => {
  const storageScope = getScopeKey(scope);
  const [activeScope, setActiveScope] = useState(storageScope);
  const [profile, setProfile] = useState(() =>
    typeof window !== 'undefined' ? restoreProfile(storageScope) : createDefaultProfile()
  );

  useEffect(() => {
    if (storageScope === activeScope) {
      return;
    }
    const nextProfile = typeof window !== 'undefined' ? restoreProfile(storageScope) : createDefaultProfile();
    setActiveScope(storageScope);
    setProfile(nextProfile);
  }, [storageScope, activeScope]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    persistProfile(activeScope, profile);
  }, [activeScope, profile]);

  const addTokens = useCallback((amount) => {
    if (!Number.isFinite(amount) || amount === 0) return false;
    setProfile((previous) => ({
      ...previous,
      walletTokens: Math.max(0, previous.walletTokens + amount),
    }));
    return true;
  }, []);

  const spendTokens = useCallback((amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    let success = false;
    setProfile((previous) => {
      if (previous.walletTokens < amount) {
        return previous;
      }
      success = true;
      return {
        ...previous,
        walletTokens: previous.walletTokens - amount,
      };
    });
    return success;
  }, []);

  const unlockGame = useCallback((gameId, cost) => {
    if (!gameId) return false;
    let success = false;
    setProfile((previous) => {
      const unlocked = Array.isArray(previous.unlockedGames) ? previous.unlockedGames : [];
      if (unlocked.includes(gameId)) {
        success = true;
        return previous;
      }

      const requiredTokens = Number.isFinite(cost) && cost > 0 ? cost : 0;
      if (requiredTokens > 0 && previous.walletTokens < requiredTokens) {
        return previous;
      }

      success = true;
      const nextTokens = requiredTokens > 0 ? previous.walletTokens - requiredTokens : previous.walletTokens;
      return {
        ...previous,
        walletTokens: Math.max(0, nextTokens),
        unlockedGames: [...unlocked, gameId],
      };
    });
    return success;
  }, []);

  const purchaseAvatar = useCallback((avatarId, cost) => {
    const avatarKey = normaliseStringId(avatarId);
    if (!avatarKey) return false;
    let success = false;
    setProfile((previous) => {
      const owned = Array.isArray(previous.ownedAvatars) ? previous.ownedAvatars : [];
      if (owned.includes(avatarKey)) {
        success = true;
        return previous;
      }

      const requiredTokens = Number.isFinite(cost) && cost > 0 ? cost : 0;
      if (requiredTokens > 0 && previous.walletTokens < requiredTokens) {
        return previous;
      }

      success = true;
      const nextTokens = requiredTokens > 0 ? previous.walletTokens - requiredTokens : previous.walletTokens;
      const shouldAutoEquip =
        !previous.equippedAvatarId || previous.equippedAvatarId === DEFAULT_AVATAR_ID;
      return {
        ...previous,
        walletTokens: Math.max(0, nextTokens),
        ownedAvatars: [...owned, avatarKey],
        equippedAvatarId: shouldAutoEquip ? avatarKey : previous.equippedAvatarId,
      };
    });
    return success;
  }, []);

  const purchaseAccessory = useCallback((accessoryId, cost) => {
    const accessoryKey = normaliseStringId(accessoryId);
    if (!accessoryKey) return false;
    let success = false;
    setProfile((previous) => {
      const owned = Array.isArray(previous.ownedAccessories) ? previous.ownedAccessories : [];
      if (owned.includes(accessoryKey)) {
        success = true;
        return previous;
      }

      const requiredTokens = Number.isFinite(cost) && cost > 0 ? cost : 0;
      if (requiredTokens > 0 && previous.walletTokens < requiredTokens) {
        return previous;
      }

      success = true;
      const nextTokens = requiredTokens > 0 ? previous.walletTokens - requiredTokens : previous.walletTokens;
      return {
        ...previous,
        walletTokens: Math.max(0, nextTokens),
        ownedAccessories: [...owned, accessoryKey],
        equippedAccessoryId: previous.equippedAccessoryId || accessoryKey,
      };
    });
    return success;
  }, []);

  const equipAvatar = useCallback((avatarId) => {
    const avatarKey = normaliseStringId(avatarId);
    if (!avatarKey) return false;
    let success = false;
    setProfile((previous) => {
      const owned = Array.isArray(previous.ownedAvatars) ? previous.ownedAvatars : [];
      if (!owned.includes(avatarKey)) {
        return previous;
      }
      if (previous.equippedAvatarId === avatarKey) {
        success = true;
        return previous;
      }
      success = true;
      return {
        ...previous,
        equippedAvatarId: avatarKey,
      };
    });
    return success;
  }, []);

  const equipAccessory = useCallback((accessoryId) => {
    if (accessoryId === null) {
      setProfile((previous) => ({
        ...previous,
        equippedAccessoryId: null,
      }));
      return true;
    }
    const accessoryKey = normaliseStringId(accessoryId);
    if (!accessoryKey) return false;
    let success = false;
    setProfile((previous) => {
      const owned = Array.isArray(previous.ownedAccessories) ? previous.ownedAccessories : [];
      if (!owned.includes(accessoryKey)) {
        return previous;
      }
      if (previous.equippedAccessoryId === accessoryKey) {
        success = true;
        return previous;
      }
      success = true;
      return {
        ...previous,
        equippedAccessoryId: accessoryKey,
      };
    });
    return success;
  }, []);

  const resetProfile = useCallback(() => {
    const nextProfile = createDefaultProfile();
    setProfile(nextProfile);
    if (typeof window !== 'undefined') {
      clearProfile(activeScope);
    }
  }, [activeScope]);

  const value = useMemo(
    () => ({
      profile,
      addTokens,
      spendTokens,
      unlockGame,
      purchaseAvatar,
      purchaseAccessory,
      equipAvatar,
      equipAccessory,
      resetProfile,
    }),
    [profile, addTokens, spendTokens, unlockGame, purchaseAvatar, purchaseAccessory, equipAvatar, equipAccessory, resetProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export default ProfileProvider;
