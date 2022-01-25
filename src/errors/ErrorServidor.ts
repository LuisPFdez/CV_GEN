/**
 * Clase abstracta que define los todos los errores del servidor
 */

import { CODIGOS_ESTADO } from "../config/config";

export abstract class ErrorServidor extends Error {

    //Codigo de error para la respuesta del servidor
    codigo: number;

    constructor(msg: string = "No se ha encontrado el archivo", codigo: CODIGOS_ESTADO = CODIGOS_ESTADO.Internal_Server_Error) {
        super(msg);
        this.name = "ErrorServidor";
        this.codigo = codigo;
    }

}