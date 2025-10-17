interface IFormValues {
  email: string;
  password: string;
}

export const Login = async (data: IFormValues) => {
  try {
    //TODO: Fazer a chamada para o serviço de autenticação

    //TODO: Tratar a resposta do serviço de autenticação
    if (false) {
      throw new Error("Falha ao fazer login. Verifique suas credenciais.");
    }

    //TODO: Adicionar lógica para armazenar o token de autenticação
  } catch (error) {
    throw error;
  }
};
