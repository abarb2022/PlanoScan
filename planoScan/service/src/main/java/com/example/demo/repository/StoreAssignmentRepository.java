package com.example.demo.repository;

import com.example.demo.entity.StoreAssignment;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreAssignmentRepository extends JpaRepository<StoreAssignment, UUID> {
  List<StoreAssignment> findByAssigneeIdAndAssignmentDate(UUID assigneeId, LocalDate assignmentDate);

  List<StoreAssignment> findByStoreIdAndAssignmentDate(UUID storeId, LocalDate assignmentDate);
}
