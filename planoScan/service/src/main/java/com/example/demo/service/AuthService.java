package com.example.demo.service;

import com.example.demo.dto.request.ChangePasswordRequest;
import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new ServerException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User user = new User();
    user.setEmail(request.getEmail());
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setRole(request.getRole());

    userRepository.save(user);

    String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
    return new AuthResponse(token, false);
  }

  public AuthResponse login(LoginRequest request) {
    User user =
        userRepository
            .findByEmail(request.getEmail())
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new ServerException(ErrorCode.INVALID_PASSWORD);
    }

    String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
    return new AuthResponse(token, user.isMustChangePassword());
  }

  @Transactional
  public void changePassword(String email, ChangePasswordRequest request) {
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
      throw new ServerException(ErrorCode.INVALID_CURRENT_PASSWORD);
    }

    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    user.setMustChangePassword(false);
    userRepository.save(user);
  }
}
