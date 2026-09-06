import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { Category, HelpRequest, RequestStatus } from '@/types/barakah';
import { CATEGORY_LABELS } from '@/types/barakah';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function categoryLabel(category: Category) {
  return CATEGORY_LABELS[category];
}

export function statusLabel(status: RequestStatus) {
  switch (status) {
    case 'open':
      return 'Open';
    case 'matching':
      return 'Matching';
    case 'matched':
      return 'Matched';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
}

export function statusTone(status: RequestStatus): 'neutral' | 'success' | 'primary' | 'warning' {
  if (status === 'completed') return 'success';
  if (status === 'matched' || status === 'in_progress') return 'primary';
  if (status === 'matching') return 'warning';
  return 'neutral';
}

export function requestSnippet(request: HelpRequest) {
  return request.rawText.length > 90 ? `${request.rawText.slice(0, 87)}...` : request.rawText;
}

export function formatConfidence(n: number) {
  return `${Math.round(n * 100)}%`;
}

export const categoryIcon: Record<Category, IoniconName> = {
  ride: 'car-outline',
  food: 'basket-outline',
  moving_help: 'cube-outline',
  new_muslim_resources: 'book-outline',
  laptop: 'laptop-outline',
  childcare: 'people-outline',
  elder_transport: 'accessibility-outline',
};
