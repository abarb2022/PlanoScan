package com.example.demo.service;

import com.example.demo.dto.assignment.AssignmentRuleCompanySyncRequestDto;
import com.example.demo.dto.assignment.AssignmentRuleResponseDto;
import com.example.demo.dto.assignment.StoreRepDaysDto;
import com.example.demo.entity.Store;
import com.example.demo.entity.StoreAssignmentRule;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.StoreAssignmentRepository;
import com.example.demo.repository.StoreAssignmentRuleRepository;
import com.example.demo.repository.StoreRepository;
import com.example.demo.repository.UserRepository;
import java.time.DayOfWeek;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreAssignmentRuleService {

  private final StoreAssignmentRuleRepository ruleRepository;
  private final StoreAssignmentRepository assignmentRepository;
  private final StoreRepository storeRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<AssignmentRuleResponseDto> getRulesForCompany(UUID companyId, String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);

    List<StoreAssignmentRule> rules;
    if (currentUser.getRole() == User.Role.ADMIN) {
      rules =
          companyId != null
              ? ruleRepository.findByAssignee_Company_Id(companyId)
              : ruleRepository.findAll();
    } else {
      rules = ruleRepository.findByAssignee_Company_Id(requireOwnCompanyId(currentUser));
    }

    return rules.stream().map(this::toDto).toList();
  }

  @Transactional
  public List<AssignmentRuleResponseDto> syncRulesForCompany(
      AssignmentRuleCompanySyncRequestDto dto, String currentUserEmail) {
    User currentUser = getCurrentUser(currentUserEmail);
    UUID targetCompanyId =
        currentUser.getRole() == User.Role.ADMIN
            ? dto.getCompanyId()
            : requireOwnCompanyId(currentUser);
    if (targetCompanyId == null) {
      throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    }

    Set<UUID> storeIds =
        dto.getAssignments().stream().map(StoreRepDaysDto::getStoreId).collect(Collectors.toSet());
    Set<UUID> repIds =
        dto.getAssignments().stream().map(StoreRepDaysDto::getRepId).collect(Collectors.toSet());

    Map<UUID, Store> storeById =
        storeIds.isEmpty()
            ? Map.of()
            : storeRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(Store::getId, s -> s));
    Map<UUID, User> repById =
        repIds.isEmpty()
            ? Map.of()
            : userRepository.findAllById(repIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

    for (UUID storeId : storeIds) {
      Store store = storeById.get(storeId);
      if (store == null || !store.getCompany().getId().equals(targetCompanyId)) {
        throw new ServerException(ErrorCode.STORE_NOT_FOUND);
      }
    }
    for (UUID repId : repIds) {
      User rep = repById.get(repId);
      if (rep == null
          || rep.getRole() != User.Role.REP
          || !rep.getCompany().getId().equals(targetCompanyId)) {
        throw new ServerException(ErrorCode.REP_NOT_FOUND);
      }
    }

    List<StoreAssignmentRule> existingRules = ruleRepository.findByAssignee_Company_Id(targetCompanyId);
    Map<AssignmentKey, StoreAssignmentRule> existingByKey =
        existingRules.stream()
            .collect(
                Collectors.toMap(
                    r ->
                        new AssignmentKey(
                            r.getStore().getId(), r.getAssignee().getId(), r.getDayOfWeek()),
                    r -> r));

    Set<AssignmentKey> desiredKeys = new HashSet<>();
    Map<AssignmentKey, StoreRepDaysDto> desiredSource = new HashMap<>();
    for (StoreRepDaysDto assignment : dto.getAssignments()) {
      for (DayOfWeek day : assignment.getDays()) {
        AssignmentKey key = new AssignmentKey(assignment.getStoreId(), assignment.getRepId(), day);
        desiredKeys.add(key);
        desiredSource.put(key, assignment);
      }
    }

    List<UUID> toDeleteIds =
        existingByKey.entrySet().stream()
            .filter(e -> !desiredKeys.contains(e.getKey()))
            .map(e -> e.getValue().getId())
            .toList();
    for (UUID ruleId : toDeleteIds) {
      assignmentRepository.cancelAssignedByRuleId(ruleId);
      assignmentRepository.detachFromRule(ruleId);
    }
    if (!toDeleteIds.isEmpty()) {
      ruleRepository.deleteAllByIdInBatch(toDeleteIds);
    }

    User assignedBy = currentUser;
    List<StoreAssignmentRule> toCreate =
        desiredKeys.stream()
            .filter(key -> !existingByKey.containsKey(key))
            .map(
                key -> {
                  StoreRepDaysDto source = desiredSource.get(key);
                  return StoreAssignmentRule.builder()
                      .store(storeById.get(key.storeId()))
                      .assignee(repById.get(key.repId()))
                      .assignedBy(assignedBy)
                      .repeatType(StoreAssignmentRule.RepeatType.WEEKLY)
                      .dayOfWeek(key.dayOfWeek())
                      .validFrom(source.getValidFrom())
                      .validUntil(source.getValidUntil())
                      .build();
                })
            .toList();
    ruleRepository.saveAll(toCreate);

    List<StoreAssignmentRule> toUpdate =
        desiredKeys.stream()
            .filter(existingByKey::containsKey)
            .map(
                key -> {
                  StoreAssignmentRule rule = existingByKey.get(key);
                  StoreRepDaysDto source = desiredSource.get(key);
                  boolean changed =
                      !Objects.equals(rule.getValidFrom(), source.getValidFrom())
                          || !Objects.equals(rule.getValidUntil(), source.getValidUntil());
                  if (changed) {
                    rule.setValidFrom(source.getValidFrom());
                    rule.setValidUntil(source.getValidUntil());
                  }
                  return changed ? rule : null;
                })
            .filter(Objects::nonNull)
            .toList();
    if (!toUpdate.isEmpty()) {
      ruleRepository.saveAll(toUpdate);
    }

    return ruleRepository.findByAssignee_Company_Id(targetCompanyId).stream()
        .map(this::toDto)
        .toList();
  }

  private User getCurrentUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private UUID requireOwnCompanyId(User user) {
    if (user.getCompany() == null) {
      throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    }
    return user.getCompany().getId();
  }

  private record AssignmentKey(UUID storeId, UUID repId, DayOfWeek dayOfWeek) {}

  private AssignmentRuleResponseDto toDto(StoreAssignmentRule rule) {
    return AssignmentRuleResponseDto.builder()
        .id(rule.getId())
        .storeId(rule.getStore().getId())
        .storeName(rule.getStore().getName())
        .storeAddress(rule.getStore().getAddress())
        .repId(rule.getAssignee().getId())
        .repName(rule.getAssignee().getName())
        .repeatType(rule.getRepeatType().name())
        .dayOfWeek(rule.getDayOfWeek())
        .validFrom(rule.getValidFrom())
        .validUntil(rule.getValidUntil())
        .createdAt(rule.getCreatedAt())
        .build();
  }
}
