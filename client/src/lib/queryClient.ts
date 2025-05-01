import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API response type based on our backend format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorResponse = await res.json() as ApiResponse;
      errorMessage = errorResponse.message || res.statusText;
    } catch (e) {
      errorMessage = res.statusText;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest<TData = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<TData> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const apiResponse = await res.json() as ApiResponse<TData>;
  return apiResponse.data as TData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <TData>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<TData> => {
  return async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    const apiResponse = await res.json() as ApiResponse<TData>;
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.message);
    }
    
    return apiResponse.data as TData;
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 60000, // 1 minute
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
