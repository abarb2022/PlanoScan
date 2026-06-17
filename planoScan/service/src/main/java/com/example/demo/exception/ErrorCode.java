package com.example.demo.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
  STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "Store was not found"),
  COMPANY_NOT_FOUND(HttpStatus.NOT_FOUND, "Company was not found"),
  STORE_ALREADY_EXISTS(
      HttpStatus.BAD_REQUEST, "Store with this name already exists in the company"),
  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User was not found"),
  EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email already registered"),
  INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "Invalid password"),
  UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "You are not authenticated. Please login first."),
  ACCESS_DENIED(HttpStatus.FORBIDDEN, "You do not have permission to access."),
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
