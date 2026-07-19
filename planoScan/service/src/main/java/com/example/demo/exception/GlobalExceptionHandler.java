package com.example.demo.exception;

import static com.example.demo.exception.ErrorResponseMapper.toResponse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ServerException.class)
  public ResponseEntity<ErrorResponse> handleServerException(ServerException ex) {
    ErrorCode errorCode = ex.getErrorCode();
    return ResponseEntity.status(errorCode.getStatus()).body(toResponse(errorCode));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationException(
      MethodArgumentNotValidException ex) {
    String fieldErrors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("Invalid request");
    ErrorResponse body =
        new ErrorResponse(
            ErrorCode.VALIDATION_ERROR.name(), fieldErrors, HttpStatus.BAD_REQUEST.value());
    return ResponseEntity.badRequest().body(body);
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    MethodArgumentTypeMismatchException.class
  })
  public ResponseEntity<ErrorResponse> handleParseException(Exception ex) {
    log.warn("Request parse error: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(toResponse(ErrorCode.VALIDATION_ERROR));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(new ErrorResponse("ACCESS_DENIED", "Access denied", HttpStatus.FORBIDDEN.value()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
    log.error("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
    String msg = ex.getMostSpecificCause().getMessage();
    if (msg != null && msg.contains("users_email_key")) {
      return ResponseEntity.status(HttpStatus.CONFLICT)
          .body(toResponse(ErrorCode.EMAIL_ALREADY_EXISTS));
    }
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            new ErrorResponse(
                "DATA_CONFLICT",
                "Operation violates a data constraint",
                HttpStatus.CONFLICT.value()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpectedException(Exception ex) {
    log.error("Unexpected error: {}", ex.getMessage(), ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(toResponse(ErrorCode.INTERNAL_ERROR));
  }
}
