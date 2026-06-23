function generateAliases(name) {
  const lower = name.toLowerCase().trim();

  const words = lower
    .split(" ")
    .filter(Boolean);

  const aliases = new Set();

  words.forEach((word) => {
    aliases.add(word);
  });

  if (words.length >= 2) {
    aliases.add(
      `${words[0]} ${words[words.length - 1]}`
    );
  }

  aliases.add(lower);

  return [...aliases];
}

module.exports = {
  generateAliases,
};