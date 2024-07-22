import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { format } from 'date-fns'; // Importar la función format de date-fns
import Payroll from '../models/payroll.model.js';
import BankAccount from '../models/bank.account.model.js';
import Bank from '../models/bank.model.js';
import Company from '../models/company.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generatePayrollTXT = async (req, res) => {
  const { bank_id, start_date, end_date } = req.body;

  if (!bank_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Banco, fecha de inicio y fecha de fin son obligatorias.' });
  }

  try {
    const bank = await Bank.findById(bank_id);
    if (!bank) {
      return res.status(404).json({ error: 'Banco no encontrado.' });
    }

    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const payrolls = await Payroll.find({
      state: 'Generada',
      start_date: { $gte: new Date(start_date) },
      end_date: { $lte: new Date(end_date) }
    }).populate('employee_id');

    if (payrolls.length === 0) {
      return res.status(404).json({ error: 'No se encontraron nóminas generadas en el rango de fechas proporcionado.' });
    }

    const today = new Date();

    // Obtener la fecha actual y formatearla con date-fns
    const todayDate = format(today, 'yyyyMMdd');

    // Crear el contenido del archivo con formato CSV
    let fileContent = `${bank.code};${todayDate}\n`;

    // Usar el código del banco y la fecha formateada para el nombre del archivo
    const fileName = `${bank.code}_${todayDate}.txt`;
    const filePath = path.join(__dirname, '../exports', fileName);


    const formattedDate = format(today, 'yyyy-MM-dd');

    for (const payroll of payrolls) {
      const employee = payroll.employee_id;
      const bankAccount = await BankAccount.findOne({ employee_id: employee._id, bank_id });

      if (bankAccount) {
        fileContent += `${employee.ci};${employee.name} ${employee.surnames};${bankAccount.account_number};${bankAccount.account_type};${payroll.net_salary};Pago Nomina\n`;

        payroll.state = 'Pagada';
        payroll.payment_date = formattedDate; // Actualiza la fecha de pago
        // Actualiza el archivo de nómina con la ruta correcta
        payroll.filePath = path.join(fileName);
        await payroll.save();
      }
    }

    // Verifica que el directorio exista
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Genera el archivo
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        console.error('Error al escribir el archivo:', err);
        return res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + err.message });
      }

      // res.download(filePath, fileName, (err) => {
      //   if (err) {
      //     console.error('Error al descargar el archivo:', err);
      //     return res.status(500).json({ error: 'Error al descargar el archivo de nómina.' });
      //   }
      // });
      return res.status(200).json({ message: 'Archivo TXT generado con éxito.', fileName });
      // res.status(200).json({ fileUrl: `/exports/${fileName}` });
    });
  } catch (error) {
    console.error('Error al generar el archivo de nómina:', error);
    res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + error.message });
  }
};

export default { generatePayrollTXT };


// const generatePayrollTXT = async (req, res) => {
//   const { bank_id, start_date, end_date } = req.body;

//   if (!bank_id || !start_date || !end_date) {
//     return res.status(400).json({ error: 'Banco, fecha de inicio y fecha de fin son obligatorias.' });
//   }

//   try {
//     const bank = await Bank.findById(bank_id);
//     if (!bank) {
//       return res.status(404).json({ error: 'Banco no encontrado.' });
//     }

//     const company = await Company.findOne();
//     if (!company) {
//       return res.status(404).json({ error: 'Empresa no encontrada.' });
//     }

//     const payrolls = await Payroll.find({
//       state: 'Generada',
//       start_date: { $gte: new Date(start_date) },
//       end_date: { $lte: new Date(end_date) }
//     }).populate('employee_id');

//     if (payrolls.length === 0) {
//       return res.status(404).json({ error: 'No se encontraron nóminas generadas en el rango de fechas proporcionado.' });
//     }

//     const today = new Date();
//     const todayDate = format(today, 'yyyyMMdd');
//     let fileContent = `${bank.code};${todayDate}\n`;
//     const fileName = `${bank.code}_${todayDate}.txt`;
//     const filePath = path.join(__dirname, '../exports', fileName);
//     const formattedDate = format(today, 'yyyy-MM-dd');

//     for (const payroll of payrolls) {
//       const employee = payroll.employee_id;
//       const bankAccount = await BankAccount.findOne({ employee_id: employee._id, bank_id });

//       if (bankAccount) {
//         fileContent += `${employee.ci};${employee.name} ${employee.surnames};${bankAccount.account_number};${bankAccount.account_type};${payroll.net_salary};Pago Nomina\n`;
//         payroll.state = 'Pagada';
//         payroll.payment_date = formattedDate;
//         payroll.filePath = path.join(fileName);
//         await payroll.save();
//       }
//     }

//     if (!fs.existsSync(path.dirname(filePath))) {
//       fs.mkdirSync(path.dirname(filePath), { recursive: true });
//     }

//     fs.writeFile(filePath, fileContent, (err) => {
//       if (err) {
//         console.error('Error al escribir el archivo:', err);
//         return res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + err.message });
//       }

//       res.status(200).json({ message: 'Archivo TXT generado con éxito.', filePath, fileName });
//     });
//   } catch (error) {
//     console.error('Error al generar el archivo de nómina:', error);
//     res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + error.message });
//   }
// };

// export default { generatePayrollTXT };





// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { format } from 'date-fns';
// import Bank from '../models/Bank.js';
// import Company from '../models/Company.js';
// import Payroll from '../models/Payroll.js';
// import BankAccount from '../models/BankAccount.js';

