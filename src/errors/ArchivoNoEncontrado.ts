/**
 * Error para las plantillas que no se encuentran
 */
export class ArchivoNoEncontrado extends Error {

    constructor(msg: string = "No se ha encontrado el archivo") {
        super(msg);
        this.name = "ArchivoNoEncontrado";
    }

}