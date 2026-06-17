package com.example.demo.exception;

public final class ErrorResponseMapper {

  private ErrorResponseMapper() {}

  public static ErrorResponse toResponse(ErrorCode errorCode) {
    return new ErrorResponse(
        errorCode.name(), errorCode.getMessage(), errorCode.getStatus().value());
  }
}
