import { useCallback, useEffect, useState } from 'react';
import { useApiService } from '@/util/useApiService';
import { useSession } from '@/util/useSession';

interface Props {
  apiName?: string;
  versionName?: string;
  definitionName?: string;
}

interface ReturnType {
  value?: string;
  isLoading: boolean;
}

export default function useApiSpecUrl({ apiName, versionName, definitionName }: Props): ReturnType {
  const [value, setValue] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useSession();
  const apiService = useApiService();

  const fetch = useCallback(async () => {
    if (!apiName || !versionName || !definitionName || !isAuthenticated) {
      setValue(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const downloadUrl = await apiService.getSpecificationLink(apiName, versionName, definitionName);
      setValue(downloadUrl);
    } finally {
      setIsLoading(false);
    }
  }, [apiName, apiService, definitionName, isAuthenticated, versionName]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return {
    value,
    isLoading,
  };
}
