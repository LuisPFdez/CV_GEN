/**
 * Error para las plantillas que no se encuentran
 */

import { CODIGOS_ESTADO } from "../controller/config";
import { ErrorServidor } from "./ErrorServidor";

export class ArchivoNoEncontrado extends ErrorServidor {

    constructor(msg: string = "No se ha encontrado el archivo", codigo: CODIGOS_ESTADO = CODIGOS_ESTADO.Internal_Server_Error) {
        super(msg, codigo);
        this.name = "ArchivoNoEncontrado";
    }

}