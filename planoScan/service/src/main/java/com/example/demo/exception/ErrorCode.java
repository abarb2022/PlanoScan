package com.example.demo.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "Store was not found"),
    COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND, "Company was not found"),
    STORE_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "Store with this name already exists in the company"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Invalid request"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
