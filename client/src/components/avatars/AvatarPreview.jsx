import React, { useMemo } from 'react';
import { buildDiceBearUrl } from '../../data/avatarCatalog.js';

const mergeOptions = (baseOptions, accessoryOptions) => {
  const merged = { ...(baseOptions || {}) };
  if (!accessoryOptions) {
    return merged;
  }
  Object.entries(accessoryOptions).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    merged[key] = value;
  });
  if (!('accessoriesProbability' in merged)) {
    merged.accessoriesProbability = 100;
  }
  return merged;
};

const AvatarPreview = ({ avatar, accessory, size = 160, className = '', seedOverride }) => {
  const src = useMemo(() => {
    if (!avatar) return null;
    const options = mergeOptions(avatar.options, accessory?.options);
    return buildDiceBearUrl({
      style: avatar.style,
      seed: seedOverride || avatar.seed,
      options,
    });
  }, [avatar, accessory, seedOverride]);

  if (!avatar) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[32px] border border-[#E5E5E5] bg-white p-4 shadow-inner ${className}`}
      style={{ height: size, width: size }}
    >
      {src ? (
        <img
          src={src}
          alt={avatar.title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="text-center text-xs text-[#9E9E9E]">Preview unavailable</div>
      )}
    </div>
  );
};

export default AvatarPreview;
