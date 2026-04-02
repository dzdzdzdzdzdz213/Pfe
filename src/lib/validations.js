import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail non valide" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

export const userSchema = z.object({
  nom: z.string().min(2, { message: "Le nom est trop court" }),
  prenom: z.string().min(2, { message: "Le prénom est trop court" }),
  email: z.string().email({ message: "Adresse e-mail non valide" }),
  telephone: z.string().optional(),
  role: z.enum(['administrateur', 'radiologue', 'receptionniste', 'patient']),
});

export const patientSchema = z.object({
  nom: z.string().min(2, { message: "Le nom est trop court" }),
  prenom: z.string().min(2, { message: "Le prénom est trop court" }),
  email: z.string().email({ message: "Adresse e-mail non valide" }).optional().or(z.literal('')),
  telephone: z.string().min(8, { message: "Numéro de téléphone non valide" }),
  adresse: z.string().optional(),
  sexe: z.enum(['M', 'F']),
  groupeSanguin: z.string().optional(),
  telephoneUrgence: z.string().optional(),
  date_naissance: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date de naissance non valide",
  }),
});

export const appointmentSchema = z.object({
  patient_id: z.string().uuid({ message: "Patient non sélectionné" }),
  service_id: z.string().uuid({ message: "Service non sélectionné" }),
  dateHeureDebut: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date et heure de début non valides",
  }),
  dateHeureFin: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date et heure de fin non valides",
  }),
  motif: z.string().optional(),
  statut: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
});

export const reportSchema = z.object({
  description_detaillee: z.string().min(10, { message: "La description est trop courte" }),
  est_valide: z.boolean().default(false),
  radiologue_id: z.string().uuid(),
  document_medical_id: z.string().uuid().optional(),
});

export const settingsSchema = z.object({
  clinic_name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string(),
  email: z.string().email(),
  working_hours: z.array(z.object({
    day: z.string(),
    open: z.string(),
    close: z.string(),
    isClosed: z.boolean(),
  })),
  appointment_duration: z.number().min(5).max(120),
});

export const serviceSchema = z.object({
  nom: z.string().min(2, { message: "Le nom du service est trop court" }),
  description: z.string().optional(),
});
