import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import AvatarPreview from '../components/avatars/AvatarPreview.jsx';
import { useProfile } from '../components/profile/useProfile.js';
import { useAuth } from '../components/auth/useAuth.js';
import {
  avatarCatalog,
  accessoryCatalog,
  DEFAULT_AVATAR_ID,
  findAvatarById,
  findAccessoryById,
} from '../data/avatarCatalog.js';

const AvatarMarketplacePage = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  const { profile, purchaseAvatar, purchaseAccessory, equipAvatar, equipAccessory } = useProfile();
  const walletTokens = profile?.walletTokens ?? 0;
  const ownedAvatars = profile?.ownedAvatars ?? [];
  const ownedAccessories = profile?.ownedAccessories ?? [];
  const equippedAvatarId = profile?.equippedAvatarId ?? DEFAULT_AVATAR_ID;
  const equippedAccessoryId = profile?.equippedAccessoryId ?? null;
  const [feedback, setFeedback] = useState(null);

  const equippedAvatar = useMemo(() => findAvatarById(equippedAvatarId), [equippedAvatarId]);
  const equippedAccessory = useMemo(() => findAccessoryById(equippedAccessoryId), [equippedAccessoryId]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <PageHeader title="Avatar Marketplace" onBack={onBack} />
        <section className="rounded-3xl border border-[#E5E5E5] bg-white p-6 text-center text-[#9E9E9E] sm:p-10">
          Sign in to personalise your Buddy avatar.
        </section>
      </div>
    );
  }

  const handleAvatarClick = (avatar) => {
    const owned = ownedAvatars.includes(avatar.id);
    if (!owned) {
      const success = purchaseAvatar(avatar.id, avatar.cost);
      setFeedback(
        success
          ? { type: 'success', message: `Unlocked ${avatar.title}!` }
          : { type: 'error', message: `Need ${avatar.cost} tokens to unlock ${avatar.title}.` }
      );
      return;
    }
    const success = equipAvatar(avatar.id);
    setFeedback(
      success
        ? { type: 'success', message: `${avatar.title} equipped.` }
        : { type: 'error', message: 'Unable to equip avatar right now.' }
    );
  };

  const handleAccessoryClick = (accessory) => {
    const owned = ownedAccessories.includes(accessory.id);
    if (!owned) {
      const success = purchaseAccessory(accessory.id, accessory.cost);
      setFeedback(
        success
          ? { type: 'success', message: `Unlocked ${accessory.title}!` }
          : { type: 'error', message: `Need ${accessory.cost} tokens to unlock ${accessory.title}.` }
      );
      return;
    }
    const success = equipAccessory(accessory.id);
    setFeedback(
      success
        ? { type: 'success', message: `${accessory.title} equipped.` }
        : { type: 'error', message: 'Unable to equip accessory right now.' }
    );
  };

  const handleClearAccessory = () => {
    equipAccessory(null);
    setFeedback({ type: 'success', message: 'Accessory removed.' });
  };

  const renderFeedback = () => {
    if (!feedback) return null;
    return (
      <div
        className={`rounded-3xl border px-4 py-3 text-sm ${feedback.type === 'success'
          ? 'border-[#A0E7E5] bg-[#F0FFFB] text-[#0F766E]'
          : 'border-[#FFB6C1] bg-[#FFF4F7] text-[#7A1120]'}`}
      >
        {feedback.message}
      </div>
    );
  };

  const sampleAvatar = avatarCatalog[0];

  return (
    <div className="space-y-8">
      <PageHeader title="Avatar Marketplace" onBack={onBack} />

      <section className="rounded-[32px] border border-[#E5E5E5] bg-gradient-to-br from-[#FFEFD5] via-[#F9F7FF] to-[#A0E7E5] px-6 py-9 shadow-xl sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 text-[#1F2933] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1F2933]/60">Buddy Styles</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Shop avatars & accessories</h1>
            <p className="text-sm text-[#1F2933]/70 sm:text-base">
              Powered by DiceBear’s open avatar catalog. Spend Buddy tokens once, then equip your style anytime.
            </p>
            <p className="text-sm font-semibold text-[#1F2933] sm:text-base">Wallet tokens: {walletTokens}</p>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 px-6 py-4 text-sm text-[#1F2933] shadow-sm backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">How it works</p>
            <ul className="mt-3 space-y-2 text-sm text-[#4B5563]">
              <li>1. Earn Buddy tokens via practice streaks.</li>
              <li>2. Purchase a look once to own it forever.</li>
              <li>3. Equip any owned item instantly.</li>
            </ul>
          </div>
        </div>
      </section>

      {renderFeedback()}

      <section className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="space-y-4 rounded-[28px] border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">Currently equipped</p>
          <AvatarPreview avatar={equippedAvatar} accessory={equippedAccessory} size={220} />
          <div>
            <p className="text-base font-semibold text-[#333333]">{equippedAvatar?.title}</p>
            <p className="text-sm text-[#9E9E9E]">{equippedAccessory ? equippedAccessory.title : 'No accessory equipped'}</p>
          </div>
          {equippedAccessory && (
            <button
              type="button"
              onClick={handleClearAccessory}
              className="w-full rounded-full border border-[#E5E5E5] px-4 py-2 text-sm font-semibold text-[#333333] transition hover:bg-[#F4F4F4]"
            >
              Remove accessory
            </button>
          )}
          <p className="text-[11px] text-[#9E9E9E]">DiceBear assets are licensed under CC0. No art production needed on your side.</p>
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#333333]">Avatars</h2>
              <p className="text-xs uppercase tracking-[0.24em] text-[#9E9E9E]">DiceBear Adventurer</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {avatarCatalog.map((avatar) => {
                const owned = ownedAvatars.includes(avatar.id);
                const equipped = equippedAvatarId === avatar.id;
                return (
                  <article
                    key={avatar.id}
                    className="relative flex flex-col gap-4 rounded-3xl border border-[#E5E5E5] bg-white p-4 shadow-sm"
                  >
                    <span
                      className="absolute -right-10 -top-12 h-24 w-24 rounded-full opacity-40"
                      style={{ backgroundColor: `${avatar.accent}55` }}
                      aria-hidden
                    />
                    <AvatarPreview avatar={avatar} accessory={equipped ? equippedAccessory : null} size={150} />
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-[#333333]">{avatar.title}</h3>
                      <p className="text-sm text-[#9E9E9E]">{avatar.description}</p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">
                      {owned ? 'Owned' : `Unlock · ${avatar.cost} tokens`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAvatarClick(avatar)}
                      className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${owned
                        ? equipped
                          ? 'bg-[#A0E7E5] text-[#333333]'
                          : 'border border-[#A0E7E5] text-[#333333] hover:bg-[#A0E7E5]/20'
                        : 'bg-[#333333] text-white hover:bg-[#4D4D4D]'}`}
                    >
                      {owned ? (equipped ? 'Equipped' : 'Equip') : 'Purchase'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#333333]">Accessories</h2>
              <p className="text-xs uppercase tracking-[0.24em] text-[#9E9E9E]">Overlay styles</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {accessoryCatalog.map((accessory) => {
                const owned = ownedAccessories.includes(accessory.id);
                const equipped = equippedAccessoryId === accessory.id;
                return (
                  <article
                    key={accessory.id}
                    className="relative flex flex-col gap-4 rounded-3xl border border-[#E5E5E5] bg-white p-4 shadow-sm"
                  >
                    <span
                      className="absolute -right-8 -top-10 h-20 w-20 rounded-full opacity-30"
                      style={{ backgroundColor: `${accessory.accent}55` }}
                      aria-hidden
                    />
                    <AvatarPreview
                      avatar={sampleAvatar}
                      accessory={accessory}
                      seedOverride={accessory.previewSeed}
                      size={120}
                    />
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-[#333333]">{accessory.title}</h3>
                      <p className="text-sm text-[#9E9E9E]">{accessory.description}</p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9E9E9E]">
                      {owned ? 'Owned' : `Unlock · ${accessory.cost} tokens`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAccessoryClick(accessory)}
                      className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${owned
                        ? equipped
                          ? 'bg-[#FFD166] text-[#333333]'
                          : 'border border-[#FFD166] text-[#333333] hover:bg-[#FFD166]/20'
                        : 'bg-[#333333] text-white hover:bg-[#4D4D4D]'}`}
                    >
                      {owned ? (equipped ? 'Equipped' : 'Equip') : 'Purchase'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AvatarMarketplacePage;
