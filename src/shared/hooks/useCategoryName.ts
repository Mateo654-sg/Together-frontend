import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/services/api';

export function useCategoryName(categoryId: string | null): string {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });
  if (!categoryId || !categories) return 'Sin categoría';
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.name ?? 'Sin categoría';
}
