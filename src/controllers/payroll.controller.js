import Payroll from '../models/payroll.model.js';
import Employee from '../models/employee.model.js';
import Department from '../models/department.model.js';
import Position from '../models/position.model.js';
import Attendance from '../models/attendance.model.js';
import Deduction from '../models/deduction.model.js';
import Perception from '../models/perception.model.js';
import { parseISO, eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale'; // Importar la configuración regional en español

async function checkOverlappingPayrolls(employee_id, start_date, end_date, exclude_payroll_id = null) {
  const query = {
    employee_id,
    $or: [
      {
        start_date: { $lte: new Date(end_date) },
        end_date: { $gte: new Date(start_date) }
      }
    ]
  };

  if (exclude_payroll_id) {
    query._id = { $ne: exclude_payroll_id };
  }

  const overlappingPayrolls = await Payroll.find(query);
  console.log('Nóminas superpuestas encontradas:', overlappingPayrolls.length);
  return overlappingPayrolls.length > 0;
}


// Método auxiliar para generar nóminas
async function generatePayrollForEmployees(employees, { period, start_date, end_date, payment_date, deductions, perceptions }) {
  const payrolls = [];

  // Obtener las deducciones y percepciones desde la base de datos
  const selectedDeductions = await Deduction.find({ _id: { $in: deductions } });
  const selectedPerceptions = await Perception.find({ _id: { $in: perceptions } });

  for (const employee of employees) {
    // Obtener detalles del puesto del empleado
    const position = employee.position || {};
    const dailyHours = position.daily_hours || 8;
    const workDays = position.work_days || ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']; // Por defecto, días laborales

    // Obtener las asistencias del empleado en el período especificado
    const attendances = await Attendance.find({
      employee_id: employee._id,
      date: { $gte: new Date(start_date), $lte: new Date(end_date) }
    });

    let totalHoursWorked = 0;
    attendances.forEach(attendance => {
      const entryTime = new Date(attendance.entry_time);
      const exitTime = new Date(attendance.exit_time);
      const hoursWorked = (exitTime - entryTime) / (1000 * 60 * 60); // Convertir milisegundos a horas
      totalHoursWorked += hoursWorked;
    });

    // Calcular el total de horas estándar en el período basado en los días laborales
    let totalStandardHours = 0;
    let totalDays = 0;

    const start = parseISO(start_date);
    const end = parseISO(end_date);

    eachDayOfInterval({ start, end }).forEach(date => {
      const dayOfWeek = format(date, 'eeee', { locale: es }).toLowerCase(); // Obtener el día en español
      if (workDays.includes(dayOfWeek)) {
        totalStandardHours += dailyHours;
        totalDays++;
      }
    });

    // Calcular las horas extras
    const overtime_hours = Math.max(totalHoursWorked - totalStandardHours, 0);

    // Calcular las deducciones y percepciones
    let totalDeductions = 0;
    let totalPerceptions = 0;

    selectedDeductions.forEach(deduction => {
      totalDeductions += deduction.amount || 0; // Valor por defecto en caso de ser undefined
    });

    selectedPerceptions.forEach(perception => {
      totalPerceptions += perception.amount || 0; // Valor por defecto en caso de ser undefined
    });

    // Calcular el salario bruto
    const base_salary = employee.base_salary || 0;

    // Calcular el ajuste del salario por horas no trabajadas
    const totalExpectedHours = totalStandardHours; // Total de horas estándar esperadas en el período
    const actualWorkedHours = totalHoursWorked;
    const salaryAdjustment = (totalExpectedHours - actualWorkedHours) * (base_salary / totalExpectedHours);

    // Aplicar el ajuste al salario bruto
    const gross_salary = base_salary + (overtime_hours * (base_salary / totalStandardHours) + totalPerceptions); // Salario base + horas extras + percepciones

    const adjusted_gross_salary = totalHoursWorked === 0 ? 0 : gross_salary - salaryAdjustment;

    // Calcular el salario neto
    const net_salary = adjusted_gross_salary - totalDeductions;

    // Asegurarse de que los valores no sean NaN antes de crear la nómina
    if (isNaN(net_salary) || isNaN(adjusted_gross_salary)) {
      console.error(`Error al calcular salarios: net_salary=${net_salary}, adjusted_gross_salary=${adjusted_gross_salary}`);
      continue; // Saltar al siguiente empleado
    }

    // Crear un nuevo documento de nómina
    const newPayroll = new Payroll({
      employee_id: employee._id,
      period,
      start_date,
      end_date,
      payment_date,
      base_salary,
      overtime_hours,
      deductions: deductions,
      perceptions: perceptions,
      net_salary,
      gross_salary: adjusted_gross_salary,
      state: 'Generada'
    });

    // await newPayroll.save();
    payrolls.push(newPayroll);
  }

  return payrolls;
}

class PayrollController {
  // Generar nómina general de empleados
  async generateGeneralPayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions } = req.body;

    if (!period || !start_date || !end_date || !payment_date) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const employees = await Employee.find();
      const generateEmployees = [];


      const errors = [];
      for (const employee of employees) {
        if (await checkOverlappingPayrolls(employee._id, start_date, end_date)) {
          errors.push(`El empleado ${employee._id} ya tiene una nómina en el rango de fechas proporcionado.`);
          continue; // Saltar al siguiente empleado si se encuentra una superposición
        }
        generateEmployees.push(employee);
      }
      const payrolls = await generatePayrollForEmployees(generateEmployees, { period, start_date, end_date, payment_date, deductions, perceptions });

      // Guardar cada nómina en la base de datos
      // for (const payroll of payrolls) {
      //   await payroll.save();
      // }

      await Promise.all(payrolls.map(payroll => payroll.save()));

      // Si hubo errores, responder con un estado 207 (Multi-Status) y un resumen de los errores
      if (errors.length > 0) {
        return res.status(207).json({ message: 'Se generaron algunas nóminas con errores.', errors });
      }

      res.status(201).json({ message: 'Nóminas generales generadas exitosamente', payrolls });
    } catch (error) {
      res.status(500).json({ error: 'Error al generar las nóminas: ' + error.message });
    }
  }

  // Generar nómina para un empleado específico
  async generateEmployeePayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions } = req.body;
    const { employee_id } = req.params;

    if (!period || !start_date || !end_date || !payment_date || !employee_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const employee = await Employee.findById(employee_id);
      if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });

      // Verificar si el departamento y cargo del empleado existen
      const departmentExists = await Department.findById(employee.department_id);
      if (!departmentExists) return res.status(404).json({ error: 'Departamento no encontrado' });

      const positionExists = await Position.findById(employee.position_id);
      if (!positionExists) return res.status(404).json({ error: 'Cargo no encontrado' });

      // Verificación de superposición de nóminas
      const overlappingPayrolls = await checkOverlappingPayrolls(employee._id, start_date, end_date);
      console.log(overlappingPayrolls);
      if (await checkOverlappingPayrolls(employee._id, start_date, end_date)) {
        return res.status(400).json({ error: `El empleado ${employee._id} ya tiene una nómina en el rango de fechas proporcionado.` });
      }

      const payrolls = await generatePayrollForEmployees([employee], { period, start_date, end_date, payment_date, deductions, perceptions });

      // Guardar cada nómina en la base de datos
      await Promise.all(payrolls.map(payroll => payroll.save()));

      res.status(201).json({ message: 'Nómina del empleado generada exitosamente', payrolls });
    } catch (error) {
      res.status(500).json({ error: 'Error al generar la nómina: ' + error.message });
    }
  }


  // Generar nómina por departamentos
  async generateDepartmentPayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions } = req.body;
    const { department_id } = req.params;

    if (!period || !start_date || !end_date || !payment_date || !department_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }


    try {
      // Verificar si el departamento existe
      const departmentExists = await Department.findById(department_id);
      if (!departmentExists) return res.status(404).json({ error: 'Departamento no encontrado' });

      const employees = await Employee.find({ department_id });
      const generateEmployees = [];

      const errors = [];
      for (const employee of employees) {
        if (await checkOverlappingPayrolls(employee._id, start_date, end_date)) {
          errors.push(`El empleado ${employee._id} ya tiene una nómina en el rango de fechas proporcionado.`);
          continue; // Saltar al siguiente empleado si se encuentra una superposición
        }
        generateEmployees.push(employee);
      }


      const payrolls = await generatePayrollForEmployees(generateEmployees, { period, start_date, end_date, payment_date, deductions, perceptions });

      // Guardar cada nómina en la base de datos
      await Promise.all(payrolls.map(payroll => payroll.save()));

      if (errors.length > 0) {
        return res.status(207).json({ message: 'Se generaron algunas nóminas con errores.', errors });
      }

      res.status(201).json({ message: 'Nóminas del departamento generadas exitosamente', payrolls });
    } catch (error) {
      res.status(500).json({ error: 'Error al generar las nóminas: ' + error.message });
    }
  }

  // Generar nómina por cargos
  async generatePositionPayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions } = req.body;
    const { position_id } = req.params;

    if (!period || !start_date || !end_date || !payment_date || !position_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      // Verificar si el cargo existe
      const positionExists = await Position.findById(position_id);
      if (!positionExists) return res.status(404).json({ error: 'Cargo no encontrado' });

      const employees = await Employee.find({ position_id });

      const generateEmployees = [];

      const errors = [];
      for (const employee of employees) {
        if (await checkOverlappingPayrolls(employee._id, start_date, end_date)) {
          errors.push(`El empleado ${employee._id} ya tiene una nómina en el rango de fechas proporcionado.`);
          continue; // Saltar al siguiente empleado si se encuentra una superposición
        }
        generateEmployees.push(employee);
      }
      const payrolls = await generatePayrollForEmployees(generateEmployees, { period, start_date, end_date, payment_date, deductions, perceptions });

      // Guardar cada nómina en la base de datos
      await Promise.all(payrolls.map(payroll => payroll.save()));

      if (errors.length > 0) {
        return res.status(207).json({ message: 'Se generaron algunas nóminas con errores.', errors });
      }

      res.status(201).json({ message: 'Nóminas del cargo generadas exitosamente', payrolls });
    } catch (error) {
      res.status(500).json({ error: 'Error al generar las nóminas: ' + error.message });
    }
  }

  // Obtener todas las nóminas ordenadas
  async getAllPayrolls(req, res) {
    try {
      const payrolls = await Payroll.find().sort({ payment_date: -1 }); // Ordenar por fecha de pago en orden descendente
      res.status(200).json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las nóminas: ' + error.message });
    }
  }

  // Obtener nóminas por departamento ordenadas
  async getPayrollsByDepartment(req, res) {
    const { department_id } = req.params;

    if (!department_id) {
      return res.status(400).json({ error: 'El ID del departamento es obligatorio.' });
    }

    try {
      // Verificar si el departamento existe
      const departmentExists = await Department.findById(department_id);
      if (!departmentExists) return res.status(404).json({ error: 'Departamento no encontrado' });

      const employees = await Employee.find({ department_id });
      const payrolls = await Payroll.find({ employee_id: { $in: employees.map(e => e._id) } })
        .sort({ payment_date: -1 }); // Ordenar por fecha de pago en orden descendente
      res.status(200).json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las nóminas por departamento: ' + error.message });
    }
  }

  // Obtener nóminas por cargo ordenadas
  async getPayrollsByPosition(req, res) {
    const { position_id } = req.params;

    if (!position_id) {
      return res.status(400).json({ error: 'El ID del cargo es obligatorio.' });
    }

    try {
      // Verificar si el cargo existe
      const positionExists = await Position.findById(position_id);
      if (!positionExists) return res.status(404).json({ error: 'Cargo no encontrado' });

      const employees = await Employee.find({ position_id });
      const payrolls = await Payroll.find({ employee_id: { $in: employees.map(e => e._id) } })
        .sort({ payment_date: -1 }); // Ordenar por fecha de pago en orden descendente
      res.status(200).json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las nóminas por cargo: ' + error.message });
    }
  }

  // Obtener nóminas por empleado
  async getPayrollsByEmployee(req, res) {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({ error: 'El ID del empleado es obligatorio.' });
    }

    try {
      // Verificar si el empleado existe
      const employeeExists = await Employee.findById(employee_id);
      if (!employeeExists) return res.status(404).json({ error: 'Empleado no encontrado' });

      const payrolls = await Payroll.find({ employee_id })
        .sort({ payment_date: -1 }); // Ordenar por fecha de pago en orden descendente
      res.status(200).json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las nóminas por empleado: ' + error.message });
    }
  }

  // Obtener nóminas por fecha
  async getPayrollsByDate(req, res) {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({ error: 'La fecha es obligatoria.' });
    }

    try {
      // Convertir la fecha a un objeto Date
      const payrollDate = new Date(date);

      // Verificar si la fecha es válida
      if (isNaN(payrollDate)) {
        return res.status(400).json({ error: 'La fecha no es válida.' });
      }

      // Obtener las nóminas que coinciden con la fecha de pago especificada
      const payrolls = await Payroll.find({ payment_date: payrollDate }).sort({ payment_date: -1 });

      res.status(200).json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las nóminas por fecha: ' + error.message });
    }
  }

  // Obtener nóminas por rango de fechas
  async getPayrollsByDateRange(req, res) {
    const { start_date, end_date } = req.params;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }

    try {
      // Convertir las fechas a objetos Date
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      // Verificar si las fechas son válidas
      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ error: 'Las fechas no son válidas.' });
      }

      // Obtener las nóminas que se encuentran dentro del rango de fechas especificado
      const payrolls = await Payroll.find({
        payment_date: { $gte: startDate, $lte: endDate }
      }).sort({ payment_date: -1 });

      res.status(200).json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las nóminas por rango de fechas: ' + error.message });
    }
  }

  // Editar nómina general de empleados
  async editGeneralPayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions, state } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const payrollsToUpdate = await Payroll.find({ state: { $ne: 'Pagada' }, state: { $ne: 'Cancelada' } });
      const errors = [];

      for (const payroll of payrollsToUpdate) {
        const overlapping = await checkOverlappingPayrolls(payroll.employee_id, start_date, end_date, payroll._id);
        if (overlapping) {
          errors.push(`Las fechas colisionan con nóminas existentes para el empleado ${payroll.employee_id}.`);
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({ message: 'Algunas nóminas no se pudieron actualizar.', errors });
      }

      // Actualizar nóminas
      for (const payroll of payrollsToUpdate) {
        if (period) payroll.period = period;
        if (start_date) payroll.start_date = start_date;
        if (end_date) payroll.end_date = end_date;
        if (payment_date) payroll.payment_date = payment_date;
        if (deductions) payroll.deductions = deductions;
        if (perceptions) payroll.perceptions = perceptions;
        if (state) payroll.state = state;

        await payroll.save();
      }

      res.status(200).json({ message: 'Nóminas actualizadas exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar las nóminas: ' + error.message });
    }
  }

  // Editar nómina de un empleado específico
  async editEmployeePayroll(req, res) {
    const { employee_id } = req.params;
    const { period, start_date, end_date, payment_date, deductions, perceptions, state } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const employee = await Employee.findById(employee_id);
      if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });

      const payrolls = await Payroll.find({ employee_id });
      const errors = [];

      for (const payroll of payrolls) {
        const overlapping = await checkOverlappingPayrolls(employee._id, start_date, end_date, payroll._id);
        if (overlapping) {
          errors.push(`Las fechas colisionan con nóminas existentes para el empleado ${employee_id}.`);
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({ message: 'Algunas nóminas no se pudieron actualizar.', errors });
      }

      for (const payroll of payrolls) {
        if (period) payroll.period = period;
        if (start_date) payroll.start_date = start_date;
        if (end_date) payroll.end_date = end_date;
        if (payment_date) payroll.payment_date = payment_date;
        if (deductions) payroll.deductions = deductions;
        if (perceptions) payroll.perceptions = perceptions;
        if (state) payroll.state = state;

        await payroll.save();
      }

      res.status(200).json({ message: 'Nóminas del empleado actualizadas exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar las nóminas del empleado: ' + error.message });
    }
  }

  // Editar una sola nómina específica
  async editSinglePayroll(req, res) {
    const { payroll_id } = req.params;
    const { period, start_date, end_date, payment_date, deductions, perceptions, state } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const payroll = await Payroll.findById(payroll_id);
      if (!payroll) return res.status(404).json({ error: 'Nómina no encontrada' });

      if (payroll.state === 'Pagada' || payroll.state === 'Cancelada') {
        return res.status(400).json({ error: 'No se puede editar una nómina que ya ha sido pagada o cancelada.' });
      }

      // Verificar superposición con exclusión de la nómina actual
      const overlapping = await checkOverlappingPayrolls(payroll.employee_id, start_date, end_date, payroll_id);
      if (overlapping) {
        return res.status(400).json({ error: `Las fechas colisionan con nóminas existentes para el empleado ${payroll.employee_id}.` });
      }

      // Actualizar los campos de la nómina si se proporcionan
      if (period) payroll.period = period;
      if (start_date) payroll.start_date = start_date;
      if (end_date) payroll.end_date = end_date;
      if (payment_date) payroll.payment_date = payment_date;
      if (deductions) payroll.deductions = deductions;
      if (perceptions) payroll.perceptions = perceptions;
      if (state) payroll.state = state;

      // Recalcular salarios, horas extras, deducciones y percepciones
      const employees = await Employee.find({ _id: payroll.employee_id });
      const updatedPayrolls = await generatePayrollForEmployees(employees, { period, start_date, end_date, payment_date, deductions, perceptions });
      const updatedPayroll = updatedPayrolls[0]; // Debería haber solo uno

      if (updatedPayroll) {
        payroll.overtime_hours = updatedPayroll.overtime_hours;
        payroll.gross_salary = updatedPayroll.gross_salary;
        payroll.net_salary = updatedPayroll.net_salary;
      }

      await payroll.save();
      res.status(200).json({ message: 'Nómina actualizada exitosamente', payroll });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la nómina: ' + error.message });
    }
  }

  // Editar nómina por departamentos
  async editDepartmentPayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions, state } = req.body;
    const { department_id } = req.params;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const departmentExists = await Department.findById(department_id);
      if (!departmentExists) return res.status(404).json({ error: 'Departamento no encontrado' });

      const employees = await Employee.find({ department_id });

      if (employees.length === 0) {
        return res.status(404).json({ error: 'No se encontraron empleados en el departamento' });
      }

      const employeeIds = employees.map(employee => employee._id);
      const payrolls = await Payroll.find({ employee_id: { $in: employeeIds } });
      const errors = [];
      const employeePayrolls = {};

      // Agrupar nóminas por empleado
      payrolls.forEach(payroll => {
        if (!employeePayrolls[payroll.employee_id]) {
          employeePayrolls[payroll.employee_id] = [];
        }
        employeePayrolls[payroll.employee_id].push(payroll);
      });

      // Verificar superposiciones y múltiple nóminas
      for (const employee_id in employeePayrolls) {
        const payrollList = employeePayrolls[employee_id];
        if (payrollList.length > 1) {
          errors.push(`Empleado ${employee_id} tiene múltiples nóminas.`);
          continue;
        }

        const payroll = payrollList[0];
        const overlapping = await checkOverlappingPayrolls(employee_id, start_date, end_date, payroll._id);
        if (overlapping) {
          errors.push(`Las fechas colisionan con nóminas existentes para el empleado ${employee_id}.`);
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({ message: 'Algunas nóminas del departamento no se pudieron actualizar.', errors });
      }

      // Actualizar nóminas
      for (const payroll of payrolls) {
        if (payroll.state === 'Pagada' || payroll.state === 'Cancelada') {
          continue; // No actualizar nóminas ya pagadas o canceladas
        }

        if (period) payroll.period = period;
        if (start_date) payroll.start_date = start_date;
        if (end_date) payroll.end_date = end_date;
        if (payment_date) payroll.payment_date = payment_date;
        if (deductions) payroll.deductions = deductions;
        if (perceptions) payroll.perceptions = perceptions;
        if (state) payroll.state = state;

        await payroll.save();
      }

      res.status(200).json({ message: 'Nóminas del departamento actualizadas exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar las nóminas del departamento: ' + error.message });
    }
  }

  // Editar nómina por cargos
  async editPositionPayroll(req, res) {
    const { period, start_date, end_date, payment_date, deductions, perceptions, state } = req.body;
    const { position_id } = req.params;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }

    // Validar que start_date sea menor que end_date
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser menor que la fecha de fin.' });
    }

    try {
      const positionExists = await Position.findById(position_id);
      if (!positionExists) return res.status(404).json({ error: 'Cargo no encontrado' });

      const employees = await Employee.find({ position_id });

      if (employees.length === 0) {
        return res.status(404).json({ error: 'No se encontraron empleados en el cargo' });
      }

      const employeeIds = employees.map(employee => employee._id);
      const payrolls = await Payroll.find({ employee_id: { $in: employeeIds } });
      const errors = [];
      const employeePayrolls = {};

      // Agrupar nóminas por empleado
      payrolls.forEach(payroll => {
        if (!employeePayrolls[payroll.employee_id]) {
          employeePayrolls[payroll.employee_id] = [];
        }
        employeePayrolls[payroll.employee_id].push(payroll);
      });

      // Verificar superposiciones y múltiple nóminas
      for (const employee_id in employeePayrolls) {
        const payrollList = employeePayrolls[employee_id];
        if (payrollList.length > 1) {
          errors.push(`Empleado ${employee_id} tiene múltiples nóminas.`);
          continue;
        }

        const payroll = payrollList[0];
        const overlapping = await checkOverlappingPayrolls(employee_id, start_date, end_date, payroll._id);
        if (overlapping) {
          errors.push(`Las fechas colisionan con nóminas existentes para el empleado ${employee_id}.`);
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({ message: 'Algunas nóminas del cargo no se pudieron actualizar.', errors });
      }

      // Actualizar nóminas
      for (const payroll of payrolls) {
        if (payroll.state === 'Pagada' || payroll.state === 'Cancelada') {
          continue; // No actualizar nóminas ya pagadas o canceladas
        }

        if (period) payroll.period = period;
        if (start_date) payroll.start_date = start_date;
        if (end_date) payroll.end_date = end_date;
        if (payment_date) payroll.payment_date = payment_date;
        if (deductions) payroll.deductions = deductions;
        if (perceptions) payroll.perceptions = perceptions;
        if (state) payroll.state = state;

        await payroll.save();
      }

      res.status(200).json({ message: 'Nóminas del cargo actualizadas exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar las nóminas del cargo: ' + error.message });
    }
  }



  // Eliminar nómina general de empleados
  async deleteGeneralPayroll(req, res) {
    try {
      const result = await Payroll.deleteMany({
        $and: [
          { state: { $ne: 'Pagada' } },
          { state: { $ne: 'Cancelada' } }
        ]
      });
      res.status(200).json({ message: 'Nóminas generales eliminadas exitosamente', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar las nóminas generales: ' + error.message });
    }
  }

  // Eliminar nómina de un empleado específico
  async deleteEmployeePayroll(req, res) {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({ error: 'El ID del empleado es obligatorio.' });
    }

    try {
      const result = await Payroll.deleteMany({
        employee_id,
        $and: [
          { state: { $ne: 'Pagada' } },
          { state: { $ne: 'Cancelada' } }
        ]
      });
      res.status(200).json({ message: 'Nóminas del empleado eliminadas exitosamente', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar las nóminas del empleado: ' + error.message });
    }
  }

  // Eliminar una sola nómina específica
  async deleteSinglePayroll(req, res) {
    const { payroll_id } = req.params;

    if (!payroll_id) {
      return res.status(400).json({ error: 'El ID de la nómina es obligatorio.' });
    }

    try {
      // Buscar la nómina específica
      const payroll = await Payroll.findById(payroll_id);
      if (!payroll) {
        return res.status(404).json({ error: 'Nómina no encontrada' });
      }

      // Verificar el estado de la nómina
      if (payroll.state === 'Pagada' || payroll.state === 'Cancelada') {
        return res.status(400).json({ error: 'No se puede eliminar una nómina que ya ha sido pagada o cancelada.' });
      }

      // Eliminar la nómina
      const result = await Payroll.deleteOne({ _id: payroll_id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Nómina no encontrada' });
      }

      res.status(200).json({ message: 'Nómina eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la nómina: ' + error.message });
    }
  }

  // Eliminar nómina por departamento
  async deleteDepartmentPayroll(req, res) {
    const { department_id } = req.params;

    if (!department_id) {
      return res.status(400).json({ error: 'El ID del departamento es obligatorio.' });
    }

    try {
      // Verificar si el departamento existe
      const departmentExists = await Department.findById(department_id);
      if (!departmentExists) return res.status(404).json({ error: 'Departamento no encontrado' });

      const employees = await Employee.find({ department_id });
      const result = await Payroll.deleteMany({
        employee_id: { $in: employees.map(e => e._id) },
        $and: [
          { state: { $ne: 'Pagada' } },
          { state: { $ne: 'Cancelada' } }
        ]
      });

      res.status(200).json({ message: 'Nóminas del departamento eliminadas exitosamente', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar las nóminas del departamento: ' + error.message });
    }
  }

  // Eliminar nómina por cargo
  async deletePositionPayroll(req, res) {
    const { position_id } = req.params;

    if (!position_id) {
      return res.status(400).json({ error: 'El ID del cargo es obligatorio.' });
    }

    try {
      // Verificar si el cargo existe
      const positionExists = await Position.findById(position_id);
      if (!positionExists) return res.status(404).json({ error: 'Cargo no encontrado' });

      const employees = await Employee.find({ position_id });
      const result = await Payroll.deleteMany({
        employee_id: { $in: employees.map(e => e._id) },
        $and: [
          { state: { $ne: 'Pagada' } },
          { state: { $ne: 'Cancelada' } }
        ]
      });

      res.status(200).json({ message: 'Nóminas del cargo eliminadas exitosamente', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar las nóminas del cargo: ' + error.message });
    }
  }
}

export default new PayrollController();