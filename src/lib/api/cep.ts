export interface CepAddress {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Busca o endereço a partir de um CEP usando o ViaCEP (serviço público,
 * gratuito, sem autenticação). Retorna null se o CEP for inválido ou não
 * for encontrado.
 */
export async function fetchAddressByCep(cep: string): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");

  if (digits.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.erro) {
    return null;
  }

  return {
    address: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}
