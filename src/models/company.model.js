import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, required: true },
  currency: { type: String, required: true },
  foundation_date: { type: Date, required: true },
  logo: { type: String }
});

const Company = mongoose.model('Company', companySchema);

export default Company;