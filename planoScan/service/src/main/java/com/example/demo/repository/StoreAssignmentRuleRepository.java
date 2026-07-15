package com.example.demo.repository;

import com.example.demo.entity.StoreAssignmentRule;
import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreAssignmentRuleRepository extends JpaRepository<StoreAssignmentRule, UUID> {

  List<StoreAssignmentRule> findByAssigneeId(UUID assigneeId);

  List<StoreAssignmentRule> findByAssigneeIdIn(List<UUID> assigneeIds);

  boolean existsByStoreIdAndAssigneeIdAndDayOfWeek(
      UUID storeId, UUID assigneeId, DayOfWeek dayOfWeek);

  @Modifying
  @Query("DELETE FROM StoreAssignmentRule r WHERE r.assignee.id = :assigneeId")
  void deleteAllByAssigneeId(@Param("assigneeId") UUID assigneeId);
}
