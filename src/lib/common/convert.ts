const mergeStringWithCharacter = (str: string): string => {
  if (!str) return "";
  let cleanedStr = str.trim().replace(/\s+/g, " ");
  let lowercase = cleanedStr.toLocaleLowerCase();
  if (!lowercase.includes(" ")) return lowercase;
  let newStr = lowercase.replace(/ /g, "-");
  return newStr;
};

const generateId = (date: Date, sequence: number): string => {
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 999) {
    throw new Error("Nomor urut harus berupa angka bulat antara 0 dan 999");
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const number = String(sequence).padStart(3, "0");
  return `${year}${month}${day}${number}`;
};

const formatPhoneNumber = (phone: string): string => {
  // hapus karakter selain angka
  const clean = phone.replace(/\D/g, "");
  // ubah 08 -> 62
  if (clean.startsWith("08")) {
    return "62" + clean.slice(1);
  }
  // jika sudah 62
  if (clean.startsWith("62")) {
    return clean;
  }
  return "";
  // throw new Error("Format nomor ponsel tidak valid");
};

export { mergeStringWithCharacter, generateId, formatPhoneNumber };
