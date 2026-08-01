import { addDays, today } from "../utils/date.js";

export const doctors = [
  {
    doctorId: "D01",
    firstName: "Ifeoma",
    lastName: "Smith",
    specialization: "General Practice",
    room: "Room 01"
  },
  {
    doctorId: "D02",
    firstName: "Chinedu",
    lastName: "Adams",
    specialization: "Pediatrics",
    room: "Room 04"
  },
  {
    doctorId: "D03",
    firstName: "Bola",
    lastName: "Nwosu",
    specialization: "Cardiology",
    room: "Room 06"
  },
  {
    doctorId: "D04",
    firstName: "Tari",
    lastName: "Johnson",
    specialization: "Dermatology",
    room: "Room 08"
  }
];

export const nurses = [
  {
    nurseId: "N01",
    firstName: "Grace",
    lastName: "Eze",
    dob: "1989-06-12",
    phone: "+234 803 622 1045",
    address: "12 Wetheral Road, Owerri, Imo State",
    dateOfEmployment: "2016-09-01"
  },
  {
    nurseId: "N02",
    firstName: "Mariam",
    lastName: "Okafor",
    dob: "1991-02-24",
    phone: "+234 806 331 7720",
    address: "7 Douglas Road, Owerri, Imo State",
    dateOfEmployment: "2018-04-15"
  }
];

