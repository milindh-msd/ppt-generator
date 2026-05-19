import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ApiError, HealthStatus, Presentation, PresentationInput, PresentationStats } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListPresentationsUrl: () => string;
/**
 * Returns all generated presentations
 * @summary List all presentations
 */
export declare const listPresentations: (options?: RequestInit) => Promise<Presentation[]>;
export declare const getListPresentationsQueryKey: () => readonly ["/api/presentations"];
export declare const getListPresentationsQueryOptions: <TData = Awaited<ReturnType<typeof listPresentations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPresentations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPresentations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPresentationsQueryResult = NonNullable<Awaited<ReturnType<typeof listPresentations>>>;
export type ListPresentationsQueryError = ErrorType<unknown>;
/**
 * @summary List all presentations
 */
export declare function useListPresentations<TData = Awaited<ReturnType<typeof listPresentations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPresentations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGeneratePresentationUrl: () => string;
/**
 * Uses AI to generate a complete presentation for the given topic
 * @summary Generate a new PPT presentation
 */
export declare const generatePresentation: (presentationInput: PresentationInput, options?: RequestInit) => Promise<Presentation>;
export declare const getGeneratePresentationMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generatePresentation>>, TError, {
        data: BodyType<PresentationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generatePresentation>>, TError, {
    data: BodyType<PresentationInput>;
}, TContext>;
export type GeneratePresentationMutationResult = NonNullable<Awaited<ReturnType<typeof generatePresentation>>>;
export type GeneratePresentationMutationBody = BodyType<PresentationInput>;
export type GeneratePresentationMutationError = ErrorType<ApiError>;
/**
* @summary Generate a new PPT presentation
*/
export declare const useGeneratePresentation: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generatePresentation>>, TError, {
        data: BodyType<PresentationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generatePresentation>>, TError, {
    data: BodyType<PresentationInput>;
}, TContext>;
export declare const getGetPresentationUrl: (id: string) => string;
/**
 * @summary Get a presentation by ID
 */
export declare const getPresentation: (id: string, options?: RequestInit) => Promise<Presentation>;
export declare const getGetPresentationQueryKey: (id: string) => readonly [`/api/presentations/${string}`];
export declare const getGetPresentationQueryOptions: <TData = Awaited<ReturnType<typeof getPresentation>>, TError = ErrorType<ApiError>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPresentation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPresentation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPresentationQueryResult = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;
export type GetPresentationQueryError = ErrorType<ApiError>;
/**
 * @summary Get a presentation by ID
 */
export declare function useGetPresentation<TData = Awaited<ReturnType<typeof getPresentation>>, TError = ErrorType<ApiError>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPresentation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeletePresentationUrl: (id: string) => string;
/**
 * @summary Delete a presentation
 */
export declare const deletePresentation: (id: string, options?: RequestInit) => Promise<ApiError>;
export declare const getDeletePresentationMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePresentation>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePresentation>>, TError, {
    id: string;
}, TContext>;
export type DeletePresentationMutationResult = NonNullable<Awaited<ReturnType<typeof deletePresentation>>>;
export type DeletePresentationMutationError = ErrorType<ApiError>;
/**
* @summary Delete a presentation
*/
export declare const useDeletePresentation: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePresentation>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePresentation>>, TError, {
    id: string;
}, TContext>;
export declare const getDownloadPresentationUrl: (id: string) => string;
/**
 * @summary Download the PPTX file for a presentation
 */
export declare const downloadPresentation: (id: string, options?: RequestInit) => Promise<Blob>;
export declare const getDownloadPresentationQueryKey: (id: string) => readonly [`/api/presentations/${string}/download`];
export declare const getDownloadPresentationQueryOptions: <TData = Awaited<ReturnType<typeof downloadPresentation>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadPresentation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof downloadPresentation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type DownloadPresentationQueryResult = NonNullable<Awaited<ReturnType<typeof downloadPresentation>>>;
export type DownloadPresentationQueryError = ErrorType<void>;
/**
 * @summary Download the PPTX file for a presentation
 */
export declare function useDownloadPresentation<TData = Awaited<ReturnType<typeof downloadPresentation>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadPresentation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetPresentationStatsUrl: () => string;
/**
 * @summary Get summary stats for all presentations
 */
export declare const getPresentationStats: (options?: RequestInit) => Promise<PresentationStats>;
export declare const getGetPresentationStatsQueryKey: () => readonly ["/api/presentations/stats"];
export declare const getGetPresentationStatsQueryOptions: <TData = Awaited<ReturnType<typeof getPresentationStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPresentationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPresentationStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPresentationStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getPresentationStats>>>;
export type GetPresentationStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get summary stats for all presentations
 */
export declare function useGetPresentationStats<TData = Awaited<ReturnType<typeof getPresentationStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPresentationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map