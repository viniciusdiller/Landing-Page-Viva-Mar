function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCPF(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskCEP(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskCpfOrEmail(value: string): string {
  if (!value) return "";
  const clean = value.replace(/\s+/g, "");

  // Enquanto não houver letras ou "@" (apenas dígitos, pontos e traços),
  // aplica estritamente a máscara de CPF (000.000.000-00, limitado a 11 dígitos).
  if (!/[a-zA-Z@_]/.test(clean)) {
    return maskCPF(clean);
  }

  // Se o usuário digitou letra ou "@", trata como e-mail e desfaz
  // pontos/traços que a máscara de CPF tenha inserido nos dígitos iniciais.
  const [, head, rest] = clean.match(/^([\d.-]*)([\s\S]*)$/) ?? ["", "", clean];
  const digits = onlyDigits(head);
  const isOurMask = digits.length <= 11 && head === maskCPF(digits);
  return ((isOurMask ? digits : head) + rest).toLowerCase();
}

export function maskReservationCode(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();

  // Preserva identificadores técnicos legados caso o hóspede cole do comprovante
  if (/^(mp_|manual_)/i.test(trimmed)) {
    return trimmed;
  }

  const clean = trimmed.toUpperCase().replace(/\s+/g, "");

  // Usuário digitando as primeiras letras do prefixo
  if (clean === "V" || clean === "VI" || clean === "VIV" || clean === "VIVA") {
    return clean;
  }

  // Padrão VIVA- com dígitos
  const vivaMatch = clean.match(/^VIVA[-_]?(\d*)$/);
  if (vivaMatch) {
    const digits = vivaMatch[1].slice(0, 10);
    return digits ? `VIVA-${digits}` : "VIVA-";
  }

  // Se são apenas dígitos digitados pelo hóspede, formata automaticamente
  if (/^\d+$/.test(clean)) {
    return `VIVA-${clean.slice(0, 10)}`;
  }

  // Fallback seguro alfanumérico
  return clean.replace(/[^A-Z0-9#_\-]/g, "").slice(0, 25);
}

export function formatDisplayReservationCode(
  displayCode?: string | null,
  reservationId?: string | number | null,
  id?: number | string | null
): string {
  if (displayCode && displayCode.trim()) {
    return displayCode.trim().toUpperCase();
  }
  if (id && /^\d+$/.test(String(id))) {
    return `VIVA-${id}`;
  }
  const str = String(reservationId || "").trim();
  if (str.toUpperCase().startsWith("VIVA-")) {
    return str.toUpperCase();
  }
  if (id) {
    return `VIVA-${id}`;
  }
  return str || "VIVA";
}
