package com.example.demo.security;

import static com.example.demo.exception.ErrorResponseMapper.toResponse;

import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

  @Override
  public void handle(
      HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException)
      throws IOException {

    response.setContentType("application/json");
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);

    ErrorResponse error = toResponse(ErrorCode.ACCESS_DENIED);
    new ObjectMapper().writeValue(response.getOutputStream(), error);
  }
}
