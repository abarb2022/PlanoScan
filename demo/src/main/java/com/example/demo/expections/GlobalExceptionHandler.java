package com.example.demo.exception;

import static com.example.demo.exception.ErrorResponseMapper.toResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ServerException.class)
  public ResponseEntity<ErrorResponse> handleServerException(ServerException ex) {
    ErrorCode errorCode = ex.getErrorCode();
    return ResponseEntity.status(errorCode.getStatus()).body(toResponse(errorCode));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationException() {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(toResponse(ErrorCode.VALIDATION_ERROR));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpectedException() {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(toResponse(ErrorCode.INTERNAL_ERROR));
  }
}
