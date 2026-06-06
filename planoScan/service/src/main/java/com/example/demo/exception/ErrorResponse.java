package com.example.demo.exception;

public record ErrorResponse(
        String code,
        String message,
        int status
) {
}
