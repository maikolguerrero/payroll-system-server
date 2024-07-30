# payroll-system-server
Este repositorio contiene el código fuente del backend para un sistema de nómina adaptable, desarrollado utilizando las mejores prácticas y estándares de desarrollo de software.

## Características
- Gestión de nóminas, empleados, departamentos, cargos, percepciones, deducciones, asistencias, bancos, cuentas bancarias, empresa, usuarios, y generación de txt.
- Operaciones CRUD completas para todas las entidades.
- Almacenamiento persistente utilizando MongoDB.
- Endpoints para todas las operaciones.
- Uso de JWT y bcrypt para la auntenticación.

## Tecnologías utilizadas
- Node.js
- Express.js
- MongoDB
- JWT y bcrypt

## Instalación
- **1.** Clona el repositorio:
```
git clone https://github.com/maikolguerrero/payroll-system-server.git
```
- **2.**  Ingresa al directorio del proyecto:
```
cd payroll-system-server
```
- **3.**  Instala las dependencias:
```
npm install
```
- **4.** Configura las variables de entorno en un archivo `.env`. Puedes basarte en el archivo `.env.example` proporcionado.


## Uso
- **1.** Ejecuta la aplicación: 
```
npm start
```
- **2.**  El servidor estará escuchando en el puerto `3000`.

**Nota:**  Debes tener instalado y dejar ejecutando MongoDB si lo vas a usar de manera local y no como servicio en la nube.