export function createSeedData() {
  const currentDate = today();
  const patients = [
    {
      patientId: "P001",
      firstName: "Adaeze",
      lastName: "Okeke",
      dob: "1992-04-16",
      gender: "Female",
      phone: "+234 803 420 1182",
      email: "adaeze.okeke@example.com",
      address: "12 Wetheral Road, Owerri, Imo State",
      bloodType: "O+",
      genotype: "AA",
      medicalHistory: "Penicillin allergy. Mild asthma."
    },
    {
      patientId: "P002",
      firstName: "Emeka",
      lastName: "Nwankwo",
      dob: "1984-09-02",
      gender: "Male",
      phone: "+234 806 118 9022",
      email: "emeka.nwankwo@example.com",
      address: "45 Egbu Road, Owerri, Imo State",
      bloodType: "A+",
      genotype: "AS",
      medicalHistory: "Hypertension. Currently taking amlodipine."
    },
    {
      patientId: "P003",
      firstName: "Chioma",
      lastName: "Eze",
      dob: "2017-11-22",
      gender: "Female",
      phone: "+234 814 990 3125",
      email: "guardian.eze@example.com",
      address: "8 Mbaise Road, Owerri, Imo State",
      bloodType: "B+",
      genotype: "AA",
      medicalHistory: "No known allergies."
    },
    {
      patientId: "P004",
      firstName: "Tunde",
      lastName: "Adebayo",
      dob: "1976-01-30",
      gender: "Male",
      phone: "+234 809 431 7740",
      email: "tunde.adebayo@example.com",
      address: "3 MCC Road, Owerri, Imo State",
      bloodType: "AB+",
      genotype: "AA",
      medicalHistory: "Type 2 diabetes. Requires glucose monitoring."
    },
    {
      patientId: "P005",
      firstName: "Ngozi",
      lastName: "Ibe",
      dob: "1998-06-11",
      gender: "Female",
      phone: "+234 705 338 8201",
      email: "ngozi.ibe@example.com",
      address: "20 Port Harcourt Road, Owerri, Imo State",
      bloodType: "O-",
      genotype: "AS",
      medicalHistory: "No chronic conditions recorded."
    },
    {
      patientId: "P006",
      firstName: "Samuel",
      lastName: "Udo",
      dob: "1968-12-08",
      gender: "Male",
      phone: "+234 802 771 4308",
      email: "samuel.udo@example.com",
      address: "14 Onitsha Road, Owerri, Imo State",
      bloodType: "A-",
      genotype: "AA",
      medicalHistory: "Cardiac review patient. Aspirin therapy."
    }
  ];

  const appointments = [
    { appointmentId: "A001", patientId: "P001", doctorId: "D01", date: addDays(currentDate, -6), time: "09:00", visitType: "New consultation", reason: "Persistent cough", status: "completed" },
    { appointmentId: "A002", patientId: "P003", doctorId: "D02", date: addDays(currentDate, -5), time: "10:30", visitType: "Routine checkup", reason: "Pediatric wellness review", status: "completed" },
    { appointmentId: "A003", patientId: "P004", doctorId: "D01", date: addDays(currentDate, -4), time: "11:00", visitType: "Follow-up", reason: "Diabetes review", status: "completed" },
    { appointmentId: "A004", patientId: "P006", doctorId: "D03", date: addDays(currentDate, -3), time: "13:30", visitType: "Follow-up", reason: "Cardiac assessment", status: "completed" },
    { appointmentId: "A005", patientId: "P005", doctorId: "D04", date: addDays(currentDate, -2), time: "09:30", visitType: "New consultation", reason: "Skin irritation", status: "completed" },
    { appointmentId: "A006", patientId: "P002", doctorId: "D01", date: addDays(currentDate, -1), time: "15:00", visitType: "Follow-up", reason: "Blood pressure review", status: "cancelled" },
    { appointmentId: "A007", patientId: "P001", doctorId: "D01", date: currentDate, time: "08:30", visitType: "Follow-up", reason: "Respiratory review", status: "no-show" },
    { appointmentId: "A008", patientId: "P003", doctorId: "D02", date: currentDate, time: "09:15", visitType: "Routine checkup", reason: "Immunization review", status: "scheduled" },
    { appointmentId: "A009", patientId: "P006", doctorId: "D03", date: currentDate, time: "10:00", visitType: "Follow-up", reason: "ECG results review", status: "scheduled" },
    { appointmentId: "A010", patientId: "P005", doctorId: "D04", date: currentDate, time: "11:30", visitType: "Procedure", reason: "Dermatology procedure", status: "scheduled" },
    { appointmentId: "A011", patientId: "P004", doctorId: "D01", date: currentDate, time: "13:00", visitType: "Follow-up", reason: "Glucose monitoring", status: "scheduled" },
    { appointmentId: "A012", patientId: "P002", doctorId: "D01", date: addDays(currentDate, 1), time: "09:00", visitType: "Follow-up", reason: "Hypertension management", status: "scheduled" },
    { appointmentId: "A013", patientId: "P003", doctorId: "D02", date: addDays(currentDate, 2), time: "10:30", visitType: "Follow-up", reason: "Laboratory results", status: "scheduled" },
    { appointmentId: "A014", patientId: "P006", doctorId: "D03", date: addDays(currentDate, 3), time: "14:00", visitType: "Routine checkup", reason: "Cardiology review", status: "scheduled" }
  ];

  const bills = [
    { billId: "B001", patientId: "P001", billType: "Consultation", amount: 15000, mode: "Card", dateIssued: addDays(currentDate, -6), datePaid: addDays(currentDate, -6), status: "Paid" },
    { billId: "B002", patientId: "P004", billType: "Laboratory", amount: 28500, mode: "Bank Transfer", dateIssued: addDays(currentDate, -4), datePaid: addDays(currentDate, -3), status: "Paid" },
    { billId: "B003", patientId: "P006", billType: "Procedure", amount: 45000, mode: "Insurance", dateIssued: currentDate, datePaid: "", status: "Pending" },
    { billId: "B004", patientId: "P005", billType: "Medication", amount: 12500, mode: "Cash", dateIssued: currentDate, datePaid: "", status: "Pending" }
  ];

  return {
    patients,
    doctors,
    nurses,
    appointments,
    bills,
    nextPatientId: 7,
    nextAppointmentId: 15,
    nextBillId: 5
  };
}
