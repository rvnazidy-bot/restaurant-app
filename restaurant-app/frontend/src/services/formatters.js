export const formatCurrency = (value) =>
  `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0
  }).format(Number(value || 0))} Ar`;

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

export const formatTime = (value) =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));

export const statusToneMap = {
  invite: 'warning',
  actif: 'success',
  desactive: 'danger',
  libre: 'success',
  occupee: 'danger',
  reservee: 'warning',
  en_attente: 'warning',
  en_preparation: 'info',
  servie: 'success',
  payee: 'dark',
  admin: 'dark',
  staff: 'info',
  cuisine: 'warning'
};

export const statusLabelMap = {
  invite: 'Invite',
  actif: 'Actif',
  desactive: 'Desactive',
  libre: 'Libre',
  occupee: 'Occupee',
  reservee: 'Reservee',
  en_attente: 'En attente',
  en_preparation: 'En preparation',
  servie: 'Servie',
  payee: 'Payee',
  admin: 'Admin',
  staff: 'Staff',
  cuisine: 'Cuisine'
};
