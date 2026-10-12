import type { AppUser } from "./types.js";

export const APP_USERS: AppUser[] = [
  {
    id: "user-01",
    name: "Dr. Samantha Reyes",
    email: "s.reyes@meridianhealth.demo",
    role: "Pharmacy Administrator",
    defaultLocation: "loc-01",
    notificationPreference: "Both",
  },
  {
    id: "user-02",
    name: "Marcus Webb",
    email: "m.webb@meridianhealth.demo",
    role: "Pharmacy Manager",
    defaultLocation: "loc-01",
    notificationPreference: "Email",
  },
  {
    id: "user-03",
    name: "Priya Nandakumar",
    email: "p.nandakumar@meridianhealth.demo",
    role: "Pharmacy Manager",
    defaultLocation: "loc-03",
    notificationPreference: "Both",
  },
  {
    id: "user-04",
    name: "Jerome Caldwell",
    email: "j.caldwell@meridianhealth.demo",
    role: "Pharmacy Staff",
    defaultLocation: "loc-02",
    notificationPreference: "In-App",
  },
  {
    id: "user-05",
    name: "Elena Torres",
    email: "e.torres@meridianhealth.demo",
    role: "Pharmacy Staff",
    defaultLocation: "loc-04",
    notificationPreference: "Email",
  },
  {
    id: "user-06",
    name: "Kevin Bright",
    email: "k.bright@meridianhealth.demo",
    role: "Pharmacy Staff",
    defaultLocation: "loc-05",
    notificationPreference: "In-App",
  },
  {
    id: "user-07",
    name: "Natasha Monroe",
    email: "n.monroe@meridianhealth.demo",
    role: "Pharmacy Manager",
    defaultLocation: "loc-07",
    notificationPreference: "Both",
  },
  {
    id: "user-08",
    name: "David Okafor",
    email: "d.okafor@meridianhealth.demo",
    role: "Pharmacy Staff",
    defaultLocation: "loc-09",
    notificationPreference: "None",
  },
  {
    id: "user-09",
    name: "Linda Choi",
    email: "l.choi@meridianhealth.demo",
    role: "Pharmacy Staff",
    defaultLocation: "loc-11",
    notificationPreference: "Email",
  },
  {
    id: "user-10",
    name: "Rafael Gutierrez",
    email: "r.gutierrez@meridianhealth.demo",
    role: "Pharmacy Manager",
    defaultLocation: "loc-12",
    notificationPreference: "Both",
  },
];

export const getUserById = (id: string): AppUser | undefined =>
  APP_USERS.find((u) => u.id === id);

export const getUserName = (id: string): string =>
  APP_USERS.find((u) => u.id === id)?.name ?? id;

export const CURRENT_USER = APP_USERS[0]; // Simulated logged-in user
