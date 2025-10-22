interface ICriarSedeDto {
  nome: string;
}

export const CriarSede = async (data: ICriarSedeDto) => {
  try {
    //TODO: Fazer a chamada para o sede de criação de sede

    //TODO: Tratar a resposta do sede de criação de sede
    if (false) {
      throw new Error("Falha ao criar sede. Verifique os dados.");
    }
  } catch (error) {
    throw error;
  }
};