// // Obtener el directorio actual
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const generatePayrollTXT = async (req, res) => {
//   const { bank_id, start_date, end_date } = req.body;

//   if (!bank_id || !start_date || !end_date) {
//     return res.status(400).json({ error: 'Banco, fecha de inicio y fecha de fin son obligatorias.' });
//   }

//   try {
//     const bank = await Bank.findById(bank_id);
//     if (!bank) {
//       return res.status(404).json({ error: 'Banco no encontrado.' });
//     }

//     const company = await Company.findOne();
//     if (!company) {
//       return res.status(404).json({ error: 'Empresa no encontrada.' });
//     }

//     const payrolls = await Payroll.find({
//       state: 'Generada',
//       start_date: { $gte: new Date(start_date) },
//       end_date: { $lte: new Date(end_date) }
//     }).populate('employee_id');

//     if (payrolls.length === 0) {
//       return res.status(404).json({ error: 'No se encontraron nóminas generadas en el rango de fechas proporcionado.' });
//     }

//     const today = new Date();
//     const todayDate = format(today, 'yyyyMMdd');
//     let fileContent = `${bank.code};${todayDate}\n`;
//     const fileName = `${bank.code}_${todayDate}.txt`;
//     const filePath = path.join(__dirname, '../exports', fileName);
//     const formattedDate = format(today, 'yyyy-MM-dd');

//     for (const payroll of payrolls) {
//       const employee = payroll.employee_id;
//       const bankAccount = await BankAccount.findOne({ employee_id: employee._id, bank_id });

//       if (bankAccount) {
//         fileContent += `${employee.ci};${employee.name} ${employee.surnames};${bankAccount.account_number};${bankAccount.account_type};${payroll.net_salary};Pago Nomina\n`;
//         payroll.state = 'Pagada';
//         payroll.payment_date = formattedDate;
//         payroll.filePath = path.join(fileName);
//         await payroll.save();
//       }
//     }

//     if (!fs.existsSync(path.dirname(filePath))) {
//       fs.mkdirSync(path.dirname(filePath), { recursive: true });
//     }

//     fs.writeFile(filePath, fileContent, (err) => {
//       if (err) {
//         console.error('Error al escribir el archivo:', err);
//         return res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + err.message });
//       }

//       res.download(filePath, fileName, (err) => {
//         if (err) {
//           console.error('Error al descargar el archivo:', err);
//           return res.status(500).json({ error: 'Error al descargar el archivo de nómina.' });
//         }
//       });
//     });
//   } catch (error) {
//     console.error('Error al generar el archivo de nómina:', error);
//     res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + error.message });
//   }
// };

// export default { generatePayrollTXT };


// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { format } from 'date-fns';
// import Bank from '../models/Bank.js';
// import Company from '../models/Company.js';
// import Payroll from '../models/Payroll.js';
// import BankAccount from '../models/BankAccount.js';

// // Obtener el directorio actual
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const generatePayrollTXT = async (req, res) => {
//   const { bank_id, start_date, end_date } = req.body;

//   if (!bank_id || !start_date || !end_date) {
//     return res.status(400).json({ error: 'Banco, fecha de inicio y fecha de fin son obligatorias.' });
//   }

//   try {
//     const bank = await Bank.findById(bank_id);
//     if (!bank) {
//       return res.status(404).json({ error: 'Banco no encontrado.' });
//     }

//     const company = await Company.findOne();
//     if (!company) {
//       return res.status(404).json({ error: 'Empresa no encontrada.' });
//     }

//     const payrolls = await Payroll.find({
//       state: 'Generada',
//       start_date: { $gte: new Date(start_date) },
//       end_date: { $lte: new Date(end_date) }
//     }).populate('employee_id');

//     if (payrolls.length === 0) {
//       return res.status(404).json({ error: 'No se encontraron nóminas generadas en el rango de fechas proporcionado.' });
//     }

//     const today = new Date();
//     const todayDate = format(today, 'yyyyMMdd');
//     let fileContent = `${bank.code};${todayDate}\n`;
//     const fileName = `${bank.code}_${todayDate}.txt`;
//     const filePath = path.join(__dirname, '../exports', fileName);
//     const formattedDate = format(today, 'yyyy-MM-dd');

//     for (const payroll of payrolls) {
//       const employee = payroll.employee_id;
//       const bankAccount = await BankAccount.findOne({ employee_id: employee._id, bank_id });

//       if (bankAccount) {
//         fileContent += `${employee.ci};${employee.name} ${employee.surnames};${bankAccount.account_number};${bankAccount.account_type};${payroll.net_salary};Pago Nomina\n`;
//         payroll.state = 'Pagada';
//         payroll.payment_date = formattedDate;
//         payroll.filePath = fileName; // Solo el nombre del archivo
//         await payroll.save();
//       }
//     }

//     if (!fs.existsSync(path.dirname(filePath))) {
//       fs.mkdirSync(path.dirname(filePath), { recursive: true });
//     }

//     fs.writeFile(filePath, fileContent, (err) => {
//       if (err) {
//         console.error('Error al escribir el archivo:', err);
//         return res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + err.message });
//       }

//       // Devuelve la URL del archivo para que el frontend pueda descargarlo
//       res.json({ fileUrl: `/exports/${fileName}` });
//     });
//   } catch (error) {
//     console.error('Error al generar el archivo de nómina:', error);
//     res.status(500).json({ error: 'Error al generar el archivo de nómina: ' + error.message });
//   }
// };

// export default { generatePayrollTXT };
