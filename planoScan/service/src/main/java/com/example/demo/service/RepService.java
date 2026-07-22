package com.example.demo.service;

import com.example.demo.dto.rep.RepPageResponseDto;
import com.example.demo.dto.rep.RepRequestDto;
import com.example.demo.dto.rep.RepResponseDto;
import com.example.demo.dto.store.StoreResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.StoreAssignmentRepository;
import com.example.demo.repository.StoreAssignmentRuleRepository;
import com.example.demo.repository.StoreRepository;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.UserRepository;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
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
public class RepService {

  private static final String TEMP_CHARS =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  private final UserRepository userRepository;
  private final CompanyRepository companyRepository;
  private final StoreRepository storeRepository;
  private final StoreAssignmentRuleRepository ruleRepository;
  private final StoreAssignmentRepository assignmentRepository;
  private final SubmissionRepository submissionRepository;
  private final PasswordEncoder passwordEncoder;
  private final EmailService emailService;

  @Transactional
  public RepResponseDto createRep(RepRequestDto dto, String currentUserEmail) {
    if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
      throw new ServerException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User currentUser = getCurrentUser(currentUserEmail);
    Company company = resolveCompany(currentUser, dto.getCompanyId());

    String tempPassword = generateTempPassword();
    log.info("[DEV] Temporary password for {}: {}", dto.getEmail(), tempPassword);

    User rep =
        User.builder()
            .name(dto.getName())
            .surname(dto.getSurname())
            .email(dto.getEmail())
            .phone(dto.getPhone())
            .passwordHash(passwordEncoder.encode(tempPassword))
            .role(User.Role.REP)
            .company(company)
            .mustChangePassword(true)
            .build();

    RepResponseDto response = toDto(userRepository.save(rep));
    emailService.sendTemporaryPassword(dto.getEmail(), dto.getName(), tempPassword);
    return response;
  }

  @Transactional(readOnly = true)
  public RepPageResponseDto getReps(int page, int size, UUID companyId, String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    Page<User> result;
    if (currentUser.getRole() == User.Role.ADMIN) {
      result = companyId != null
          ? userRepository.findByCompanyIdAndRole(companyId, User.Role.REP, pageable)
          : userRepository.findByRole(User.Role.REP, pageable);
    } else {
      result = userRepository.findByCompanyIdAndRole(
          currentUser.getCompany().getId(), User.Role.REP, pageable);
    }

    List<UUID> repIds = result.getContent().stream().map(User::getId).toList();
    Map<UUID, List<RepResponseDto.AssignedStoreSummary>> storesByRep =
        repIds.isEmpty()
            ? Map.of()
            : ruleRepository.findByAssigneeIdIn(repIds).stream()
                .collect(
                    Collectors.groupingBy(
                        r -> r.getAssignee().getId(),
                        Collectors.collectingAndThen(
                            Collectors.toList(),
                            rules ->
                                rules.stream()
                                    .collect(
                                        Collectors.toMap(
                                            r -> r.getStore().getId(),
                                            r ->
                                                new RepResponseDto.AssignedStoreSummary(
                                                    r.getStore().getId(), r.getStore().getName()),
                                            (a, b) -> a))
                                    .values()
                                    .stream()
                                    .toList())));

    return new RepPageResponseDto(
        result.getContent().stream()
            .map(u -> toDto(u, storesByRep.getOrDefault(u.getId(), List.of())))
            .toList(),
        result.getTotalPages(),
        result.getTotalElements(),
        result.getNumber());
  }

  @Transactional(readOnly = true)
  public RepResponseDto getRepById(UUID id) {
    return toDto(findRep(id));
  }

  @Transactional
  public RepResponseDto updateRep(UUID id, RepRequestDto dto) {
    User rep = findRep(id);

    if (!rep.getEmail().equals(dto.getEmail())
        && userRepository.findByEmail(dto.getEmail()).isPresent()) {
      throw new ServerException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    rep.setName(dto.getName());
    rep.setSurname(dto.getSurname());
    rep.setEmail(dto.getEmail());
    rep.setPhone(dto.getPhone());
    return toDto(userRepository.save(rep));
  }

  @Transactional
  public void deleteRep(UUID id) {
    User rep = findRep(id);

    if (submissionRepository.existsByRepId(id)) {
      throw new ServerException(ErrorCode.REP_HAS_SUBMISSIONS);
    }

    assignmentRepository.deleteAllByAssigneeId(id);
    ruleRepository.deleteAllByAssigneeId(id);
    userRepository.delete(rep);
  }

  @Transactional(readOnly = true)
  public List<StoreResponseDto> getAvailableStores(String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);

    return (currentUser.getRole() == User.Role.ADMIN
            ? storeRepository.findAll()
            : storeRepository.findByCompanyId(currentUser.getCompany().getId()))
        .stream()
            .map(
                s ->
                    StoreResponseDto.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .address(s.getAddress())
                        .companyId(s.getCompany().getId())
                        .companyName(s.getCompany().getName())
                        .build())
            .toList();
  }

  private User getCurrentUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private User findRep(UUID id) {
    return userRepository
        .findById(id)
        .filter(u -> u.getRole() == User.Role.REP)
        .orElseThrow(() -> new ServerException(ErrorCode.REP_NOT_FOUND));
  }

  private Company resolveCompany(User currentUser, UUID companyId) {
    if (currentUser.getRole() == User.Role.ADMIN && companyId != null) {
      return companyRepository
          .findById(companyId)
          .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));
    }
    Company company = currentUser.getCompany();
    if (company == null) {
      throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    }
    return company;
  }

  private String generateTempPassword() {
    SecureRandom random = new SecureRandom();
    StringBuilder sb = new StringBuilder(10);
    for (int i = 0; i < 10; i++) {
      sb.append(TEMP_CHARS.charAt(random.nextInt(TEMP_CHARS.length())));
    }
    return sb.toString();
  }

  private RepResponseDto toDto(User user) {
    return toDto(user, List.of());
  }

  private RepResponseDto toDto(
      User user, List<RepResponseDto.AssignedStoreSummary> assignedStores) {
    return RepResponseDto.builder()
        .id(user.getId())
        .name(user.getName())
        .surname(user.getSurname())
        .email(user.getEmail())
        .phone(user.getPhone())
        .companyId(user.getCompany().getId())
        .companyName(user.getCompany().getName())
        .createdAt(user.getCreatedAt())
        .assignedStores(assignedStores)
        .build();
  }
}
