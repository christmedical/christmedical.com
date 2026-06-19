/**
 * Double Metaphone encoder (Lawrence Philips algorithm, public-domain structure).
 * Used for offline patient search when Postgres dmetaphone is unavailable.
 * Online search defers to the API fuzzystrmatch path.
 */

function isVowel(ch: string): boolean {
  return "aeiou".includes(ch);
}

/** Returns primary Double Metaphone code for a single token (lowercase). */
export function doubleMetaphonePrimary(input: string): string {
  const word = input.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length === 0) return "";

  let current = 0;
  const length = word.length;
  const chars = word.split("");
  const primary: string[] = [];

  const at = (i: number) => chars[i] ?? "";
  const add = (c: string) => {
    if (primary.length === 0 || primary[primary.length - 1] !== c) primary.push(c);
  };

  if (at(0) === "g" && at(1) === "n") current = 2;
  else if (at(0) === "k" && at(1) === "n") current = 2;
  else if (at(0) === "p" && at(1) === "h") {
    add("F");
    current = 2;
  } else if (at(0) === "w" && at(1) === "r") current = 2;
  else if (
    at(0) === "x" &&
    (length === 1 || at(1) !== "h")
  ) {
    add("S");
    current++;
  }

  while (primary.length < 4 && current < length) {
    const ch = at(current);

    if (ch === "c") {
      if (at(current + 1) === "h") {
        add(at(current + 2) === "i" ? "X" : "K");
        current += 2;
      } else if (["iey"].includes(at(current + 1))) {
        add("S");
        current += 2;
      } else {
        add("K");
        current++;
      }
      continue;
    }

    if (ch === "d") {
      if (at(current + 1) === "g" && "iey".includes(at(current + 2))) {
        add("J");
        current += 3;
      } else {
        add("T");
        current++;
      }
      continue;
    }

    if (ch === "g") {
      if (
        (at(current + 1) === "h" && current > 0 && !isVowel(at(current - 1))) ||
        (at(current + 1) === "h" && current === 0)
      ) {
        current += 2;
        continue;
      }
      if (at(current + 1) === "n" && current + 1 === length - 1) {
        current += 2;
        continue;
      }
      if (["iey"].includes(at(current + 1)) && at(current - 1) !== "g") {
        add("J");
        current += 2;
      } else {
        add("K");
        current++;
      }
      continue;
    }

    if (ch === "h") {
      if (
        (current === 0 || isVowel(at(current - 1))) &&
        isVowel(at(current + 1))
      ) {
        add("H");
      }
      current++;
      continue;
    }

    if (ch === "k") {
      if (at(current + 1) === "k") current++;
      add("K");
      current++;
      continue;
    }

    if (ch === "p") {
      if (at(current + 1) === "h") {
        add("F");
        current += 2;
      } else {
        add("P");
        current++;
      }
      continue;
    }

    if (ch === "q") {
      add("K");
      current++;
      continue;
    }

    if (ch === "s") {
      if (at(current + 1) === "h") {
        add("X");
        current += 2;
      } else if (
        at(current + 1) === "i" &&
        (at(current + 2) === "o" || at(current + 2) === "a")
      ) {
        add("X");
        current += 3;
      } else {
        add("S");
        current++;
      }
      continue;
    }

    if (ch === "t") {
      if (
        at(current + 1) === "i" &&
        (at(current + 2) === "o" || at(current + 2) === "a")
      ) {
        add("X");
        current += 3;
      } else if (at(current + 1) === "h") {
        add("0");
        current += 2;
      } else {
        add("T");
        current++;
      }
      continue;
    }

    if (ch === "x") {
      add("KS");
      current++;
      continue;
    }

    if (ch === "z") {
      add("S");
      current++;
      continue;
    }

    if ("bfjlmnr".includes(ch)) {
      add(ch.toUpperCase());
      current++;
      continue;
    }

    if (ch === "v") {
      add("F");
      current++;
      continue;
    }

    if (ch === "w") {
      if (isVowel(at(current + 1))) add("W");
      current++;
      continue;
    }

    if (ch === "y") {
      if (current === 0) add("Y");
      current++;
      continue;
    }

    current++;
  }

  return primary.join("").slice(0, 4);
}
