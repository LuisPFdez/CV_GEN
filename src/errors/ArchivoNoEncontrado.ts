/**
 * Error para las plantillas que no se encuentran
 */

import { ErrorServidor } from "./ErrorServidor";

export class ArchivoNoEncontrado extends ErrorServidor {

    constructor(msg: string = "No se ha encontrado el archivo", codigo: number = 500) {
        super(msg, codigo);
        this.name = "ArchivoNoEncontrado";
    }

}