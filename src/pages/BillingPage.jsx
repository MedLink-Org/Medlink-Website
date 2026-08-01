import {
  BadgeAlert,
  BadgeCheck,
  FilePlus2,
  Landmark,
  Plus,
  Receipt,
  ReceiptText
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import FormField from "../components/common/FormField";
import PageHeading from "../components/common/PageHeading";
import PanelHeader from "../components/common/PanelHeader";
import PersonCell from "../components/common/PersonCell";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import { useMedLink } from "../context/MedLinkContext";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/date";
import { formatCurrency } from "../utils/format";

const emptyBill = {
  patientId: "",
  billType: "",
  amount: "",
  mode: ""
};

export default function BillingPage() {
  const {
    patients,
    bills,
    patientById,
    addBill,
    markBillPaid
  } = useMedLink();
  const { showToast } = useToast();
  const formPanelRef = useRef(null);
  const patientInputRef = useRef(null);
  const [form, setForm] = useState(emptyBill);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("All");
  const [requestError, setRequestError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingBillId, setUpdatingBillId] = useState("");

  const total = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const paid = bills.filter(bill => bill.status === "Paid").reduce((sum, bill) => sum + Number(bill.amount), 0);
  const pendingBills = bills.filter(bill => bill.status === "Pending");
  const outstanding = pendingBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const filteredBills = useMemo(
    () => bills
      .filter(bill => filter === "All" || bill.status === filter)
      .sort((a, b) => b.dateIssued.localeCompare(a.dateIssued)),
    [bills, filter]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setRequestError(false);
    if (errors[name]) {
      setErrors(current => ({ ...current, [name]: "" }));
    }
  }

  function validate() {
    const validationErrors = {};
    const requiredFields = {
      patientId: "Patient",
      billType: "Bill type",
      amount: "Amount",
      mode: "Payment method"
    };
    Object.entries(requiredFields).forEach(([name, label]) => {
      if (!String(form[name] || "").trim()) validationErrors[name] = `${label} is required.`;
    });
    if (form.amount && Number(form.amount) <= 0) {
      validationErrors.amount = "Amount must be greater than zero.";
    }
    return validationErrors;
  }

  function resetForm() {
    setForm(emptyBill);
    setErrors({});
    setStatus("");
    setRequestError(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setRequestError(false);
    if (Object.keys(validationErrors).length) {
      setStatus("Please complete the required billing fields.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Issuing bill...");
    try {
      const record = await addBill(form);
      setForm(emptyBill);
      setStatus(`${record.billId} was issued successfully.`);
      showToast("Bill issued", `${record.billId} was created for ${formatCurrency(record.amount)}.`);
    } catch (error) {
      const message = error.message || "Unable to issue the bill.";
      setRequestError(true);
      setStatus(message);
      showToast("Bill creation failed", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkPaid(billId) {
    setUpdatingBillId(billId);
    try {
      await markBillPaid(billId);
      showToast("Payment recorded", `${billId} has been marked as paid.`);
    } catch (error) {
      showToast(
        "Payment update failed",
        error.message || "Unable to mark the bill as paid.",
        "error"
      );
    } finally {
      setUpdatingBillId("");
    }
  }

  function focusForm() {
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => patientInputRef.current?.focus(), 350);
  }

  function fieldClass(name) {
    return errors[name] ? "invalid" : "";
  }

  return (
    <section className="view" aria-labelledby="billingHeading">
      <PageHeading
        eyebrow="Finance desk"
        title="Billing Management"
        titleId="billingHeading"
        description="Issue patient bills, track payment methods, and close balances."
        actions={(
          <button className="button button-primary" type="button" onClick={focusForm}>
            <FilePlus2 />
            Create bill
          </button>
        )}
      />

      <div className="stat-grid stat-grid-three">
        <StatCard icon={Receipt} label="Total Billed" value={formatCurrency(total)} caption="All issued invoices" />
        <StatCard icon={BadgeCheck} tone="green" label="Payments Received" value={formatCurrency(paid)} caption="Settled patient bills" />
        <StatCard icon={BadgeAlert} tone="red" label="Outstanding Balance" value={formatCurrency(outstanding)} caption={`${pendingBills.length} pending bill${pendingBills.length === 1 ? "" : "s"}`} />
      </div>

      <section className="form-panel compact-form-panel" ref={formPanelRef}>
        <div className="section-heading">
          <span className="section-icon section-icon-amber"><ReceiptText /></span>
          <div>
            <h3>Create patient bill</h3>
            <p>Record a service charge and preferred payment method.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid form-grid-four">
            <FormField label="Patient" htmlFor="billingPatient" required error={errors.patientId}>
              <select ref={patientInputRef} className={fieldClass("patientId")} id="billingPatient" name="patientId" value={form.patientId} onChange={handleChange}>
                <option value="">Select patient</option>
                {[...patients].sort((a, b) => a.lastName.localeCompare(b.lastName)).map(patient => (
                  <option value={patient.patientId} key={patient.patientId}>
                    {patient.patientId} - {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Bill Type" htmlFor="billType" required error={errors.billType}>
              <select className={fieldClass("billType")} id="billType" name="billType" value={form.billType} onChange={handleChange}>
                <option value="">Select service</option>
                {["Consultation", "Laboratory", "Medication", "Procedure", "Admission"].map(type => <option key={type}>{type}</option>)}
              </select>
            </FormField>
            <FormField label="Amount (NGN)" htmlFor="billAmount" required error={errors.amount}>
              <input className={fieldClass("amount")} id="billAmount" name="amount" type="number" min="1" step="100" placeholder="15000" value={form.amount} onChange={handleChange} />
            </FormField>
            <FormField label="Payment Method" htmlFor="paymentMode" required error={errors.mode}>
              <select className={fieldClass("mode")} id="paymentMode" name="mode" value={form.mode} onChange={handleChange}>
                <option value="">Select method</option>
                {["Cash", "Card", "Bank Transfer", "Insurance"].map(mode => <option key={mode}>{mode}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-footer">
            <div className={`form-status ${Object.keys(errors).length || requestError ? "error" : ""}`} aria-live="polite">{status}</div>
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={resetForm} disabled={isSubmitting}>Clear</button>
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                <Plus />
                {isSubmitting ? "Issuing..." : "Issue Bill"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <PanelHeader
          icon={Landmark}
          title="Patient Invoices"
          description="Review bill status and record received payments."
          action={(
            <label className="filter-select">
              <span>Payment status</span>
              <select value={filter} onChange={event => setFilter(event.target.value)}>
                <option value="All">All bills</option>
                <option>Pending</option>
                <option>Paid</option>
              </select>
            </label>
          )}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Service</th>
                <th>Issued</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length ? filteredBills.map(bill => {
                const patient = patientById(bill.patientId);
                return (
                  <tr key={bill.billId}>
                    <td><span className="table-id">{bill.billId}</span></td>
                    <td>
                      <PersonCell
                        compact
                        person={patient}
                        title={patient ? `${patient.firstName} ${patient.lastName}` : bill.patientId}
                        subtitle={bill.mode}
                      />
                    </td>
                    <td>{bill.billType}</td>
                    <td>{formatDate(bill.dateIssued)}</td>
                    <td><strong>{formatCurrency(bill.amount)}</strong></td>
                    <td><StatusBadge status={bill.status} /></td>
                    <td>
                      {bill.status === "Pending" ? (
                        <button className="table-action" type="button" disabled={updatingBillId === bill.billId} onClick={() => handleMarkPaid(bill.billId)}>
                          <BadgeCheck />Mark paid
                        </button>
                      ) : `Paid ${formatDate(bill.datePaid, { day: "numeric", month: "short" })}`}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7"><div className="empty-state">No bills match this payment status.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
