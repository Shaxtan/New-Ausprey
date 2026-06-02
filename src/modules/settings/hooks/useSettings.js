import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';

export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: settingsService.getSettings });
