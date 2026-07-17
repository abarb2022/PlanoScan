package com.example.demo.service;

import com.example.demo.entity.Company;
import com.example.demo.entity.User;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements ApplicationRunner {

  @Value("${app.admin.email}")
  private String adminEmail;

  @Value("${app.admin.password}")
  private String adminPassword;

  @Value("${app.admin.name}")
  private String adminName;

  private final UserRepository userRepository;
  private final CompanyRepository companyRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (userRepository.findByEmail(adminEmail).isPresent()) {
      return;
    }

    Company company =
        companyRepository
            .findByName("System")
            .orElseGet(() -> companyRepository.save(Company.builder().name("System").build()));

    userRepository.save(
        User.builder()
            .name(adminName)
            .email(adminEmail)
            .passwordHash(passwordEncoder.encode(adminPassword))
            .role(User.Role.ADMIN)
            .company(company)
            .mustChangePassword(false)
            .build());

    log.info("Admin user seeded: {}", adminEmail);
  }
}
