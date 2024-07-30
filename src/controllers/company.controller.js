import Company from '../models/company.model.js';
import { deleteFile } from '../config/upload.js';

class CompanyController {
  // Crear una nueva empresa
  async createCompany(req, res) {
    const { name, address, country, currency, foundation_date } = req.body;

    if (!name || !address || !country || !currency || !foundation_date) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    const logo = req.file ? req.file.filename : null; // Obtener el nombre del archivo si se cargó uno

    try {
      const newCompany = new Company({ name, address, country, currency, foundation_date, logo });
      await newCompany.save();
      res.status(201).json({ message: 'Empresa creada exitosamente', company: newCompany });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la empresa: ' + error.message });
    }
  }

  // Obtener toda la información de una empresa
  async getCompany(req, res) {
    try {
      const company = await Company.findById(req.params.id);
      if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
      res.status(200).json(company);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la empresa: ' + error.message });
    }
  }

  // Actualizar información de una empresa
  async updateCompany(req, res) {
    const { name, address, country, currency, foundation_date } = req.body;

    try {
      const company = await Company.findById(req.params.id);
      if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

      if (name) company.name = name;
      if (address) company.address = address;
      if (country) company.country = country;
      if (currency) company.currency = currency;
      if (foundation_date) company.foundation_date = foundation_date;

      // Manejar la actualización del logo
      if (req.file) {
        if (company.logo) {
          deleteFile(company.logo);
        }
        company.logo = req.file.filename;
      }

      await company.save();
      res.status(200).json({ message: 'Empresa actualizada exitosamente', company });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la empresa: ' + error.message });
    }
  }

  // Obtener todas las empresas
  async getAllCompanies(req, res) {
    try {
      const companies = await Company.find();
      res.status(200).json(companies);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las empresas: ' + error.message });
    }
  }

  // Eliminar una empresa
  async deleteCompany(req, res) {
    try {
      const company = await Company.findByIdAndDelete(req.params.id);
      if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

      // Eliminar el logo asociado si existe
      if (company.logo) {
        deleteFile(company.logo);
      }

      res.status(200).json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la empresa: ' + error.message });
    }
  }
}

export default new CompanyController();