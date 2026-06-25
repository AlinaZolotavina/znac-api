const normalizeHashtagName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

module.exports = normalizeHashtagName;
