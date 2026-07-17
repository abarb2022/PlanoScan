package com.example.demo.service;

import com.example.demo.dto.manager.ManagerPageResponseDto;
import com.example.demo.dto.manager.ManagerRequestDto;
import com.example.demo.dto.manager.ManagerResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.UserRepository;
import java.security.SecureRandom;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ManagerService {

  private static final String TEMP_CHARS =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  private final UserRepository userRepository;
  private final CompanyRepository companyRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional
  public ManagerResponseDto createManager(ManagerRequestDto dto) {
    if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
      throw new ServerException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    Company company =
        companyRepository
            .findById(dto.getCompanyId())
            .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));

    String tempPassword = generateTempPassword();
    log.info("[DEV] Temporary password for {}: {}", dto.getEmail(), tempPassword);

    User manager =
        User.builder()
            .name(dto.getName())
            .surname(dto.getSurname())
            .email(dto.getEmail())
            .phone(dto.getPhone())
            .passwordHash(passwordEncoder.encode(tempPassword))
            .role(User.Role.MANAGER)
            .company(company)
            .mustChangePassword(true)
            .build();

    return toDto(userRepository.save(manager));
  }

  @Transactional(readOnly = true)
  public ManagerPageResponseDto getManagers(int page, int size, UUID companyId) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<User> result = companyId != null
        ? userRepository.findByCompanyIdAndRole(companyId, User.Role.MANAGER, pageable)
        : userRepository.findByRole(User.Role.MANAGER, pageable);

    return new ManagerPageResponseDto(
        result.getContent().stream().map(this::toDto).toList(),
        result.getTotalPages(),
        result.getTotalElements(),
        result.getNumber());
  }

  @Transactional
  public ManagerResponseDto updateManager(UUID id, ManagerRequestDto dto) {
    User manager = findManager(id);

    if (!manager.getEmail().equals(dto.getEmail())
        && userRepository.findByEmail(dto.getEmail()).isPresent()) {
      throw new ServerException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    Company company =
        companyRepository
            .findById(dto.getCompanyId())
            .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));

    manager.setName(dto.getName());
    manager.setSurname(dto.getSurname());
    manager.setEmail(dto.getEmail());
    manager.setPhone(dto.getPhone());
    manager.setCompany(company);
    return toDto(userRepository.save(manager));
  }

  @Transactional
  public void deleteManager(UUID id) {
    User manager = findManager(id);
    userRepository.delete(manager);
  }

  private User findManager(UUID id) {
    return userRepository
        .findById(id)
        .filter(u -> u.getRole() == User.Role.MANAGER)
        .orElseThrow(() -> new ServerException(ErrorCode.MANAGER_NOT_FOUND));
  }

  private String generateTempPassword() {
    SecureRandom random = new SecureRandom();
    StringBuilder sb = new StringBuilder(10);
    for (int i = 0; i < 10; i++) {
      sb.append(TEMP_CHARS.charAt(random.nextInt(TEMP_CHARS.length())));
    }
    return sb.toString();
  }

  private ManagerResponseDto toDto(User user) {
    return ManagerResponseDto.builder()
        .id(user.getId())
        .name(user.getName())
        .surname(user.getSurname())
        .email(user.getEmail())
        .phone(user.getPhone())
        .companyId(user.getCompany().getId())
        .companyName(user.getCompany().getName())
        .createdAt(user.getCreatedAt())
        .build();
  }
}
