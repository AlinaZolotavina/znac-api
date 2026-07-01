const normalizeHashtags = (hashtags) => {
  if (!hashtags) {
    return [];
  }

  const values = Array.isArray(hashtags) ? hashtags : [hashtags];

  return [
    ...new Set(
      values
        .flatMap((item) => String(item).trim().toLowerCase().split(/\s+/))
        .filter(Boolean)
    ),
  ];
};

module.exports = normalizeHashtags;
