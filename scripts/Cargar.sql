USE CV;
-- Cargar Adicional
INSERT INTO Adicional VALUES 
('AD1','Adicional 1','Ejemplo de adicional'),
('AD2','Adicional 2',NULL);

-- Cargar Datos
INSERT INTO Datos VALUES 
('APLL','Apellidos','Lorem ipsum'),
('CI','Ciudad','Madrid'),
('DIR','Dirección','C/Lorem ipsum dolor sit'),
('EJM','Ejemplo','Curriculum generado con datos de una base de datos'),
('EJM2','Ejemplo2:','Todos los datos son unicamente ejemplos'),
('EM','Email','lorem@email.com'),
('NOM','Nombre','Lorem'),
('Tel','Teléfono',' 622 32 21 32');

-- Cargar Experiencia
INSERT INTO Experiencia VALUES 
('Emp1','2021-10','2021-12','Empresa 1','Funcion empresa 1','Valladolid','https://google.es'),
('Emp2','2010-10-24','2014-2-21','Empresa 2','Funcion empresa 2','Zamora',NULL),('Emp3','2015-10','2019','Empresa 3','Funcion empresa 3',NULL,NULL),
('Emp4','2011','2012','Empresa 4',NULL,NULL,NULL);

-- Cargar Formacion
INSERT INTO Formacion VALUES 
('INST1','2021-3','2021-5','Titulo 1','IES 1','León','https://www.educa.jcyl.es/es'),
('INST2','2016-5-23','2019-5-3','Titulo 2','IES 1','León',NULL),
('INST3','2020','2021','Titulo 3','IES 2',NULL,NULL),
('INST4','2019','2019','Titulo 4','IES 2',NULL,NULL);

-- Cargar Habilidades
INSERT INTO Habilidades VALUES 
('HAB1','Primera Habilidad','Descripcion de habilidad'),
('HAB2','Segunda Habilidad',NULL),
('HAB3','Tercera Hablidad','Ejemplo');

--Cargar Idiomas
INSERT INTO Idiomas VALUES 
  ('ID1','Idioma 1','Nativo','Academia Idiomas'),
  ('ID2','Idioma 2','Alto',NULL),
  ('ID3','Idioma 3','50%',NULL);