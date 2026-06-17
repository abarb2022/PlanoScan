package com.example.demo.security;

import static com.example.demo.exception.ErrorResponseMapper.toResponse;

import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class AuthEntryPoint implements AuthenticationEntryPoint {

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {

    response.setContentType("application/json");
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

    ErrorResponse error = toResponse(ErrorCode.UNAUTHENTICATED);
    new ObjectMapper().writeValue(response.getOutputStream(), error);
  }
}
