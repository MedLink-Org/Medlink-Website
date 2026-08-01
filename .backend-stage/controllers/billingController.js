const billingModel = require('../models/billingModel');

const getAllBilling = async (req, res) => {
  try {
    const result = req.user.role === 'patient'
      ? await billingModel.getBillingByPatientId(req.user.profile_id)
      : await billingModel.getAllBilling();
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBillingById = async (req, res) => {
  try {
    const result = await billingModel.getBillingById(req.params.id);
    const bill = result.rows[0];
    if (!bill) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    if (
      req.user.role === 'patient'
      && String(req.user.profile_id) !== String(bill.patient_id)
    ) {
      return res.status(403).json({ error: 'You cannot access this bill' });
    }
    res.status(200).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBillingByPatientId = async (req, res) => {
  if (
    req.user.role === 'patient'
    && String(req.user.profile_id) !== String(req.params.patientId)
  ) {
    return res.status(403).json({ error: 'You cannot access these bills' });
  }
  try {
    const result = await billingModel.getBillingByPatientId(req.params.patientId);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createBilling = async (req, res) => {
  try {
    const result = await billingModel.createBilling(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateBilling = async (req, res) => {
  try {
    const result = await billingModel.updateBilling(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteBilling = async (req, res) => {
  try {
    const result = await billingModel.deleteBilling(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.status(200).json({ message: 'Billing record deleted', billing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllBilling,
  getBillingById,
  getBillingByPatientId,
  createBilling,
  updateBilling,
  deleteBilling,
};

