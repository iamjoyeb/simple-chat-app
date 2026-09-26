import { AUTH_STORAGE_KEY } from "../constants";
import { getLocalStorage, setLocalStorage } from "./localStorage";
import { sha256Hex } from "./sha256";

export interface IAuthRecord {
  pinSalt: string;
  pinHash: string;
  recoverySalt: string;
  recoveryHash: string;
}

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;
const RECOVERY_KEY_LENGTH = 12;
const RECOVERY_KEY_GROUP = 4;
const SALT_LENGTH = 16;
const RECOVERY_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(bytes);
    return bytes;
  }

  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

const isAuthRecord = (value: any): value is IAuthRecord =>
  !!value &&
  typeof value.pinSalt === "string" &&
  typeof value.pinHash === "string" &&
  typeof value.recoverySalt === "string" &&
  typeof value.recoveryHash === "string";

const hashSecret = (salt: string, secret: string) =>
  sha256Hex(`${salt}:${secret}`);

export const normalizeRecoveryKey = (recoveryKey: string) =>
  recoveryKey.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const generateSalt = () => bytesToHex(randomBytes(SALT_LENGTH));

export const generateRecoveryKey = () => {
  const bytes = randomBytes(RECOVERY_KEY_LENGTH);
  let key = "";

  for (let i = 0; i < RECOVERY_KEY_LENGTH; i++) {
    key += RECOVERY_CHARSET[bytes[i] % RECOVERY_CHARSET.length];
  }

  return [
    key.slice(0, RECOVERY_KEY_GROUP),
    key.slice(RECOVERY_KEY_GROUP, RECOVERY_KEY_GROUP * 2),
    key.slice(RECOVERY_KEY_GROUP * 2),
  ].join("-");
};

export const getPinError = (pin: string): string | null => {
  if (!/^\d+$/.test(pin)) {
    return "PIN must contain digits only";
  }
  if (pin.length < PIN_MIN_LENGTH) {
    return `PIN must be at least ${PIN_MIN_LENGTH} digits`;
  }
  if (pin.length > PIN_MAX_LENGTH) {
    return `PIN must be at most ${PIN_MAX_LENGTH} digits`;
  }
  if (pin.startsWith("0")) {
    return "PIN cannot start with 0";
  }
  return null;
};

export const getAuthRecord = (): IAuthRecord | null => {
  const record = getLocalStorage(AUTH_STORAGE_KEY);
  return isAuthRecord(record) ? record : null;
};

export const hasAuthRecord = () => getAuthRecord() !== null;

export const setAuthRecord = (record: IAuthRecord) =>
  setLocalStorage(AUTH_STORAGE_KEY, record);

export const createAuthRecord = async (
  pin: string,
  recoveryKey: string
): Promise<IAuthRecord> => {
  const pinSalt = generateSalt();
  const recoverySalt = generateSalt();
  const record: IAuthRecord = {
    pinSalt,
    pinHash: await hashSecret(pinSalt, pin),
    recoverySalt,
    recoveryHash: await hashSecret(
      recoverySalt,
      normalizeRecoveryKey(recoveryKey)
    ),
  };

  setAuthRecord(record);
  return record;
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const record = getAuthRecord();

  if (!record) {
    return false;
  }

  return (await hashSecret(record.pinSalt, pin)) === record.pinHash;
};

export const verifyRecoveryKey = async (
  recoveryKey: string
): Promise<boolean> => {
  const record = getAuthRecord();

  if (!record) {
    return false;
  }

  return (
    (await hashSecret(record.recoverySalt, normalizeRecoveryKey(recoveryKey))) ===
    record.recoveryHash
  );
};

export const updatePin = async (pin: string): Promise<void> => {
  const record = getAuthRecord();

  if (!record) {
    throw new Error("No auth record found");
  }

  const pinSalt = generateSalt();
  setAuthRecord({
    ...record,
    pinSalt,
    pinHash: await hashSecret(pinSalt, pin),
  });
};
