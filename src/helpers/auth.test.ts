import { AUTH_STORAGE_KEY } from "../constants";
import {
  createAuthRecord,
  generateRecoveryKey,
  generateSalt,
  getAuthRecord,
  getPinError,
  hasAuthRecord,
  normalizeRecoveryKey,
  updatePin,
  verifyPin,
  verifyRecoveryKey,
} from "./auth";

describe("auth helper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generateSalt returns 32 hex chars and is unique", () => {
    const salt = generateSalt();

    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(generateSalt()).not.toEqual(salt);
  });

  it("generateRecoveryKey returns grouped uppercase key", () => {
    const key = generateRecoveryKey();

    expect(key).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(key.replace(/-/g, "")).toHaveLength(12);
    expect(generateRecoveryKey()).not.toEqual(key);
  });

  it("normalizeRecoveryKey strips separators and uppercases", () => {
    expect(normalizeRecoveryKey("abcd-efgh-jk23")).toEqual("ABCDEFGHJK23");
  });

  describe("getPinError", () => {
    it("accepts valid pins", () => {
      expect(getPinError("1234")).toBeNull();
      expect(getPinError("12345678")).toBeNull();
    });

    it("rejects invalid pins", () => {
      expect(getPinError("")).toEqual("PIN must contain digits only");
      expect(getPinError("12a4")).toEqual("PIN must contain digits only");
      expect(getPinError("123")).toEqual("PIN must be at least 4 digits");
      expect(getPinError("123456789")).toEqual("PIN must be at most 8 digits");
      expect(getPinError("0123")).toEqual("PIN cannot start with 0");
    });
  });

  describe("auth record", () => {
    it("createAuthRecord stores a hashed record, never the plain secrets", async () => {
      const record = await createAuthRecord("1234", "ABCD-EFGH-JK23");

      expect(hasAuthRecord()).toBe(true);
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || "";
      expect(stored).not.toContain("1234");
      expect(stored).not.toContain("ABCDEFGHJK23");
      expect(getAuthRecord()).toEqual(record);
    });

    it("verifyPin accepts the correct pin and rejects wrong ones", async () => {
      await createAuthRecord("1234", "ABCD-EFGH-JK23");

      await expect(verifyPin("1234")).resolves.toBe(true);
      await expect(verifyPin("4321")).resolves.toBe(false);
      await expect(verifyPin("")).resolves.toBe(false);
    });

    it("verifyPin returns false without a record", async () => {
      await expect(verifyPin("1234")).resolves.toBe(false);
    });

    it("verifyRecoveryKey accepts the key in any formatting", async () => {
      await createAuthRecord("1234", "ABCD-EFGH-JK23");

      await expect(verifyRecoveryKey("ABCD-EFGH-JK23")).resolves.toBe(true);
      await expect(verifyRecoveryKey("abcdefghjk23")).resolves.toBe(true);
      await expect(verifyRecoveryKey("ABCD EFGH JK23")).resolves.toBe(true);
      await expect(verifyRecoveryKey("WRONG-KEY-1234")).resolves.toBe(false);
    });

    it("updatePin replaces the pin but keeps recovery working", async () => {
      await createAuthRecord("1234", "ABCD-EFGH-JK23");
      await updatePin("9876");

      await expect(verifyPin("1234")).resolves.toBe(false);
      await expect(verifyPin("9876")).resolves.toBe(true);
      await expect(verifyRecoveryKey("ABCD-EFGH-JK23")).resolves.toBe(true);
    });

    it("updatePin throws without a record", async () => {
      await expect(updatePin("9876")).rejects.toThrow("No auth record found");
    });

    it("corrupted record is treated as missing", () => {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ pinSalt: "x" }));

      expect(getAuthRecord()).toBeNull();
      expect(hasAuthRecord()).toBe(false);
    });
  });
});
