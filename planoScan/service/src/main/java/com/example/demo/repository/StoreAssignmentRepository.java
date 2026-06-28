package com.example.demo.repository;

import com.example.demo.entity.StoreAssignment;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreAssignmentRepository extends JpaRepository<StoreAssignment, UUID> {
  List<StoreAssignment> findByAssigneeIdAndAssignmentDate(
      UUID assigneeId, LocalDate assignmentDate);

  List<StoreAssignment> findByStoreIdAndAssignmentDate(UUID storeId, LocalDate assignmentDate);

  @Modifying
  @Query("DELETE FROM StoreAssignment a WHERE a.assignee.id = :assigneeId")
  void deleteAllByAssigneeId(@Param("assigneeId") UUID assigneeId);
}
