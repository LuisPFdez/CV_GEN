/**
 * Clase abstracta que define los todos los errores del servidor
 */

export abstract class ErrorServidor extends Error {

    //Codigo de error para la respuesta del servidor
    codigo: number;

    constructor(msg: string = "No se ha encontrado el archivo", codigo: number = 500) {
        super(msg);
        this.name = "ErrorServidor";
        this.codigo = codigo;
    }

}