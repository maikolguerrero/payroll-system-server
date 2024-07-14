import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conexión a MongoDB establecida');

    // Añadir manejadores de eventos
    mongoose.connection.on('connected', () => {
      console.log('Mongoose conectado a la base de datos');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Error de conexión de Mongoose: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose desconectado de la base de datos');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexión de Mongoose cerrada debido a la terminación de la aplicación');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;