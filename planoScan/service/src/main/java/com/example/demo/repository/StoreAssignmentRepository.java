package com.example.demo.repository;

import com.example.demo.entity.StoreAssignment;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreAssignmentRepository
    extends JpaRepository<StoreAssignment, UUID>, JpaSpecificationExecutor<StoreAssignment> {
  List<StoreAssignment> findByAssigneeIdAndAssignmentDate(UUID assigneeId, LocalDate assignmentDate);

  List<StoreAssignment> findByStoreIdAndAssignmentDate(UUID storeId, LocalDate assignmentDate);

  @Modifying
  @Query("DELETE FROM StoreAssignment a WHERE a.assignee.id = :assigneeId")
  void deleteAllByAssigneeId(@Param("assigneeId") UUID assigneeId);

  boolean existsByRuleIdAndAssignmentDate(UUID ruleId, LocalDate assignmentDate);

  @Modifying
  @Query(
      "UPDATE StoreAssignment a SET a.status = com.example.demo.entity.StoreAssignment.Status.CANCELLED"
          + " WHERE a.rule.id = :ruleId AND a.status = com.example.demo.entity.StoreAssignment.Status.ASSIGNED")
  void cancelAssignedByRuleId(@Param("ruleId") UUID ruleId);

  @Modifying
  @Query("UPDATE StoreAssignment a SET a.rule = null WHERE a.rule.id = :ruleId")
  void detachFromRule(@Param("ruleId") UUID ruleId);

  @Modifying
  @Query(
      "UPDATE StoreAssignment a SET a.status = com.example.demo.entity.StoreAssignment.Status.MISSED"
          + " WHERE a.assignee.id = :repId AND a.assignmentDate < :today"
          + " AND a.status = com.example.demo.entity.StoreAssignment.Status.ASSIGNED")
  void markMissedForRep(@Param("repId") UUID repId, @Param("today") LocalDate today);

  @EntityGraph(
      attributePaths = {
        "store",
        "store.company",
        "submissions",
        "submissions.planogram",
        "submissions.score"
      })
  List<StoreAssignment> findByIdIn(List<UUID> ids);
}
