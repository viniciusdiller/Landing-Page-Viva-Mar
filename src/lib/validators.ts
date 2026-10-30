/**
 * Utilitários de validação e sanitização estrita no backend (Zero-Trust).
 */

export function sanitizeString(value: unknown, maxLength = 255): string {
  if (typeof value !== "string") {
    return "";
  }
  const noControl = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const noHtml = noControl.replace(/<[^>]*>?/gm, "");
  return noHtml.trim().slice(0, maxLength);
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 6 || trimmed.length > 120) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function isValidCpf(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== Number(digits[10])) {
    return false;
  }

  return true;
}

export function isValidPhone(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidDateString(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return false;

  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export interface ValidatedBookingResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

export function validateBookingPayload(raw: unknown): ValidatedBookingResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Dados de reserva inválidos ou ausentes." };
  }

  const booking = raw as Record<string, any>;

  const roomId = sanitizeString(booking.roomId, 64);
  if (!roomId || !/^[a-zA-Z0-9_\-]+$/.test(roomId)) {
    return { valid: false, error: "Identificador de acomodação inválido." };
  }

  const roomName = sanitizeString(booking.roomName, 100) || "Acomodação Viva Mar";

  if (!isValidDateString(booking.checkIn)) {
    return { valid: false, error: "Data de check-in inválida." };
  }
  if (!isValidDateString(booking.checkOut)) {
    return { valid: false, error: "Data de check-out inválida." };
  }

  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  if (checkOutDate <= checkInDate) {
    return { valid: false, error: "Data de check-out deve ser posterior ao check-in." };
  }

  const guests = Number(booking.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    return { valid: false, error: "Número de hóspedes inválido." };
  }

  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000);
  if (!Number.isInteger(nights) || nights < 1 || nights > 365) {
    return { valid: false, error: "Número de noites inválido." };
  }

  const guest = booking.guest;
  if (!guest || typeof guest !== "object") {
    return { valid: false, error: "Dados do hóspede ausentes." };
  }

  const firstName = sanitizeString(guest.firstName, 80);
  if (!firstName || firstName.length < 2) {
    return { valid: false, error: "Nome do hóspede é obrigatório (mínimo 2 caracteres)." };
  }

  const lastName = sanitizeString(guest.lastName, 80);
  if (!lastName || lastName.length < 2) {
    return { valid: false, error: "Sobrenome do hóspede é obrigatório (mínimo 2 caracteres)." };
  }

  const email = typeof guest.email === "string" ? guest.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return { valid: false, error: "E-mail do hóspede inválido." };
  }

  const phone = sanitizeString(guest.phone, 30);
  if (!phone || !isValidPhone(phone)) {
    return { valid: false, error: "Telefone do hóspede inválido. Informe com DDD." };
  }

  let cpf: string | undefined = undefined;
  if (!guest.cpf) return { valid: false, error: "Informe o CPF do titular." };
  if (guest.cpf) {
    const rawCpf = String(guest.cpf);
    if (!isValidCpf(rawCpf)) {
      return { valid: false, error: "CPF informado é inválido." };
    }
    cpf = rawCpf.replace(/\D/g, "");
  }

  const packages = Array.isArray(booking.packages)
    ? booking.packages
        .filter((pkg: any) => pkg && typeof pkg === "object")
        .map((pkg: any) => ({
          id: sanitizeString(pkg.id, 64),
          name: sanitizeString(pkg.name, 100),
          quantity: Math.max(0, Math.floor(Number(pkg.quantity) || 0)),
          price: Math.max(0, Number(pkg.price) || 0),
        }))
    : [];

  if (!Number.isFinite(Number(booking.total)) || Number(booking.total) <= 0) return { valid: false, error: 'Valor total inválido.' };
  if (packages.length > 20 || packages.some((pkg: any) => !pkg.id || !Number.isFinite(pkg.quantity) || pkg.quantity > 100)) return { valid: false, error: 'Adicionais inválidos.' };
  const sanitized = {
    ...booking,
    roomId,
    roomName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests,
    nights,
    discountCode: booking.discountCode ? sanitizeString(booking.discountCode, 30) : undefined,
    packages,
    guest: {
      firstName,
      lastName,
      email,
      phone,
      cpf,
      cep: guest.cep ? sanitizeString(guest.cep, 15) : undefined,
      address: guest.address ? sanitizeString(guest.address, 150) : undefined,
      addressNumber: guest.addressNumber ? sanitizeString(guest.addressNumber, 20) : undefined,
      addressComplement: guest.addressComplement ? sanitizeString(guest.addressComplement, 50) : undefined,
      neighborhood: guest.neighborhood ? sanitizeString(guest.neighborhood, 80) : undefined,
      city: guest.city ? sanitizeString(guest.city, 80) : undefined,
      state: guest.state ? sanitizeString(guest.state, 10) : undefined,
      specialRequests: guest.specialRequests ? sanitizeString(guest.specialRequests, 500) : undefined,
    },
  };

  return { valid: true, sanitized };
}


