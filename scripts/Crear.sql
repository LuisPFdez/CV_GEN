+-- Crea la base de datos
CREATE DATABASE IF NOT EXISTS CV;

-- Crea el usuario
CREATE USER IF NOT EXISTS 'NOMBRE_USUARIO'@'%' IDENTIFIED WITH mysql_native_password BY 'CONTRASEÑA';
-- Permisos del Usuario
GRANT ALL ON CV.* TO 'NOMBRE_USUARIO'@'%';


USE CV;

-- Crea la tabla Adicional
CREATE TABLE IF NOT EXISTS Adicional (
  ID varchar(20) NOT NULL,
  Nombre varchar(25) NOT NULL UNIQUE,
  Descripcion varchar(75) DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB; 

-- Crea la tabla Datos
CREATE TABLE IF NOT EXISTS Datos (
  ID varchar(20) NOT NULL,
  Nombre varchar(25) NOT NULL UNIQUE,
  Descripcion varchar(75) NOT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB; 

-- Crea la tabla Experiencia
CREATE TABLE IF NOT EXISTS Experiencia (
  ID varchar(20) NOT NULL,
  Fecha_inicial varchar(15) NOT NULL,
  Fecha_fin varchar(15) NOT NULL,
  Empresa varchar(50) NOT NULL,
  Funcion varchar(50) DEFAULT NULL,
  Ciudad varchar(50) DEFAULT NULL,
  Link varchar(100) DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB; 

-- Crea la tabla Formacion
CREATE TABLE Formacion (
  ID varchar(20) NOT NULL,
  Fecha_inicial varchar(15) NOT NULL,
  Fecha_fin varchar(15) NOT NULL,
  Titulo varchar(50) NOT NULL UNIQUE,
  Centro varchar(50) NOT NULL,
  Ciudad varchar(50) DEFAULT NULL,
  Link varchar(100) DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB; 

-- Crea la tabla Habilidades
CREATE TABLE IF NOT EXISTS Habilidades (
  ID varchar(20) NOT NULL,
  Nombre varchar(50) NOT NULL UNIQUE,
  Descripcion varchar(75) DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB; 

-- Crea la tabla Idiomas
CREATE TABLE IF NOT EXISTS Idiomas (
  ID varchar(20) NOT NULL,
  Idioma varchar(20) DEFAULT NULL UNIQUE,
  Nivel varchar(10) NOT NULL,
  Centro varchar(50) DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Tokens (
  Token varchar(64) NOT NULL,
  PRIMARY KEY (Token)
) ENGINE=InnoDB;