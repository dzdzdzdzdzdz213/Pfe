import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
}

export function formatTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: fr });
}

export function timeAgo(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function isTodayDate(date) {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

export function generatePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

export function getStatusColor(status) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
    case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export function getStatusLabel(status, t) {
  if (t) {
    switch (status) {
      case 'confirmed': return t('status_confirme');
      case 'pending': return t('status_planifie');
      case 'cancelled': return t('status_annule');
      case 'completed': return t('status_termine');
      case 'planifie': return t('status_planifie');
      case 'confirme': return t('status_confirme');
      case 'termine': return t('status_termine');
      case 'annule': return t('status_annule');
      default: return t(`status_${status}`) || status;
    }
  }

  switch (status) {
    case 'confirmed': return 'Confirmé';
    case 'pending': return 'En attente';
    case 'cancelled': return 'Annulé';
    case 'completed': return 'Terminé';
    case 'planifie': return 'Planifié';
    case 'confirme': return 'Confirmé';
    case 'termine': return 'Terminé';
    case 'annule': return 'Annulé';
    default: return status;
  }
}

export const SERVICE_COLORS = [
  '#2563eb', '#0d9488', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#6366f1'
];

export function getServiceColor(index) {
  return SERVICE_COLORS[index % SERVICE_COLORS.length];
}
