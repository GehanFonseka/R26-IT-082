const words = (name) => String(name).normalize("NFKC").toLowerCase().match(/[\p{L}\p{M}]+/gu) || [];

const expands = (short, full) => {
  const first = words(short);
  const second = words(full);
  return first.length >= 2 && first.length === second.length && first.some((word) => word.length === 1)
    && first.some((word) => word.length > 1) && second.every((word) => word.length > 1)
    && first.every((word, index) => word.length === 1 ? second[index].startsWith(word) : word === second[index]);
};

export function distinctCertificateRecipients(names) {
  const key = (name) => { const parts = words(name); return (parts.every((word) => word.length > 1) ? parts.sort() : parts).join(" "); };
  const unique = [...new Map(names.map((name) => [key(name), name])).values()];
  return unique.filter((name) => unique.filter((full) => expands(name, full)).length !== 1);
}
