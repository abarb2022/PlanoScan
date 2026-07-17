package com.example.demo.service;

import com.example.demo.entity.StoreAssignment;
import com.example.demo.entity.StoreAssignmentRule;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.StoreAssignmentRepository;
import com.example.demo.repository.StoreAssignmentRuleRepository;
import com.example.demo.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssignmentGenerationService {

  private final UserRepository userRepository;
  private final StoreAssignmentRuleRepository ruleRepository;
  private final StoreAssignmentRepository assignmentRepository;

  @Transactional
  public void ensureTodaysAssignments(String repEmail, LocalDate today) {
    User rep =
        userRepository
            .findByEmail(repEmail)
            .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));

    assignmentRepository.markMissedForRep(rep.getId(), today);

    DayOfWeek todayDow = today.getDayOfWeek();
    List<StoreAssignmentRule> activeRules =
        ruleRepository.findByAssigneeId(rep.getId()).stream()
            .filter(rule -> rule.getDayOfWeek() == todayDow)
            .filter(rule -> !rule.getValidFrom().isAfter(today))
            .filter(rule -> rule.getValidUntil() == null || !rule.getValidUntil().isBefore(today))
            .toList();

    for (StoreAssignmentRule rule : activeRules) {
      if (!assignmentRepository.existsByRuleIdAndAssignmentDate(rule.getId(), today)) {
        assignmentRepository.save(
            StoreAssignment.builder()
                .rule(rule)
                .store(rule.getStore())
                .assignee(rep)
                .assignedBy(rule.getAssignedBy())
                .assignmentDate(today)
                .build());
      }
    }
  }
}
