function normalizePhone(phone) {
  let cleaned = phone.replace(/\D/g, "");

  if (
    cleaned.length === 12 &&
    cleaned.startsWith("91")
  ) {
    cleaned = cleaned.slice(2);
  }

  if (
    cleaned.length === 11 &&
    cleaned.startsWith("0")
  ) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

module.exports = {
  normalizePhone,
};