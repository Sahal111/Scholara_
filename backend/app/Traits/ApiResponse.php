<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    /**
     * Response sukses — single resource atau collection.
     *
     * Mendukung:
     *  - LengthAwarePaginator langsung → meta + links otomatis
     *  - ResourceCollection yang wrap LengthAwarePaginator → sama, dengan transformasi Resource
     *  - Data biasa (array, model, Resource) → { success, data }
     */
    protected function success(
        mixed $data = null,
        string $message = '',
        int $status = 200
    ): JsonResponse {
        $response = ['success' => true];

        if ($message !== '') {
            $response['message'] = $message;
        }

        // ResourceCollection yang wrap LengthAwarePaginator
        if ($data instanceof ResourceCollection && $data->resource instanceof LengthAwarePaginator) {
            $paginator = $data->resource;
            $response['data'] = $data->resolve(request());
            $response['meta'] = [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ];
            $response['links'] = [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ];
        } elseif ($data instanceof LengthAwarePaginator) {
            $response['data'] = $data->items();
            $response['meta'] = [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ];
            $response['links'] = [
                'first' => $data->url(1),
                'last' => $data->url($data->lastPage()),
                'prev' => $data->previousPageUrl(),
                'next' => $data->nextPageUrl(),
            ];
        } elseif ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $status);
    }

    /**
     * Response 201 Created — setelah berhasil membuat resource baru.
     */
    protected function created(
        mixed $data,
        string $message = 'Data berhasil ditambahkan.'
    ): JsonResponse {
        return $this->success($data, $message, 201);
    }

    /**
     * Response 204 No Content — untuk logout dan aksi yang tidak perlu return data.
     */
    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Response error generik.
     *
     * @param  array|null  $errors  Untuk validation error, berisi field → messages
     */
    protected function error(
        string $message,
        string $code = 'SERVER_ERROR',
        int $status = 500,
        mixed $errors = null
    ): JsonResponse {
        $response = [
            'success' => false,
            'code' => $code,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Response 422 Validation Error.
     */
    protected function validationError(
        array $errors,
        string $message = 'Data yang dikirim tidak valid.'
    ): JsonResponse {
        return $this->error($message, 'VALIDATION_ERROR', 422, $errors);
    }

    /**
     * Response 404 Not Found.
     */
    protected function notFound(string $message = 'Data tidak ditemukan.'): JsonResponse
    {
        return $this->error($message, 'NOT_FOUND', 404);
    }

    /**
     * Response 403 Forbidden.
     */
    protected function forbidden(string $message = 'Kamu tidak memiliki izin untuk melakukan tindakan ini.'): JsonResponse
    {
        return $this->error($message, 'FORBIDDEN', 403);
    }

    /**
     * Response 409 Conflict — misal: data duplikat.
     */
    protected function conflict(string $message): JsonResponse
    {
        return $this->error($message, 'CONFLICT', 409);
    }
}