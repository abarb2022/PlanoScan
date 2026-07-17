package com.example.demo.service;

import com.example.demo.dto.assignment.AssignmentRuleRequestDto;
import com.example.demo.dto.assignment.AssignmentRuleResponseDto;
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
import java.util.List;
import java.util.UUID;
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

  @Transactional
  public List<AssignmentRuleResponseDto> createRules(
      AssignmentRuleRequestDto dto, String currentUserEmail) {
    Store store =
        storeRepository
            .findById(dto.getStoreId())
            .orElseThrow(() -> new ServerException(ErrorCode.STORE_NOT_FOUND));

    User rep =
        userRepository
            .findById(dto.getRepId())
            .filter(u -> u.getRole() == User.Role.REP)
            .orElseThrow(() -> new ServerException(ErrorCode.REP_NOT_FOUND));

    User assignedBy =
        userRepository
            .findByEmail(currentUserEmail)
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    List<DayOfWeek> newDays =
        dto.getDays().stream()
            .filter(
                day ->
                    !ruleRepository.existsByStoreIdAndAssigneeIdAndDayOfWeek(
                        store.getId(), rep.getId(), day))
            .toList();

    if (newDays.isEmpty()) {
      throw new ServerException(ErrorCode.DUPLICATE_ASSIGNMENT_RULE);
    }

    List<StoreAssignmentRule> rules =
        newDays.stream()
            .map(
                day ->
                    StoreAssignmentRule.builder()
                        .store(store)
                        .assignee(rep)
                        .assignedBy(assignedBy)
                        .repeatType(StoreAssignmentRule.RepeatType.WEEKLY)
                        .dayOfWeek(day)
                        .validFrom(dto.getValidFrom())
                        .validUntil(dto.getValidUntil())
                        .build())
            .toList();

    return ruleRepository.saveAll(rules).stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<AssignmentRuleResponseDto> getRulesForRep(UUID repId) {
    return ruleRepository.findByAssigneeId(repId).stream().map(this::toDto).toList();
  }

  @Transactional
  public void deleteRule(UUID id) {
    if (!ruleRepository.existsById(id)) {
      throw new ServerException(ErrorCode.ASSIGNMENT_RULE_NOT_FOUND);
    }
    assignmentRepository.cancelAssignedByRuleId(id);
    assignmentRepository.detachFromRule(id);
    ruleRepository.deleteById(id);
  }

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
