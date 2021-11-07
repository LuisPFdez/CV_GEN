/**
 * Error general para el servidor
*/

import { ErrorServidor } from "./ErrorServidor";

export class ErrorGeneral extends ErrorServidor {

    constructor(msg: string = "Error al ejecutar la sentencia", codigo: number = 500) {
        super(msg, codigo);
        this.name = "ErrorGeneral";
    }

}