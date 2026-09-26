import { sha256Hex, sha256Js } from "./sha256";

const vectors: [string, string][] = [
  [
    "",
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  ],
  [
    "abc",
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  ],
  [
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
  ],
  [
    "The quick brown fox jumps over the lazy dog",
    "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
  ],
  [
    "x".repeat(1000),
    "44f8354494a5ba03ba1792a8d3e9c534c47a9181980fde7a3f44b06ef2ae7c7f",
  ],
];

describe("sha256 helper", () => {
  it("sha256Js matches known vectors", () => {
    vectors.forEach(([input, expected]) => {
      expect(sha256Js(input)).toEqual(expected);
    });
  });

  it("sha256Hex matches known vectors", async () => {
    for (const [input, expected] of vectors) {
      await expect(sha256Hex(input)).resolves.toEqual(expected);
    }
  });

  it("sha256Hex agrees with sha256Js", async () => {
    const message = "salt:1234-secret";
    await expect(sha256Hex(message)).resolves.toEqual(sha256Js(message));
  });
});
