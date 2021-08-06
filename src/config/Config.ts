import { ConnectionConfig } from "mysql";

/**
 * 
 */
export const DB_CONFIG: ConnectionConfig = {
    database: process.env.DB_DATABASE || "CV",
    user: process.env.DB_USER         || "user",
    password: process.env.DB_PASSWORD || "password",
    host: process.env.DB_HOST         || "localhost"
}