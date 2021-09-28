/**
 * Error para las conexiones de MySQL
*/

import { ErrorServidor } from "./ErrorServidor";

export class ErrorMysql extends ErrorServidor {

    constructor(msg: string = "Error al ejecutar la sentencia", codigo: number = 500) {
        super(msg, codigo);
        this.name = "MysqlError";
    }

}