interface ICriarServicoDto {
  nome: string;
}

export const CriarServico = async (data: ICriarServicoDto) => {
  try {
    //TODO: Fazer a chamada para o serviço de criação de serviço

    //TODO: Tratar a resposta do serviço de criação de serviço
    if (false) {
      throw new Error("Falha ao criar serviço. Verifique os dados.");
    }
  } catch (error) {
    throw error;
  }
};
